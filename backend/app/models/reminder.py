"""
任务提醒数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class TaskType(str, enum.Enum):
    """任务类型枚举"""
    WATERING = "watering"      # 浇水
    FERTILIZING = "fertilizing"  # 施肥
    WEEDING = "weeding"        # 除草
    HARVESTING = "harvesting"  # 收获


class ReminderStatus(str, enum.Enum):
    """提醒状态枚举"""
    PENDING = "pending"      # 待发送
    SENT = "sent"            # 已发送
    COMPLETED = "completed"  # 已完成


class Reminder(Base):
    """任务提醒模型"""
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True, comment="提醒ID")
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True, comment="订单ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    task_type = Column(Enum(TaskType, values_callable=lambda x: [e.value for e in x]), nullable=False, comment="任务类型")
    content = Column(Text, nullable=False, comment="提醒内容")
    remind_time = Column(DateTime(timezone=True), nullable=False, comment="提醒时间")
    status = Column(Enum(ReminderStatus, values_callable=lambda x: [e.value for e in x]), default=ReminderStatus.PENDING, comment="状态")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")

    def __repr__(self):
        return f"<Reminder(id={self.id}, task_type={self.task_type}, status={self.status})>"
