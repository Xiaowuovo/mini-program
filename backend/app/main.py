"""
FastAPI主应用
"""
import sys
import io

# 设置标准输出编码为UTF-8（解决Windows控制台乱码）
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api import api_router

# 创建FastAPI应用实例
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="共享菜园云端小筑微信小程序后端API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 应用启动事件
@app.on_event("startup")
async def startup_event():
    """应用启动时执行"""
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} 正在启动...")
    print(f"📚 API文档: http://{settings.HOST}:{settings.PORT}/api/docs")

    # 初始化数据库（创建表）
    # init_db()  # 生产环境请谨慎使用，建议手动执行SQL脚本
    print("✅ 应用启动完成!")


# 应用关闭事件
@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时执行"""
    print("👋 应用正在关闭...")


# 健康检查接口
@app.get("/", tags=["系统"])
async def root():
    """根路径 - 健康检查"""
    return {
        "message": "欢迎使用共享菜园云端小筑API",
        "version": settings.APP_VERSION,
        "status": "running"
    }


@app.get("/health", tags=["系统"])
async def health_check():
    """健康检查接口"""
    return {"status": "healthy"}


# 注册API路由
app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
