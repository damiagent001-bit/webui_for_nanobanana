import os
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.services.gemini_service import GeminiService
from app.services.file_service import FileService
from app.utils.logger import logger
from app.config import settings

router = APIRouter(prefix="/api/v1/gemini", tags=["gemini"])

# 初始化服务
gemini_service = None
file_service = FileService()


# 请求模型
class TextToImageRequest(BaseModel):
    prompt: str
    aspect_ratio: Optional[str] = "1:1"
    api_key: Optional[str] = None


class TextToVideoRequest(BaseModel):
    prompt: str
    person_generation: Optional[str] = "allow_adult"
    aspect_ratio: Optional[str] = "16:9"
    negative_prompt: Optional[str] = ""
    duration_seconds: Optional[int] = 8
    resolution: Optional[str] = "720p"
    api_key: Optional[str] = None


class ImageAnalysisRequest(BaseModel):
    analysis_prompt: Optional[str] = "Describe this image in detail"


class ImageEditRequest(BaseModel):
    prompt: str
    image_data: str
    api_key: Optional[str] = None


class ImageConcatenateRequest(BaseModel):
    images: List[str]
    api_key: Optional[str] = None


class VideoExtendRequest(BaseModel):
    filename: str  # 视频文件名（如"/outputs/videos/xxx.mp4"）
    prompt: Optional[str] = ""
    resolution: Optional[str] = "720p"
    api_key: Optional[str] = None


# 响应模型
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    error: Optional[str] = None


