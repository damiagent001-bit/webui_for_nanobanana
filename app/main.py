from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from app.config import settings, ensure_output_dirs
from app.routes import health, gemini
from app.utils.logger import logger

# 确保输出目录存在
ensure_output_dirs()

# 创建FastAPI应用
app = FastAPI(
    title="Web UI for Large Models",
    description="A beautiful web interface for interacting with large language models",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

if os.path.exists("outputs"):
    app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# 模板配置
templates = Jinja2Templates(directory="app/templates")

# 注册路由
app.include_router(health.router)
app.include_router(gemini.router)


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """主页"""
    logger.info("Home page requested")
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/gemini", response_class=HTMLResponse)
async def gemini_page(request: Request):
    """Gemini模型页面"""
    logger.info("Gemini page requested")
    return templates.TemplateResponse("gemini.html", {"request": request})


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """404错误处理"""
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """500错误处理"""
    logger.error(f"Internal server error: {exc}")
    return templates.TemplateResponse("500.html", {"request": request}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Web UI for Large Models...")
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )

