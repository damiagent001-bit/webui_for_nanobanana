import os
from typing import Optional, List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # API配置
    gemini_api_key: Optional[str] = None
    
    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # 文件存储配置
    upload_folder: str = "outputs"
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    
    # 允许的文件类型
    allowed_image_extensions: List[str] = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
    allowed_video_extensions: List[str] = [".mp4", ".avi", ".mov", ".mkv"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# 全局配置实例
settings = Settings()


def get_gemini_api_key() -> str:
    """获取Gemini API密钥"""
    if not settings.gemini_api_key:
        raise ValueError("Gemini API key not configured. Please set GEMINI_API_KEY in .env file")
    return settings.gemini_api_key


def ensure_output_dirs():
    """确保输出目录存在"""
    dirs = [
        settings.upload_folder,
        os.path.join(settings.upload_folder, "images"),
        os.path.join(settings.upload_folder, "videos"),
        os.path.join(settings.upload_folder, "files"),
    ]
    
    for dir_path in dirs:
        os.makedirs(dir_path, exist_ok=True)
