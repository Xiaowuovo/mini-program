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
    role: str = "tenant"  # tenant 或 admin


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
    支持创建管理员账号（role=admin）或普通租户（role=tenant）

    新用户登录时会自动创建5-15个可用菜地
    """
    import random
    import json
    from app.models.garden import Garden

    # 使用固定的测试openid
    test_openid = "test_openid_" + login_data.nickname + "_" + login_data.role

    # 查询用户
    user = db.query(User).filter(User.openid == test_openid).first()
    is_new_user = user is None

    # 如果用户不存在，创建新用户
    if not user:
        user = User(
            openid=test_openid,
            nickname=login_data.nickname,
            role=login_data.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # 如果用户存在但角色不匹配，更新角色（方便测试）
        if user.role != login_data.role:
            user.role = login_data.role
            db.commit()
            db.refresh(user)

    # 如果是新用户，自动创建菜地
    if is_new_user and login_data.role == 'tenant':
        from garden_images import get_random_garden_data

        # 随机创建5-15个菜地
        garden_count = random.randint(5, 15)

        for _ in range(garden_count):
            garden_data = get_random_garden_data()

            garden = Garden(
                name=garden_data['name'],
                area=garden_data['area'],
                price=garden_data['price'],
                location=garden_data['location'],
                description=garden_data['description'],
                images=json.dumps(garden_data['images'], ensure_ascii=False),
                status=garden_data['status']
            )
            db.add(garden)

        db.commit()

    # 生成JWT令牌（sub必须是字符串）
    access_token = create_access_token(data={"sub": str(user.id)})

    # 转换为Schema
    user_schema = UserSchema.from_orm(user)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_schema
    )