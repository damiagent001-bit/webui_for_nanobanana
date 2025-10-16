import os
import time
import uuid
import base64
from datetime import datetime
from typing import Optional, Dict, Any, List
from io import BytesIO
from PIL import Image
from google import genai
from google.genai import types
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_gemini_api_key, settings
from app.utils.logger import logger
from app.utils.helpers import generate_unique_filename, cleanup_temp_file


class GeminiService:
    """Gemini API服务类"""
    
    # 模型常量定义
    MODELS = {
        "IMAGE_GENERATION": "gemini-2.5-flash-image-preview",
        "IMAGE_ANALYSIS": "gemini-2.0-flash", 
        "VIDEO_GENERATION": "veo-3.0-generate-001",
        "VIDEO_GENERATION_FAST": "veo-3.0-fast-generate-001",
        "VIDEO_EXTENSION": "veo-3.1-generate-preview"
    }
    
    # 支持的参数
    SUPPORTED_ASPECT_RATIOS = ["1:1", "16:9", "9:16"]
    SUPPORTED_RESOLUTIONS = ["720p", "1080p"]
    SUPPORTED_PERSON_GENERATION = ["allow_all", "allow_adult", "dont_allow"]
    
    def __init__(self, api_key: Optional[str] = None):
        """初始化Gemini服务"""
        try:
            self.api_key = api_key or get_gemini_api_key()
            self.client = None
            self._init_client()
            # 会话级Video对象缓存 - 用于视频延长功能
            self._video_cache = {}  # {video_filename: {"video_object": Video, "chain": [filenames]}}
        except Exception as e:
            logger.warning(f"Gemini service initialization failed: {e}")
            self.api_key = api_key
            self.client = None
            self._video_cache = {}
    
    def _init_client(self):
        """初始化Gemini客户端"""
        try:
            if not self.api_key:
                raise ValueError("API key is required")
            from google import genai
            self.client = genai.Client(api_key=self.api_key)
            logger.info("Gemini client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.client = None
    
    def _ensure_client(self):
        """确保客户端已初始化，如果未初始化则尝试重新初始化"""
        if not self.client:
            logger.info("Client not initialized, attempting to reinitialize...")
            self._init_client()
        return self.client is not None
    
    def get_client_status(self):
        """获取客户端状态"""
        return {
            "initialized": self.client is not None,
            "api_key_configured": bool(self.api_key)
        }
    
    def _validate_video_params(self, aspect_ratio: str, resolution: str, person_generation: str):
        """验证视频生成参数"""
        if aspect_ratio not in self.SUPPORTED_ASPECT_RATIOS:
            raise ValueError(f"Unsupported aspect ratio: {aspect_ratio}. Supported: {self.SUPPORTED_ASPECT_RATIOS}")
        
        if resolution not in self.SUPPORTED_RESOLUTIONS:
            raise ValueError(f"Unsupported resolution: {resolution}. Supported: {self.SUPPORTED_RESOLUTIONS}")
        
        if person_generation not in self.SUPPORTED_PERSON_GENERATION:
            raise ValueError(f"Unsupported person generation: {person_generation}. Supported: {self.SUPPORTED_PERSON_GENERATION}")
        
        # 验证1080p分辨率条件
        if resolution == "1080p" and aspect_ratio != "16:9":
            raise ValueError("1080p resolution only supports 16:9 aspect ratio")
    
    def generate_image(self, prompt: str, aspect_ratio: str = "1:1") -> Dict[str, Any]:
        """生成图片 - 使用 Gemini 2.5 Flash Image Preview 模型"""
        try:
            if not self._ensure_client():
                return {
                    "success": False,
                    "error": "Gemini client not initialized",
                    "message": "Please configure API key first"
                }
            
            logger.info(f"Generating image with prompt: {prompt[:50]}...")
            
            # 调用Gemini图片生成API - 根据官方文档的正确方式
            response = self.client.models.generate_content(
                model=self.MODELS["IMAGE_GENERATION"],
                contents=[prompt],
            )
            
            # 处理响应 - 根据官方文档的示例代码
            saved_files = []
            if response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for i, part in enumerate(candidate.content.parts):
                            # 检查是否有图片数据
                            if part.inline_data and part.inline_data.data:
                                filename = self._save_image_from_data(part.inline_data.data, f"generated_image_{i}")
                                saved_files.append(filename)
                                logger.info(f"Saved generated image: {filename}")
                            # 检查是否有文本响应（可能包含错误信息）
                            elif part.text:
                                logger.info(f"Response text: {part.text}")
                                # 如果返回文本而不是图片，可能是提示词问题
                                if any(keyword in part.text.lower() for keyword in ["cannot", "unable", "can't", "不能", "无法"]):
                                    return {
                                        "success": False,
                                        "error": "API returned text instead of image",
                                        "message": f"图片生成失败：{part.text}"
                                    }
            
            if saved_files:
                return {
                    "success": True,
                    "files": saved_files,
                    "message": f"Successfully generated {len(saved_files)} image(s)"
                }
            else:
                return {
                    "success": False,
                    "error": "No images in response",
                    "message": "Image generation failed - no images returned. Please try a different prompt or check your API key."
                }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Image generation failed: {error_msg}")
            logger.error(f"API Key used: {self.api_key[:10] if self.api_key else 'None'}...")
            logger.error(f"Client status: {'Initialized' if self.client else 'Not initialized'}")
            return {
                "success": False,
                "error": error_msg,
                "message": f"Image generation failed: {error_msg}"
            }
    
    def generate_video_from_text(self, prompt: str, aspect_ratio: str = "16:9",
                                duration_seconds: int = 8, resolution: str = "720p",
                                person_generation: str = "allow_all", negative_prompt: str = "") -> Dict[str, Any]:
        """从文本生成视频 - 使用 Veo 3.0 模型"""
        try:
            if not self._ensure_client():
                return {
                    "success": False,
                    "error": "Gemini client not initialized",
                    "message": "Please configure API key first"
                }
            
            logger.info(f"Generating video from text: {prompt[:50]}...")
            
            # 验证参数
            self._validate_video_params(aspect_ratio, resolution, person_generation)
            
            # 调用Veo API - 根据官方示例代码的正确方式
            # 注意：使用snake_case参数名格式，与官方示例一致
            config_params = {
                "person_generation": person_generation,
                "aspect_ratio": aspect_ratio,
                "resolution": resolution,
                "durationSeconds": duration_seconds,
            }
            
            # 添加负提示（如果提供）
            if negative_prompt:
                config_params["negativePrompt"] = negative_prompt
            
            config = types.GenerateVideosConfig(**config_params)
            
            # 详细日志记录
            logger.info(f"=== 文生视频API调用详情 ===")
            logger.info(f"模型: {self.MODELS['VIDEO_GENERATION']}")
            logger.info(f"提示词: {prompt[:100]}...")
            logger.info(f"配置参数: {config_params}")
            logger.info(f"Config对象: {config}")
            
            operation = self.client.models.generate_videos(
                model=self.MODELS["VIDEO_GENERATION"],
                prompt=prompt,
                config=config
            )
            
            logger.info(f"Operation对象: {operation}")
            logger.info(f"Operation类型: {type(operation)}")
            
            # 等待视频生成完成 - 根据官方文档的轮询方式
            while not operation.done:
                logger.info("Waiting for video generation to complete...")
                time.sleep(10)  # 官方文档建议10秒间隔
                operation = self.client.operations.get(operation)
            
            # 下载生成的视频
            if not operation.response.generated_videos:
                raise Exception("无法根据要求生成视频")
            
            # 处理生成的视频
            for n, video in enumerate(operation.response.generated_videos):
                try:
                    filename = self._download_video(video.video, "text_to_video")
                    logger.info(f"成功下载视频 {n}: {filename}")
                    
                    # 缓存Video对象，用于后续延长功能
                    self._cache_video_object(filename, video.video, None)
                    logger.info(f"Video对象已缓存，可用于延长: {filename}")
                    
                    return {
                        "success": True,
                        "file": filename,
                        "message": "Video generated successfully"
                    }
                except Exception as e:
                    logger.error(f"下载视频 {n} 失败: {str(e)}")
                    raise e
            
        except Exception as e:
            logger.error(f"Video generation from text failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Video generation from text failed"
            }
    
    def generate_video_from_image(self, prompt: str, image_path: str,
                                 aspect_ratio: str = "16:9",
                                 duration_seconds: int = 8, resolution: str = "720p",
                                 person_generation: str = "allow_adult", negative_prompt: str = "") -> Dict[str, Any]:
        """从图片生成视频 - 使用 Veo 3.0 模型"""
        try:
            if not self._ensure_client():
                return {
                    "success": False,
                    "error": "Gemini client not initialized",
                    "message": "Please configure API key first"
                }
            
            logger.info(f"Generating video from image: {prompt[:50]}...")
            
            # 验证参数
            self._validate_video_params(aspect_ratio, resolution, person_generation)
            
            # 验证person_generation参数（图生视频不支持allow_all）
            if person_generation == "allow_all":
                raise ValueError("Image to video generation does not support generating videos with both adults and children")
            
            # 读取并处理图片
            image = self._load_image(image_path)
            
            # 调用Veo API - 根据官方示例代码的正确方式
            # 注意：使用snake_case参数名格式，与官方示例一致
            config_params = {
                "person_generation": person_generation,
                "aspect_ratio": aspect_ratio,
                "resolution": resolution,
                "durationSeconds": duration_seconds,
            }
            
            # 添加负提示（如果提供）
            if negative_prompt:
                config_params["negativePrompt"] = negative_prompt
            
            config = types.GenerateVideosConfig(**config_params)
            
            # 详细日志记录
            logger.info(f"=== 图生视频API调用详情 ===")
            logger.info(f"模型: {self.MODELS['VIDEO_GENERATION']}")
            logger.info(f"提示词: {prompt[:100]}...")
            logger.info(f"图片路径: {image_path}")
            logger.info(f"图片对象: {type(image)}")
            logger.info(f"配置参数: {config_params}")
            logger.info(f"Config对象: {config}")
            
            operation = self.client.models.generate_videos(
                model=self.MODELS["VIDEO_GENERATION"],
                prompt=prompt,
                image=image,
                config=config
            )
            
            logger.info(f"Operation对象: {operation}")
            logger.info(f"Operation类型: {type(operation)}")
            
            # 等待视频生成完成 - 根据官方文档的轮询方式
            while not operation.done:
                logger.info("Waiting for video generation to complete...")
                time.sleep(10)  # 官方文档建议10秒间隔
                operation = self.client.operations.get(operation)
            
            # 下载生成的视频
            if not operation.response.generated_videos:
                raise Exception("无法根据要求生成视频")
            
            # 处理生成的视频
            for n, video in enumerate(operation.response.generated_videos):
                try:
                    filename = self._download_video(video.video, "image_to_video")
                    logger.info(f"成功下载视频 {n}: {filename}")
                    
                    # 缓存Video对象，用于后续延长功能
                    self._cache_video_object(filename, video.video, None)
                    logger.info(f"Video对象已缓存，可用于延长: {filename}")
                    
                    return {
                        "success": True,
                        "file": filename,
                        "message": "Video generated successfully"
                    }
                except Exception as e:
                    logger.error(f"下载视频 {n} 失败: {str(e)}")
                    raise e
            
        except Exception as e:
            logger.error(f"Video generation from image failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Video generation from image failed"
            }
    
    def analyze_image(self, image_path: str, analysis_prompt: str = "Describe this image in detail") -> Dict[str, Any]:
        """分析图片"""
        try:
            logger.info(f"Analyzing image: {image_path}")
            
            # 读取图片
            image = self._load_image(image_path)
            
            # 调用Gemini分析
            response = self.client.models.generate_content(
                model=self.MODELS["IMAGE_ANALYSIS"],
                contents=[image, analysis_prompt]
            )
            
            return {
                "success": True,
                "analysis": response.text,
                "message": "Image analysis completed"
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Image analysis failed"
            }
    
    def _load_image(self, image_path: str):
        """加载图片为Gemini Image类型"""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        with open(image_path, "rb") as img_file:
            image_data = img_file.read()
        
        # 获取MIME类型
        file_ext = os.path.splitext(image_path)[1].lower()
        mime_type_map = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
        }
        mime_type = mime_type_map.get(file_ext, 'image/jpeg')
        
        # 使用types.Image对象，参考官方代码
        # 需要包含base64编码和MIME类型
        return types.Image(
            image_bytes=image_data,
            mime_type=mime_type
        )
    
    def _save_image_from_data(self, image_data: bytes, prefix: str) -> str:
        """从图片数据保存图片"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.png"
        filepath = os.path.join(settings.upload_folder, "images", filename)
        
        # 确保目录存在
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 检查图片数据
        if not image_data:
            logger.error("Image data is empty")
            raise ValueError("Image data is empty")
        
        # 保存图片数据
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        logger.info(f"Image saved: {filepath}")
        return f"/outputs/images/{filename}"
    
    def _save_video_from_data(self, video_data: bytes, prefix: str) -> str:
        """从视频数据保存视频"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.mp4"
        filepath = os.path.join(settings.upload_folder, "videos", filename)
        
        # 确保目录存在
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 检查视频数据
        if not video_data:
            logger.error("Video data is empty")
            raise ValueError("Video data is empty")
        
        # 保存视频数据
        with open(filepath, 'wb') as f:
            f.write(video_data)
        
        logger.info(f"Video saved: {filepath}")
        return f"/outputs/videos/{filename}"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def _save_image(self, image, prefix: str) -> str:
        """保存生成的图片"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.png"
        filepath = os.path.join(settings.upload_folder, "images", filename)
        
        # 确保目录存在
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 保存图片
        try:
            image.save(filepath)
            logger.info(f"Image saved: {filepath}")
        except Exception as e:
            logger.error(f"Failed to save image: {e}")
            # 尝试使用PIL保存
            try:
                from PIL import Image as PILImage
                import io
                if hasattr(image, 'image_bytes'):
                    pil_image = PILImage.open(io.BytesIO(image.image_bytes))
                    pil_image.save(filepath)
                    logger.info(f"Image saved with PIL: {filepath}")
                else:
                    raise Exception("No image data available")
            except Exception as e2:
                logger.error(f"Failed to save image with PIL: {e2}")
                raise e
        
        return f"/outputs/images/{filename}"
    
    def _download_video(self, video, prefix: str) -> str:
        """下载生成的视频 - 根据参考代码的实现"""
        @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
        def download_video_internal(client, video, path, prefix):
            timestamp_format = "%Y%m%d_%H%M%S"
            timestamp = datetime.now().strftime(timestamp_format)
            filename = f"{prefix}_{timestamp}.mp4"
            filepath = os.path.join(path, filename)
            client.files.download(file=video)
            video.save(filepath)
            return filename
        
        # 确保目录存在
        os.makedirs(settings.upload_folder + "/videos", exist_ok=True)
        
        try:
            filename = download_video_internal(self.client, video, settings.upload_folder + "/videos", prefix)
            logger.info(f"Video saved: {filename}")
            return f"/outputs/videos/{filename}"
        except Exception as e:
            logger.error(f"Failed to save video: {e}")
            raise e
    
    def _cache_video_object(self, filename: str, video_object, parent_filename: Optional[str] = None):
        """缓存Video对象用于延长功能
        
        Args:
            filename: 视频文件名
            video_object: Video对象
            parent_filename: 父视频文件名（如果是延长的话）
        """
        # 构建视频链
        chain = []
        if parent_filename and parent_filename in self._video_cache:
            # 继承父视频的链
            chain = self._video_cache[parent_filename]["chain"].copy()
            chain.append(parent_filename)
        
        self._video_cache[filename] = {
            "video_object": video_object,
            "chain": chain,
            "timestamp": time.time()
        }
        logger.info(f"Video cached: {filename}, chain length: {len(chain)}")
    
    def get_video_chain(self, filename: str) -> List[str]:
        """获取视频的延长历史链
        
        Returns:
            视频文件名列表，按时间顺序排列
        """
        if filename not in self._video_cache:
            return [filename]
        
        chain = self._video_cache[filename]["chain"].copy()
        chain.append(filename)
        return chain
    
    def is_video_extendable(self, filename: str) -> bool:
        """检查视频是否可以延长
        
        Returns:
            True if video can be extended, False otherwise
        """
        return filename in self._video_cache
    
    def edit_image(self, prompt: str, image_data: str) -> Dict[str, Any]:
        """编辑图片 - 使用 Gemini 2.5 Flash Image Preview 模型"""
        try:
            if not self._ensure_client():
                return {
                    "success": False,
                    "error": "Gemini client not initialized",
                    "message": "Please configure API key first"
                }
            
            logger.info(f"Editing image with prompt: {prompt[:50]}...")
            
            # 处理base64图片数据
            if image_data.startswith('data:image/'):
                image_data = image_data.split(',')[1]
            
            # 解码base64图片并转换为PIL Image
            image_bytes = base64.b64decode(image_data)
            base_image = Image.open(BytesIO(image_bytes))
            
            # 转换为RGB模式
            if base_image.mode != 'RGB':
                base_image = base_image.convert('RGB')
            
            # 调用Gemini API进行图像编辑 - 根据官方文档的正确方式
            response = self.client.models.generate_content(
                model=self.MODELS["IMAGE_GENERATION"],
                contents=[prompt, base_image],
            )
            
            # 处理响应 - 参考代码的详细处理方式
            logger.info(f"Response received: {type(response)}")
            logger.info(f"Response candidates: {len(response.candidates) if response.candidates else 0}")
            
            if not response.candidates:
                logger.error("No response candidates from API")
                return {
                    "success": False,
                    "error": "No response candidates from API",
                    "message": "图像编辑失败，未收到API响应"
                }
            
            candidate = response.candidates[0]
            logger.info(f"Candidate content parts: {len(candidate.content.parts) if candidate.content.parts else 0}")
            
            # 处理响应部分
            for i, part in enumerate(candidate.content.parts):
                logger.info(f"Part {i}: text={part.text is not None}, inline_data={part.inline_data is not None}")
                
                if part.text is not None:
                    logger.info(f"AI Response: {part.text}")
                    # 如果返回的是文本而不是图片，可能是因为提示词问题
                    if "不能" in part.text or "无法" in part.text or "can't" in part.text.lower():
                        return {
                            "success": False,
                            "error": "API returned text instead of image",
                            "message": f"图像编辑失败：{part.text}"
                        }
                
                # 检查是否有图片数据（即使也有文本）
                if part.inline_data is not None and part.inline_data.data:
                    logger.info(f"Found image data in part {i}, processing...")
                    # 找到编辑后的图像数据
                    edited_image_data = part.inline_data.data
                    logger.info(f"Image data size: {len(edited_image_data)} bytes")
                    
                    if len(edited_image_data) > 0:
                        edited_image_base64 = base64.b64encode(edited_image_data).decode('utf-8')
                        edited_image_data_url = f'data:image/png;base64,{edited_image_base64}'
                        
                        # 保存编辑后的图像
                        filename = self._save_edited_image(edited_image_base64, prompt)
                        logger.info(f"Edited image saved to: {filename}")
                        
                        return {
                            "success": True,
                            "file": filename,
                            "image_data_url": edited_image_data_url,
                            "message": "图像编辑成功"
                        }
                    else:
                        logger.warning(f"Part {i} has inline_data but data is empty")
            
            # 如果没有找到图像数据，返回详细的错误信息
            error_msg = "No image data found in API response"
            if response.candidates and response.candidates[0].content.parts:
                parts_info = []
                for part in response.candidates[0].content.parts:
                    if part.text:
                        parts_info.append(f"text: {part.text[:100]}...")
                    else:
                        parts_info.append("non-text part")
                error_msg += f". Response contains: {', '.join(parts_info)}"
            
            logger.error(error_msg)
            return {
                "success": False,
                "error": "No image data found in API response",
                "message": f"图像编辑失败：{error_msg}"
            }
            
        except Exception as e:
            logger.error(f"Image editing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "图像编辑失败"
            }
    
    def concatenate_images(self, image_data_list: List[str]) -> Dict[str, Any]:
        """横向拼接多张图片"""
        try:
            logger.info(f"Concatenating {len(image_data_list)} images...")
            
            if not image_data_list:
                return {
                    "success": False,
                    "error": "No images provided",
                    "message": "请提供要拼接的图片"
                }
            
            if len(image_data_list) < 2:
                return {
                    "success": False,
                    "error": "At least 2 images required",
                    "message": "至少需要2张图片才能拼接"
                }
            
            # 处理图片列表
            images = []
            for img_data in image_data_list:
                # 移除data URL前缀
                if img_data.startswith('data:image/'):
                    img_data = img_data.split(',')[1]
                
                # 解码base64
                image_bytes = base64.b64decode(img_data)
                img = Image.open(BytesIO(image_bytes))
                
                # 转换为RGB模式
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                images.append(img)
            
            # 计算目标高度（取所有图片的最小高度，但不超过1024）
            max_height = 1024
            target_height = min(min(img.height for img in images), max_height)
            
            # 调整所有图片到相同高度，保持宽高比
            resized_images = []
            total_width = 0
            
            for img in images:
                # 计算新宽度以保持宽高比
                aspect_ratio = img.width / img.height
                new_width = int(target_height * aspect_ratio)
                
                # 调整图片大小
                resized_img = img.resize((new_width, target_height), Image.Resampling.LANCZOS)
                resized_images.append(resized_img)
                total_width += new_width
            
            # 创建新的拼接图片
            concatenated = Image.new('RGB', (total_width, target_height), color='white')
            
            # 拼接图片
            x_offset = 0
            for img in resized_images:
                concatenated.paste(img, (x_offset, 0))
                x_offset += img.width
            
            # 转换为base64
            buffer = BytesIO()
            concatenated.save(buffer, format='PNG')
            image_data = buffer.getvalue()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            image_data_url = f'data:image/png;base64,{image_base64}'
            
            # 保存拼接后的图像
            filename = self._save_concatenated_image(image_base64, len(image_data_list))
            
            return {
                "success": True,
                "file": filename,
                "image_data_url": image_data_url,
                "width": concatenated.width,
                "height": concatenated.height,
                "image_count": len(image_data_list),
                "message": f"成功拼接{len(image_data_list)}张图片"
            }
            
        except Exception as e:
            logger.error(f"Image concatenation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "图片拼接失败"
            }
    
    def _save_edited_image(self, image_base64: str, prompt: str) -> str:
        """保存编辑后的图片"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"edited_image_{timestamp}.png"
        filepath = os.path.join(settings.upload_folder, "images", filename)
        
        # 确保目录存在
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 检查图片数据
        if not image_base64:
            logger.error("Image base64 data is empty")
            raise ValueError("Image base64 data is empty")
        
        # 解码并保存图片
        try:
            image_bytes = base64.b64decode(image_base64)
            logger.info(f"Saving edited image, size: {len(image_bytes)} bytes")
            
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            # 验证文件是否成功保存
            if os.path.exists(filepath) and os.path.getsize(filepath) > 0:
                logger.info(f"Edited image saved successfully: {filepath}")
                return f"/outputs/images/{filename}"
            else:
                logger.error(f"Failed to save edited image: {filepath}")
                raise Exception("Failed to save edited image")
                
        except Exception as e:
            logger.error(f"Error saving edited image: {e}")
            raise e
    
    def _save_concatenated_image(self, image_base64: str, image_count: int) -> str:
        """保存拼接后的图片"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"concatenated_{image_count}images_{timestamp}.png"
        filepath = os.path.join(settings.upload_folder, "images", filename)
        
        # 解码并保存图片
        image_bytes = base64.b64decode(image_base64)
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
        
        logger.info(f"Concatenated image saved: {filepath}")
        return f"/outputs/images/{filename}"

    def extend_video(self, filename: str, prompt: str = "", resolution: str = "720p") -> Dict[str, Any]:
        """延长视频 - 使用 Veo 3.1 模型
        
        注意：只能延长当前会话中刚刚生成的视频
        
        Args:
            filename: 视频文件名（不含路径，如"/outputs/videos/xxx.mp4"）
            prompt: 延长提示词
            resolution: 分辨率
            
        Returns:
            包含延长后的视频信息和视频链
        """
        try:
            if not self._ensure_client():
                return {
                    "success": False,
                    "error": "Gemini client not initialized",
                    "message": "Please configure API key first"
                }
            
            logger.info(f"Extending video: {filename}")
            
            # 验证分辨率参数
            if resolution not in self.SUPPORTED_RESOLUTIONS:
                raise ValueError(f"Unsupported resolution: {resolution}. Supported: {self.SUPPORTED_RESOLUTIONS}")
            
            # 检查视频是否在缓存中
            if not self.is_video_extendable(filename):
                return {
                    "success": False,
                    "error": "Video not extendable",
                    "message": "此视频无法延长。只能延长当前会话中刚刚生成的视频。请先生成一个新视频，然后立即延长。"
                }
            
            # 从缓存获取Video对象
            video_object = self._video_cache[filename]["video_object"]
            logger.info(f"从缓存获取Video对象: {filename}")
            
            # 如果没有提供提示词，使用默认的延长提示词
            if not prompt.strip():
                prompt = "Extend this video naturally, continuing the action and maintaining the same style and quality."
            
            # 调用Veo 3.1 API进行视频延长
            config_params = {
                "number_of_videos": 1,
                "resolution": resolution
            }
            
            config = types.GenerateVideosConfig(**config_params)
            
            # 详细日志记录
            logger.info(f"=== 视频延长API调用详情 ===")
            logger.info(f"模型: {self.MODELS['VIDEO_EXTENSION']}")
            logger.info(f"提示词: {prompt[:100]}...")
            logger.info(f"原视频: {filename}")
            logger.info(f"配置参数: {config_params}")
            
            # 调用API
            operation = self.client.models.generate_videos(
                model=self.MODELS["VIDEO_EXTENSION"],
                video=video_object,
                prompt=prompt,
                config=config
            )
            
            logger.info(f"API调用成功，等待视频延长完成...")
            
            # 等待视频延长完成
            while not operation.done:
                logger.info("Waiting for video extension to complete...")
                time.sleep(10)
                operation = self.client.operations.get(operation)
            
            # 下载延长后的视频
            if not operation.response.generated_videos:
                raise Exception("无法延长视频")
            
            # 处理延长后的视频
            for n, extended_video in enumerate(operation.response.generated_videos):
                try:
                    new_filename = self._download_video(extended_video.video, "extended_video")
                    logger.info(f"成功下载延长视频 {n}: {new_filename}")
                    
                    # 缓存延长后的Video对象，并记录父视频
                    self._cache_video_object(new_filename, extended_video.video, filename)
                    
                    # 获取完整的视频链
                    video_chain = self.get_video_chain(new_filename)
                    logger.info(f"视频链: {video_chain}")
                    
                    return {
                        "success": True,
                        "file": new_filename,
                        "chain": video_chain,
                        "message": "Video extended successfully"
                    }
                except Exception as e:
                    logger.error(f"下载延长视频 {n} 失败: {str(e)}")
                    raise e
            
        except Exception as e:
            logger.error(f"Video extension failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": f"Video extension failed: {str(e)}"
            }