@router.post("/generate/image", response_model=APIResponse)
async def generate_image(request: TextToImageRequest):
    """文本生成图片"""
    try:
        logger.info(f"Image generation request: {request}")
        logger.info(f"Image generation request: {request.prompt[:50]}...")
        
        # 获取API Key
        api_key = request.api_key or settings.gemini_api_key
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API Key is required")
        
        # 动态初始化Gemini服务
        global gemini_service
        # 每次都使用新的API Key初始化服务
        gemini_service = GeminiService(api_key)
        
        result = gemini_service.generate_image(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio
        )
        
        if result["success"]:
            return APIResponse(
                success=True,
                message=result["message"],
                data={"files": result["files"]}
            )
        else:
            error_detail = result.get("message", "Image generation failed")
            error_info = result.get("error", "")
            if error_info:
                error_detail += f": {error_info}"
            logger.error(f"Image generation failed: {error_detail}")
            raise HTTPException(status_code=400, detail=error_detail)
            
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.post("/generate/video/text", response_model=APIResponse)
async def generate_video_from_text(request: TextToVideoRequest):
    """文本生成视频"""
    try:
        logger.info(f"Video generation from text request: {request.prompt[:50]}...")
        
        # 获取API Key
        api_key = request.api_key or settings.gemini_api_key
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API Key is required")
        
        # 动态初始化Gemini服务
        global gemini_service
        # 每次都使用新的API Key初始化服务
        gemini_service = GeminiService(api_key)
        
        result = gemini_service.generate_video_from_text(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            duration_seconds=request.duration_seconds,
            resolution=request.resolution
        )
        
        if result["success"]:
            return APIResponse(
                success=True,
                message=result["message"],
                data={"file": result["file"]}
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"Video generation from text failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.post("/generate/video/image", response_model=APIResponse)
async def generate_video_from_image(
    prompt: str = Form(...),
    image: UploadFile = File(...),
    aspect_ratio: str = Form("16:9"),
    duration_seconds: int = Form(8),
    resolution: str = Form("720p"),
    person_generation: str = Form("allow_adult"),
    negative_prompt: str = Form(""),
    api_key: str = Form(None)
):
    """图片生成视频"""
    try:
        logger.info(f"Video generation from image request: {prompt[:50]}...")
        
        # 获取API Key
        final_api_key = api_key or settings.gemini_api_key
        
        if not final_api_key:
            raise HTTPException(status_code=400, detail="API Key is required")
        
        # 保存上传的图片
        save_result = file_service.save_uploaded_file(image, "image")
        if not save_result["success"]:
            raise HTTPException(status_code=400, detail=save_result["message"])
        
        # 动态初始化Gemini服务
        global gemini_service
        # 每次都使用新的API Key初始化服务
        gemini_service = GeminiService(final_api_key)
        
        # 生成视频
        result = gemini_service.generate_video_from_image(
            prompt=prompt,
            image_path=save_result["filepath"],
            aspect_ratio=aspect_ratio,
            duration_seconds=duration_seconds,
            resolution=resolution
        )
        
        # 清理临时图片文件
        file_service.delete_file(save_result["filepath"])
        
        if result["success"]:
            return APIResponse(
                success=True,
                message=result["message"],
                data={"file": result["file"]}
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"Video generation from image failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.post("/analyze/image", response_model=APIResponse)
async def analyze_image(
    image: UploadFile = File(...),
    analysis_prompt: str = Form("Describe this image in detail")
):
    """图片分析"""
    try:
        logger.info("Image analysis request")
        
        # 保存上传的图片
        save_result = file_service.save_uploaded_file(image, "image")
        if not save_result["success"]:
            raise HTTPException(status_code=400, detail=save_result["message"])
        
        # 动态初始化Gemini服务
        global gemini_service
        if gemini_service is None:
            gemini_service = GeminiService(settings.gemini_api_key)
        
        # 分析图片
        result = gemini_service.analyze_image(
            image_path=save_result["filepath"],
            analysis_prompt=analysis_prompt
        )
        
        # 清理临时图片文件
        file_service.delete_file(save_result["filepath"])
        
        if result["success"]:
            return APIResponse(
                success=True,
                message=result["message"],
                data={"analysis": result["analysis"]}
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.get("/files/images")
async def list_images():
    """列出生成的图片"""
    try:
        files = file_service.list_files("image")
        return APIResponse(
            success=True,
            message="Images listed successfully",
            data={"files": files}
        )
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"List images failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.get("/files/videos")
async def list_videos():
    """列出生成的视频"""
    try:
        files = file_service.list_files("video")
        return APIResponse(
            success=True,
            message="Videos listed successfully",
            data={"files": files}
        )
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"List videos failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.get("/download/{file_type}/{filename}")
async def download_file(file_type: str, filename: str):
    """下载文件"""
    try:
        if file_type not in ["images", "videos"]:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        file_path = os.path.join(settings.upload_folder, file_type, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"Download file failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.post("/edit/image", response_model=APIResponse)
async def edit_image(request: ImageEditRequest):
    """编辑图片"""
    try:
        logger.info(f"Image editing request: {request.prompt[:50]}...")
        
        # 获取API Key
        api_key = request.api_key or settings.gemini_api_key
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API Key is required")
        
        # 动态初始化Gemini服务
        global gemini_service
        if gemini_service is None:
            gemini_service = GeminiService(api_key)
        
        result = gemini_service.edit_image(
            prompt=request.prompt,
            image_data=request.image_data
        )
        
        if result["success"]:
            return APIResponse(
                success=True,
                message=result["message"],
                data={
                    "file": result["file"],
                    "image_data_url": result["image_data_url"]
                }
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"Image editing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.post("/concatenate/images", response_model=APIResponse)
async def concatenate_images(request: ImageConcatenateRequest):
    """拼接多张图片"""
    try:
        logger.info(f"Image concatenation request: {len(request.images)} images")
        
        # 获取API Key
        api_key = request.api_key or settings.gemini_api_key
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API Key is required")
        
        # 动态初始化Gemini服务
        global gemini_service
        if gemini_service is None:
            gemini_service = GeminiService(api_key)
        
        result = gemini_service.concatenate_images(request.images)
        
        if result["success"]:
            return APIResponse(
                success=True,
                message=result["message"],
                data={
                    "file": result["file"],
                    "image_data_url": result["image_data_url"],
                    "width": result["width"],
                    "height": result["height"],
                    "image_count": result["image_count"]
                }
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"Image concatenation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.post("/upload/video", response_model=APIResponse)
async def upload_video(video: UploadFile = File(...)):
    """上传视频文件"""
    try:
        logger.info(f"Video upload request: {video.filename}")
        
        # 保存上传的视频
        save_result = file_service.save_uploaded_file(video, "video")
        if not save_result["success"]:
            raise HTTPException(status_code=400, detail=save_result["message"])
        
        return APIResponse(
            success=True,
            message="Video uploaded successfully",
            data={"file_path": save_result["filepath"]}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")


@router.post("/extend/video", response_model=APIResponse)
async def extend_video(request: VideoExtendRequest):
    """延长视频 - 只能延长当前会话中刚生成的视频"""
    try:
        logger.info(f"Video extension request: {request.filename}")
        
        # 获取API Key
        api_key = request.api_key or settings.gemini_api_key
        
        if not api_key:
            raise HTTPException(status_code=400, detail="API Key is required")
        
        # 使用全局的gemini_service实例（会话级）
        global gemini_service
        if gemini_service is None:
            gemini_service = GeminiService(api_key)
        
        result = gemini_service.extend_video(
            filename=request.filename,
            prompt=request.prompt,
            resolution=request.resolution
        )
        
        if result["success"]:
            return APIResponse(
                success=True,
                message=result["message"],
                data={
                    "file": result["file"],
                    "chain": result.get("chain", [request.filename, result["file"]])
                }
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        # 重新抛出HTTPException，不要捕获
        raise
    except Exception as e:
        logger.error(f"Video extension failed: {e}")
        raise HTTPException(status_code=500, detail=str(e) or "Internal server error")
