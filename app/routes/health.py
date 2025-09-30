from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

from app.utils.logger import logger

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    message: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查接口"""
    logger.info("Health check requested")
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        message="Web UI for Large Models is running"
    )


@router.get("/api")
async def api_root():
    """API根路径"""
    return {"message": "Web UI for Large Models API", "docs": "/api/docs"}

