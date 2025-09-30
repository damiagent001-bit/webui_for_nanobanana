import os
import uuid
from datetime import datetime
from typing import Optional
from werkzeug.utils import secure_filename


def generate_unique_filename(original_filename: str, prefix: str = "") -> str:
    """生成唯一文件名"""
    if not original_filename:
        return f"{prefix}_{uuid.uuid4().hex[:8]}"
    
    # 获取文件扩展名
    file_ext = os.path.splitext(original_filename)[1].lower()
    
    # 生成时间戳
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 生成唯一ID
    unique_id = uuid.uuid4().hex[:8]
    
    # 组合文件名
    if prefix:
        return f"{prefix}_{timestamp}_{unique_id}{file_ext}"
    else:
        return f"{timestamp}_{unique_id}{file_ext}"


def validate_file_type(filename: str, allowed_extensions: list) -> bool:
    """验证文件类型"""
    if not filename:
        return False
    
    file_ext = os.path.splitext(filename)[1].lower()
    return file_ext in allowed_extensions


def get_file_size_mb(file_path: str) -> float:
    """获取文件大小（MB）"""
    try:
        size_bytes = os.path.getsize(file_path)
        return size_bytes / (1024 * 1024)
    except OSError:
        return 0.0


def cleanup_temp_file(file_path: str):
    """清理临时文件"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError as e:
        print(f"Failed to delete temp file {file_path}: {e}")


def format_file_size(size_bytes: int) -> str:
    """格式化文件大小显示"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

