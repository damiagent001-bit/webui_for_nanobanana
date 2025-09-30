import logging
import sys
from datetime import datetime
from pathlib import Path


def setup_logger(name: str = "webui", level: int = logging.INFO) -> logging.Logger:
    """设置日志记录器"""
    
    # 创建logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # 避免重复添加handler
    if logger.handlers:
        return logger
    
    # 创建formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 控制台handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    
    # 文件handler
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    file_handler = logging.FileHandler(
        log_dir / f"{name}_{datetime.now().strftime('%Y%m%d')}.log",
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    
    # 添加handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger


# 全局logger实例
logger = setup_logger()

