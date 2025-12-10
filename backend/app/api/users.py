"""
用户API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserSchema, summary="获取当前用户信息")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """获取当前登录用户的信息"""
    return current_user


@router.put("/me", response_model=UserSchema, summary="更新当前用户信息")
async def update_current_user_info(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新当前登录用户的信息"""

    # 更新用户信息
    if user_update.nickname is not None:
        current_user.nickname = user_update.nickname
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar
    if user_update.phone is not None:
        current_user.phone = user_update.phone

    db.commit()
    db.refresh(current_user)

    return current_user
