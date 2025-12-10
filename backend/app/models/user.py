"""
用户数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    """用户角色枚举"""
    TENANT = "tenant"  # 租户
    ADMIN = "admin"    # 管理员


class User(Base):
    """用户模型"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, comment="用户ID")
    openid = Column(String(100), unique=True, nullable=False, index=True, comment="微信OpenID")
    nickname = Column(String(50), comment="昵称")
    avatar = Column(String(500), comment="头像URL")
    phone = Column(String(20), comment="手机号")
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.TENANT, comment="用户角色")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="注册时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<User(id={self.id}, nickname={self.nickname}, role={self.role})>"
