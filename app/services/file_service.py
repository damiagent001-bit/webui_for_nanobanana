import os
import shutil
from typing import List, Dict, Any
from werkzeug.utils import secure_filename

from app.config import settings
from app.utils.logger import logger
from app.utils.helpers import generate_unique_filename, validate_file_type, get_file_size_mb


class FileService:
    """文件服务类"""
    
    def __init__(self):
        """初始化文件服务"""
        self.upload_folder = settings.upload_folder
        self.max_file_size = settings.max_file_size
        self.allowed_image_extensions = settings.allowed_image_extensions
        self.allowed_video_extensions = settings.allowed_video_extensions
    
    def save_uploaded_file(self, file, file_type: str = "image") -> Dict[str, Any]:
        """保存上传的文件"""
        try:
            if not file or not file.filename:
                return {
                    "success": False,
                    "error": "No file provided",
                    "message": "请选择要上传的文件"
                }
            
            # 验证文件类型
            allowed_extensions = (
                self.allowed_image_extensions if file_type == "image"
                else self.allowed_video_extensions
            )
            
            if not validate_file_type(file.filename, allowed_extensions):
                return {
                    "success": False,
                    "error": "Invalid file type",
                    "message": f"不支持的文件格式，请上传 {', '.join(allowed_extensions)} 格式的文件"
                }
            
            # 生成安全的文件名
            filename = secure_filename(file.filename)
            unique_filename = generate_unique_filename(filename, file_type)
            
            # 确定保存路径
            subfolder = "images" if file_type == "image" else "videos"
            save_dir = os.path.join(self.upload_folder, subfolder)
            os.makedirs(save_dir, exist_ok=True)
            
            filepath = os.path.join(save_dir, unique_filename)
            
            # 保存文件 - 修复FastAPI UploadFile的保存方式
            with open(filepath, 'wb') as f:
                content = file.file.read()
                f.write(content)
            
            # 检查文件大小
            file_size_mb = get_file_size_mb(filepath)
            if file_size_mb > (self.max_file_size / (1024 * 1024)):
                os.remove(filepath)
                return {
                    "success": False,
                    "error": "File too large",
                    "message": f"文件过大，最大支持 {self.max_file_size / (1024 * 1024):.0f}MB"
                }
            
            logger.info(f"File saved successfully: {filepath}")
            
            return {
                "success": True,
                "filename": unique_filename,
                "filepath": filepath,
                "url": f"/outputs/{subfolder}/{unique_filename}",
                "size_mb": file_size_mb,
                "message": "文件上传成功"
            }
            
        except Exception as e:
            logger.error(f"File save failed: {e}")
            import traceback
            logger.error(f"File save traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "error": str(e),
                "message": "文件保存失败"
            }
    
    def get_file_info(self, filepath: str) -> Dict[str, Any]:
        """获取文件信息"""
        try:
            if not os.path.exists(filepath):
                return {
                    "success": False,
                    "error": "File not found",
                    "message": "文件不存在"
                }
            
            stat = os.stat(filepath)
            
            return {
                "success": True,
                "filename": os.path.basename(filepath),
                "size": stat.st_size,
                "size_mb": get_file_size_mb(filepath),
                "created": stat.st_ctime,
                "modified": stat.st_mtime,
                "message": "文件信息获取成功"
            }
            
        except Exception as e:
            logger.error(f"Get file info failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "获取文件信息失败"
            }
    
    def list_files(self, file_type: str = "image") -> List[Dict[str, Any]]:
        """列出指定类型的文件"""
        try:
            subfolder = "images" if file_type == "image" else "videos"
            folder_path = os.path.join(self.upload_folder, subfolder)
            
            if not os.path.exists(folder_path):
                return []
            
            files = []
            for filename in os.listdir(folder_path):
                filepath = os.path.join(folder_path, filename)
                if os.path.isfile(filepath):
                    file_info = self.get_file_info(filepath)
                    if file_info["success"]:
                        file_info["url"] = f"/outputs/{subfolder}/{filename}"
                        files.append(file_info)
            
            # 按修改时间排序（最新的在前）
            files.sort(key=lambda x: x["modified"], reverse=True)
            
            return files
            
        except Exception as e:
            logger.error(f"List files failed: {e}")
            return []
    
    def delete_file(self, filepath: str) -> Dict[str, Any]:
        """删除文件"""
        try:
            if not os.path.exists(filepath):
                return {
                    "success": False,
                    "error": "File not found",
                    "message": "文件不存在"
                }
            
            os.remove(filepath)
            logger.info(f"File deleted: {filepath}")
            
            return {
                "success": True,
                "message": "文件删除成功"
            }
            
        except Exception as e:
            logger.error(f"Delete file failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "文件删除失败"
            }
    
    def cleanup_temp_files(self, max_age_hours: int = 24):
        """清理临时文件"""
        try:
            # 这里可以实现清理逻辑
            # 例如删除超过指定时间的临时文件
            pass
        except Exception as e:
            logger.error(f"Cleanup temp files failed: {e}")

