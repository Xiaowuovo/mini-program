"""
任务提醒API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.core.database import get_db
from app.models.reminder import Reminder, TaskType, ReminderStatus
from app.models.order import Order, OrderStatus
from app.models.garden import Garden
from app.models.user import User
from app.schemas.reminder import (
    Reminder as ReminderSchema,
    ReminderCreate,
    ReminderUpdate,
    ReminderDetail,
    ReminderListResponse,
    ReminderTemplate,
    ReminderTemplateList
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

# 提醒模板配置
REMINDER_TEMPLATES = {
    TaskType.WATERING: {
        "content_template": "您的菜地该浇水啦！建议{action}浇水，保持土壤湿润。",
        "interval_days": 3
    },
    TaskType.FERTILIZING: {
        "content_template": "距离上次施肥已过{interval}周，建议{action}施肥一次。",
        "interval_days": 14
    },
    TaskType.WEEDING: {
        "content_template": "您的菜地需要除草啦！建议{action}进行除草，保持菜地整洁。",
        "interval_days": 7
    },
    TaskType.HARVESTING: {
        "content_template": "您的作物可以收获啦！建议{action}收获，享受丰收的喜悦。",
        "interval_days": 30
    }
}


@router.get("/templates", response_model=ReminderTemplateList, summary="获取提醒模板")
async def get_reminder_templates():
    """获取任务提醒模板配置"""
    templates = []
    for task_type, config in REMINDER_TEMPLATES.items():
        templates.append(ReminderTemplate(
            task_type=task_type,
            content_template=config["content_template"],
            interval_days=config["interval_days"]
        ))

    return ReminderTemplateList(templates=templates)


@router.get("", response_model=ReminderListResponse, summary="获取任务提醒列表")
async def get_reminders(
    status: Optional[ReminderStatus] = Query(None, description="筛选状态"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的任务提醒列表"""

    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)

    # 状态筛选
    if status is not None:
        query = query.filter(Reminder.status == status)

    # 获取总数
    total = query.count()

    # 分页查询，按提醒时间排序
    reminders = query.order_by(Reminder.remind_time.desc()).offset(skip).limit(limit).all()

    # 构造详情列表（包含订单和菜地信息）
    reminder_details = []
    for reminder in reminders:
        order = db.query(Order).filter(Order.id == reminder.order_id).first()
        garden = None
        if order:
            garden = db.query(Garden).filter(Garden.id == order.garden_id).first()

        reminder_dict = ReminderDetail.from_orm(reminder).dict()
        if garden:
            reminder_dict["garden_name"] = garden.name

        reminder_details.append(ReminderDetail(**reminder_dict))

    return ReminderListResponse(total=total, items=reminder_details)


@router.get("/pending", response_model=ReminderListResponse, summary="获取待处理的提醒")
async def get_pending_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取待处理的任务提醒
    包括状态为pending且提醒时间已到或即将到来的提醒
    """

    now = datetime.now()
    future_time = now + timedelta(days=1)  # 未来1天内的提醒

    query = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.status == ReminderStatus.PENDING,
        Reminder.remind_time <= future_time
    )

    total = query.count()
    reminders = query.order_by(Reminder.remind_time.asc()).all()

    # 构造详情列表
    reminder_details = []
    for reminder in reminders:
        order = db.query(Order).filter(Order.id == reminder.order_id).first()
        garden = None
        if order:
            garden = db.query(Garden).filter(Garden.id == order.garden_id).first()

        reminder_dict = ReminderDetail.from_orm(reminder).dict()
        if garden:
            reminder_dict["garden_name"] = garden.name

        reminder_details.append(ReminderDetail(**reminder_dict))

    return ReminderListResponse(total=total, items=reminder_details)


@router.get("/{reminder_id}", response_model=ReminderDetail, summary="获取提醒详情")
async def get_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定任务提醒的详细信息"""

    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提醒不存在"
        )

    # 获取关联信息
    order = db.query(Order).filter(Order.id == reminder.order_id).first()
    garden = None
    if order:
        garden = db.query(Garden).filter(Garden.id == order.garden_id).first()

    reminder_dict = ReminderDetail.from_orm(reminder).dict()
    if garden:
        reminder_dict["garden_name"] = garden.name

    return ReminderDetail(**reminder_dict)


@router.put("/{reminder_id}/complete", response_model=ReminderSchema, summary="标记提醒已完成")
async def complete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """标记任务提醒为已完成"""

    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提醒不存在"
        )

    reminder.status = ReminderStatus.COMPLETED

    db.commit()
    db.refresh(reminder)

    return reminder


