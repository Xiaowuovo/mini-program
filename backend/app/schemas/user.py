"""
用户数据Schema
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """用户基础Schema"""
    nickname: Optional[str] = Field(None, max_length=50, description="昵称")
    avatar: Optional[str] = Field(None, max_length=500, description="头像URL")
    phone: Optional[str] = Field(None, max_length=20, description="手机号")


class UserCreate(UserBase):
    """创建用户Schema"""
    openid: str = Field(..., max_length=100, description="微信OpenID")


class UserUpdate(UserBase):
    """更新用户Schema"""
    pass


class UserInDB(UserBase):
    """数据库中的用户Schema"""
    id: int
    openid: str
    role: UserRole
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(UserInDB):
    """用户响应Schema"""
    pass


class WechatLoginRequest(BaseModel):
    """微信登录请求Schema"""
    code: str = Field(..., description="微信登录code")


class LoginResponse(BaseModel):
    """登录响应Schema"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    user: User = Field(..., description="用户信息")
