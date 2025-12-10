"""
智能提醒API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.crop import SmartReminder, PlantingRecord, Crop
from app.services.smart_reminder_engine import SmartReminderEngine
from app.services.iot_service import IoTService

router = APIRouter()


class ReminderResponse(BaseModel):
    """提醒响应模型"""
    id: int
    reminder_type: str
    title: str
    description: Optional[str]
    remind_time: datetime
    priority: int
    status: str
    source: str
    extra_data: Optional[dict]
    garden_id: Optional[int]
    planting_record_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class IoTStatusResponse(BaseModel):
    """物联网状态响应"""
    sensor_type: str
    value: float
    unit: Optional[str]
    time: str
    is_abnormal: bool
    abnormal_reason: Optional[str]


class CompleteReminderRequest(BaseModel):
    """完成提醒请求"""
    reminder_id: int


@router.get("/generate", response_model=List[ReminderResponse])
def generate_smart_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    生成智能提醒

    自动分析用户的所有种植记录，基于：
    - 作物生长规则
    - 物联网传感器数据
    - 历史完成记录

    生成个性化的任务提醒
    """
    # 首先更新所有种植记录的生长阶段
    planting_records = db.query(PlantingRecord).filter(
        PlantingRecord.user_id == current_user.id,
        PlantingRecord.status == "growing"
    ).all()

    for record in planting_records:
        SmartReminderEngine.update_growth_stage(db, record.id)

    # 生成智能提醒
    reminders = SmartReminderEngine.generate_reminders(db, current_user.id)

    return reminders


@router.get("/list", response_model=List[ReminderResponse])
def get_reminders(
    status: Optional[str] = Query(None, description="状态筛选：pending/completed/ignored"),
    reminder_type: Optional[str] = Query(None, description="类型筛选"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取提醒列表
    """
    query = db.query(SmartReminder).filter(
        SmartReminder.user_id == current_user.id
    )

    if status:
        query = query.filter(SmartReminder.status == status)

    if reminder_type:
        query = query.filter(SmartReminder.reminder_type == reminder_type)

    reminders = query.order_by(
        SmartReminder.priority.desc(),
        SmartReminder.remind_time.desc()
    ).limit(limit).all()

    return reminders


@router.post("/complete")
def complete_reminder(
    request: CompleteReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    完成提醒
    """
    success = SmartReminderEngine.complete_reminder(
        db, request.reminder_id, current_user.id
    )

    if not success:
        raise HTTPException(status_code=404, detail="提醒不存在或无权操作")

    return {"message": "提醒已完成", "success": True}


@router.post("/ignore/{reminder_id}")
def ignore_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    忽略提醒
    """
    reminder = db.query(SmartReminder).filter(
        SmartReminder.id == reminder_id,
        SmartReminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="提醒不存在")

    reminder.status = "ignored"
    db.commit()

    return {"message": "提醒已忽略", "success": True}


@router.get("/iot/status/{garden_id}")
def get_iot_status(
    garden_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取菜地的物联网传感器状态
    """
    # 验证菜地权限（这里简化处理）
    status = IoTService.get_current_status(db, garden_id)

    return {"garden_id": garden_id, "sensors": status}


@router.get("/iot/history/{garden_id}")
def get_iot_history(
    garden_id: int,
    hours: int = Query(24, ge=1, le=168, description="查询最近多少小时的数据"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取菜地的物联网历史数据
    """
    readings = IoTService.get_latest_readings(db, garden_id, hours)

    return {
        "garden_id": garden_id,
        "hours": hours,
        "readings": readings
    }


@router.post("/iot/simulate/{garden_id}")
def simulate_iot_data(
    garden_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    模拟物联网数据（用于测试）

    为指定菜地生成模拟的传感器读数
    """
    simulated = IoTService.simulate_readings(db, garden_id)

    return {
        "message": "模拟数据生成成功",
        "garden_id": garden_id,
        "simulated_data": simulated
    }


@router.get("/statistics")
def get_reminder_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取提醒统计信息
    """
    total = db.query(SmartReminder).filter(
        SmartReminder.user_id == current_user.id
    ).count()

    pending = db.query(SmartReminder).filter(
        SmartReminder.user_id == current_user.id,
        SmartReminder.status == "pending"
    ).count()

    completed = db.query(SmartReminder).filter(
        SmartReminder.user_id == current_user.id,
        SmartReminder.status == "completed"
    ).count()

    # 按类型统计
    type_stats = {}
    reminders = db.query(SmartReminder).filter(
        SmartReminder.user_id == current_user.id,
        SmartReminder.status == "pending"
    ).all()

    for reminder in reminders:
        type_stats[reminder.reminder_type] = type_stats.get(reminder.reminder_type, 0) + 1

    return {
        "total": total,
        "pending": pending,
        "completed": completed,
        "by_type": type_stats
    }