# ========== 管理员接口 ==========

@router.post("/admin/create", response_model=ReminderSchema, summary="创建任务提醒（管理员）")
async def create_reminder_admin(
    reminder_data: ReminderCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    管理员创建任务提醒

    可以为任何订单创建提醒
    """

    # 验证订单
    order = db.query(Order).filter(Order.id == reminder_data.order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )

    if order.status not in [OrderStatus.PAID, OrderStatus.ACTIVE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单状态不正确，无法创建提醒"
        )

    # 创建提醒
    reminder = Reminder(
        order_id=reminder_data.order_id,
        user_id=order.user_id,
        task_type=reminder_data.task_type,
        content=reminder_data.content,
        remind_time=reminder_data.remind_time,
        status=ReminderStatus.PENDING
    )

    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return reminder


@router.post("/admin/auto-create/{order_id}", summary="为订单自动创建提醒（管理员）")
async def auto_create_reminders_for_order(
    order_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    为指定订单自动创建一系列任务提醒
    根据提醒模板和订单时间范围生成
    """

    # 验证订单
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )

    if order.status not in [OrderStatus.PAID, OrderStatus.ACTIVE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单状态不正确"
        )

    created_reminders = []
    current_date = datetime.now()
    end_date = datetime.combine(order.end_date, datetime.min.time())

    # 为每种任务类型创建提醒
    for task_type, config in REMINDER_TEMPLATES.items():
        interval = config["interval_days"]
        template = config["content_template"]

        # 根据间隔天数创建多个提醒
        remind_date = current_date + timedelta(days=interval)

        while remind_date <= end_date:
            # 根据模板生成内容
            if task_type == TaskType.WATERING:
                content = template.format(action="今天下午")
            elif task_type == TaskType.FERTILIZING:
                weeks = interval // 7
                content = template.format(interval=weeks, action="本周末")
            elif task_type == TaskType.WEEDING:
                content = template.format(action="本周")
            elif task_type == TaskType.HARVESTING:
                content = template.format(action="近期")
            else:
                content = template

            # 创建提醒
            reminder = Reminder(
                order_id=order_id,
                user_id=order.user_id,
                task_type=task_type,
                content=content,
                remind_time=remind_date,
                status=ReminderStatus.PENDING
            )

            db.add(reminder)
            created_reminders.append({
                "task_type": task_type.value,
                "remind_time": remind_date.isoformat()
            })

            # 计算下一个提醒时间
            remind_date += timedelta(days=interval)

    db.commit()

    return {
        "message": f"成功为订单 {order_id} 创建 {len(created_reminders)} 条提醒",
        "reminders": created_reminders
    }


@router.get("/admin/all", response_model=ReminderListResponse, summary="获取所有提醒（管理员）")
async def get_all_reminders_admin(
    status: Optional[ReminderStatus] = Query(None, description="筛选状态"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """管理员获取所有任务提醒列表"""

    query = db.query(Reminder)

    # 状态筛选
    if status is not None:
        query = query.filter(Reminder.status == status)

    # 获取总数
    total = query.count()

    # 分页查询
    reminders = query.order_by(Reminder.remind_time.desc()).offset(skip).limit(limit).all()

    # 构造详情列表
    reminder_details = []
    for reminder in reminders:
        order = db.query(Order).filter(Order.id == reminder.order_id).first()
        garden = None
        if order:
            garden = db.query(Garden).filter(Garden.id == order.garden_id).first()

        reminder_dict = ReminderDetail.from_orm(reminder).dict()
        if garden:
            reminder_dict["garden_name"] = garden.name

        reminder_details.append(ReminderDetail(**reminder_dict))

    return ReminderListResponse(total=total, items=reminder_details)


@router.put("/admin/{reminder_id}", response_model=ReminderSchema, summary="更新提醒（管理员）")
async def update_reminder_admin(
    reminder_id: int,
    reminder_update: ReminderUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """管理员更新任务提醒"""

    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提醒不存在"
        )

    # 更新字段
    if reminder_update.status is not None:
        reminder.status = reminder_update.status
    if reminder_update.content is not None:
        reminder.content = reminder_update.content
    if reminder_update.remind_time is not None:
        reminder.remind_time = reminder_update.remind_time

    db.commit()
    db.refresh(reminder)

    return reminder


@router.delete("/admin/{reminder_id}", summary="删除提醒（管理员）")
async def delete_reminder_admin(
    reminder_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """管理员删除任务提醒"""

    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="提醒不存在"
        )

    db.delete(reminder)
    db.commit()

    return {"message": "删除成功"}
