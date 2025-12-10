"""
任务提醒数据Schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.reminder import TaskType, ReminderStatus


class ReminderBase(BaseModel):
    """任务提醒基础Schema"""
    task_type: TaskType = Field(..., description="任务类型")
    content: str = Field(..., description="提醒内容")
    remind_time: datetime = Field(..., description="提醒时间")


class ReminderCreate(ReminderBase):
    """创建任务提醒Schema"""
    order_id: int = Field(..., description="订单ID")


class ReminderUpdate(BaseModel):
    """更新任务提醒Schema"""
    status: Optional[ReminderStatus] = Field(None, description="状态")
    content: Optional[str] = Field(None, description="提醒内容")
    remind_time: Optional[datetime] = Field(None, description="提醒时间")


class ReminderInDB(ReminderBase):
    """数据库中的任务提醒Schema"""
    id: int
    order_id: int
    user_id: int
    status: ReminderStatus
    created_at: datetime

    class Config:
        from_attributes = True


class Reminder(ReminderInDB):
    """任务提醒响应Schema"""
    pass


class ReminderDetail(Reminder):
    """任务提醒详情Schema（包含订单和菜地信息）"""
    garden_name: Optional[str] = Field(None, description="菜地名称")


class ReminderListResponse(BaseModel):
    """任务提醒列表响应Schema"""
    total: int = Field(..., description="总数")
    items: List[ReminderDetail] = Field(..., description="提醒列表")


class ReminderTemplate(BaseModel):
    """提醒模板Schema"""
    task_type: TaskType
    content_template: str
    interval_days: int = Field(..., description="间隔天数")


class ReminderTemplateList(BaseModel):
    """提醒模板列表Schema"""
    templates: List[ReminderTemplate]
