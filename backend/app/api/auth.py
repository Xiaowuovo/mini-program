"""
认证API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.user import WechatLoginRequest, LoginResponse, User as UserSchema
from app.utils.wechat import wechat_api

router = APIRouter()


class TestLoginRequest(BaseModel):
    """测试登录请求"""
    nickname: str = "测试用户"


@router.post("/wechat-login", response_model=LoginResponse, summary="微信登录")
async def wechat_login(
    login_data: WechatLoginRequest,
    db: Session = Depends(get_db)
):
    """
    微信登录接口

    流程:
    1. 使用code换取openid
    2. 查询用户是否存在，不存在则创建
    3. 生成JWT令牌并返回
    """
    # 调用微信API获取openid
    wechat_data = wechat_api.code2session(login_data.code)

    if not wechat_data or "openid" not in wechat_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="微信登录失败，请重试"
        )

    openid = wechat_data["openid"]

    # 查询用户
    user = db.query(User).filter(User.openid == openid).first()

    # 如果用户不存在，创建新用户
    if not user:
        user = User(
            openid=openid,
            nickname=f"用户{openid[:8]}",  # 默认昵称
            role="tenant"  # 默认角色为租户
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 生成JWT令牌（sub必须是字符串）
    access_token = create_access_token(data={"sub": str(user.id)})

    # 转换为Schema
    user_schema = UserSchema.from_orm(user)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_schema
    )


@router.post("/test-login", response_model=LoginResponse, summary="测试登录（开发用）")
async def test_login(
    login_data: TestLoginRequest,
    db: Session = Depends(get_db)
):
    """
    测试登录接口（仅供开发和演示使用）

    无需微信code，直接创建或获取测试用户
    """
    # 使用固定的测试openid
    test_openid = "test_openid_" + login_data.nickname

    # 查询用户
    user = db.query(User).filter(User.openid == test_openid).first()

    # 如果用户不存在，创建新用户
    if not user:
        user = User(
            openid=test_openid,
            nickname=login_data.nickname,
            role="tenant"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 生成JWT令牌（sub必须是字符串）
    access_token = create_access_token(data={"sub": str(user.id)})

    # 转换为Schema
    user_schema = UserSchema.from_orm(user)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_schema
    )
