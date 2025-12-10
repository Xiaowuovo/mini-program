"""
API路由模块
"""
from fastapi import APIRouter
from . import auth, users, gardens, orders, services, community, reminders, smart_reminders, iot

api_router = APIRouter()

# 注册各模块路由
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(users.router, prefix="/users", tags=["用户"])
api_router.include_router(gardens.router, prefix="/gardens", tags=["菜地"])
api_router.include_router(orders.router, prefix="/orders", tags=["订单"])
api_router.include_router(services.router, prefix="/services", tags=["增值服务"])
api_router.include_router(community.router, prefix="/community", tags=["社区"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["任务提醒"])
api_router.include_router(smart_reminders.router, prefix="/smart-reminders", tags=["智能提醒"])
api_router.include_router(iot.router, prefix="/iot", tags=["物联网"])
