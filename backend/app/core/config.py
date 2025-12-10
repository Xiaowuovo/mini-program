"""
应用配置模块
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """应用配置类"""

    # 应用基础配置
    APP_NAME: str = "共享菜园云端小筑"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # 数据库配置
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/garden_db"
    DATABASE_ECHO: bool = False

    # Redis配置
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""

    # JWT配置
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7天

    # 微信小程序配置
    WECHAT_APPID: str = ""
    WECHAT_SECRET: str = ""

    # 腾讯云配置
    TENCENT_SECRET_ID: str = ""
    TENCENT_SECRET_KEY: str = ""
    TENCENT_COS_BUCKET: str = ""
    TENCENT_COS_REGION: str = "ap-guangzhou"

    # 文件上传配置
    UPLOAD_MAX_SIZE: int = 10485760  # 10MB
    UPLOAD_ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,gif,webp"

    # CORS配置
    CORS_ORIGINS: str = "http://localhost,https://servicewechat.com"

    @property
    def cors_origins_list(self) -> List[str]:
        """获取CORS允许的源列表"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_extensions_list(self) -> List[str]:
        """获取允许的文件扩展名列表"""
        return [ext.strip() for ext in self.UPLOAD_ALLOWED_EXTENSIONS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


# 创建全局配置实例
settings = Settings()
