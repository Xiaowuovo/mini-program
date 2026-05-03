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
from app.models.garden import Garden
from app.models.order import Order
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


@router.get("/generate")
def generate_smart_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    生成智能提醒

    基于实时数据自动触发：
    - 有种植记录：基于作物生长规则 + 物联网传感器数据生成
    - 无种植记录：基于活跃租用订单生成基础维护提醒
    """
    try:
        planting_records = db.query(PlantingRecord).filter(
            PlantingRecord.user_id == current_user.id,
            PlantingRecord.status == "growing"
        ).all()

        count = 0
        if planting_records:
            for record in planting_records:
                SmartReminderEngine.update_growth_stage(db, record.id)
            reminders = SmartReminderEngine.generate_reminders(db, current_user.id)
            count = len(reminders)
        else:
            count = _generate_order_based_reminders(db, current_user.id)

        return {"message": "提醒生成成功", "count": count}
    except Exception as e:
        return {"message": "生成完成", "count": 0}


@router.get("/list")
def get_reminders(
    status: Optional[str] = Query(None, description="状态筛选：pending/completed/ignored"),
    reminder_type: Optional[str] = Query(None, description="类型筛选"),
    garden_id: Optional[int] = Query(None, description="菜地ID筛选"),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取提醒列表（含菜地名称），支持菜地筛选
    """
    query = db.query(SmartReminder).filter(
        SmartReminder.user_id == current_user.id
    )

    if status and status != 'all':
        query = query.filter(SmartReminder.status == status)

    if reminder_type:
        query = query.filter(SmartReminder.reminder_type == reminder_type)

    if garden_id:
        query = query.filter(SmartReminder.garden_id == garden_id)

    reminders = query.order_by(
        SmartReminder.priority.desc(),
        SmartReminder.remind_time.asc()
    ).limit(limit).all()

    # 缓存菜地名称
    garden_cache = {}
    result = []
    for r in reminders:
        garden_name = None
        if r.garden_id:
            if r.garden_id not in garden_cache:
                garden = db.query(Garden).filter(Garden.id == r.garden_id).first()
                garden_cache[r.garden_id] = garden.name if garden else None
            garden_name = garden_cache[r.garden_id]

        result.append({
            "id": r.id,
            "reminder_type": r.reminder_type,
            "title": r.title,
            "description": r.description,
            "remind_time": r.remind_time.isoformat() if r.remind_time else None,
            "priority": r.priority,
            "status": r.status,
            "source": r.source,
            "extra_data": r.extra_data,
            "garden_id": r.garden_id,
            "garden_name": garden_name,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })

    return result


@router.post("/complete")
def complete_reminder(
    request: CompleteReminderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    完成提醒
    """
    reminder = db.query(SmartReminder).filter(
        SmartReminder.id == request.reminder_id,
        SmartReminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(status_code=404, detail="提醒不存在")

    reminder.status = "completed"
    reminder.completed_at = datetime.now()
    db.commit()

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


@router.post("/create")
def create_manual_reminder(
    request_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    手动创建提醒

    请求体:
    {
        "garden_id": 1,
        "reminder_type": "watering",
        "title": "浇水提醒",
        "description": "记得浇水",
        "remind_time": "2024-12-11 09:00:00",
        "priority": 3
    }
    """
    from datetime import datetime

    # 获取参数
    garden_id = request_data.get('garden_id')
    reminder_type = request_data.get('reminder_type')
    title = request_data.get('title')
    description = request_data.get('description', '')
    remind_time_str = request_data.get('remind_time')
    priority = request_data.get('priority', 3)

    # 参数验证
    if not reminder_type:
        raise HTTPException(status_code=400, detail="缺少必需参数: reminder_type")
    if not title:
        raise HTTPException(status_code=400, detail="缺少必需参数: title")
    if not remind_time_str:
        raise HTTPException(status_code=400, detail="缺少必需参数: remind_time")

    # 解析时间
    try:
        remind_time = datetime.strptime(remind_time_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        raise HTTPException(status_code=400, detail="时间格式错误，应为: YYYY-MM-DD HH:MM:SS")

    # 创建提醒
    reminder = SmartReminder(
        user_id=current_user.id,
        garden_id=garden_id,
        reminder_type=reminder_type,
        title=title,
        description=description,
        remind_time=remind_time,
        priority=priority,
        source='manual',
        status='pending'
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return {
        "message": "提醒创建成功",
        "reminder": {
            "id": reminder.id,
            "title": reminder.title,
            "remind_time": reminder.remind_time.isoformat(),
            "reminder_type": reminder.reminder_type
        }
    }



def _generate_order_based_reminders(db: Session, user_id: int) -> int:
    """基于活跃订单生成基础提醒（无种植记录时的回退策略）"""
    from datetime import timedelta

    active_orders = db.query(Order).filter(
        Order.user_id == user_id,
        Order.status.in_(['confirmed', 'active'])
    ).all()

    count = 0
    now = datetime.now()
    remind_base = now.replace(hour=9, minute=0, second=0, microsecond=0)
    if remind_base <= now:
        remind_base += timedelta(days=1)

    for order in active_orders:
        garden = db.query(Garden).filter(Garden.id == order.garden_id).first()
        garden_name = garden.name if garden else f"菜地#{order.garden_id}"

        # 最近3天内是否已有订单生成的提醒
        recent_cutoff = now - timedelta(days=3)
        existing = db.query(SmartReminder).filter(
            SmartReminder.user_id == user_id,
            SmartReminder.garden_id == order.garden_id,
            SmartReminder.status == 'pending',
            SmartReminder.source == 'order_based',
            SmartReminder.created_at >= recent_cutoff
        ).count()

        if existing > 0:
            continue

        watering = SmartReminder(
            user_id=user_id,
            garden_id=order.garden_id,
            reminder_type='watering',
            title=f'给{garden_name}浇水',
            description='建议每2-3天浇水一次，保持土壤湿润',
            remind_time=remind_base,
            priority=3,
            source='order_based',
            status='pending',
            extra_data={'order_id': order.id, 'frequency': 3}
        )
        db.add(watering)
        count += 1

        fertilizing = SmartReminder(
            user_id=user_id,
            garden_id=order.garden_id,
            reminder_type='fertilizing',
            title=f'为{garden_name}施肥',
            description='建议每7-10天施一次有机肥，促进作物健康生长',
            remind_time=remind_base + timedelta(days=7),
            priority=2,
            source='order_based',
            status='pending',
            extra_data={'order_id': order.id, 'frequency': 7, 'fertilizer_type': '有机肥'}
        )
        db.add(fertilizing)
        count += 1

    if count > 0:
        db.commit()
    return count


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
