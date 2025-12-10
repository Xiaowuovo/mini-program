"""
订单数据模型
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class OrderStatus(str, enum.Enum):
    """订单状态枚举"""
    PENDING = "pending"      # 待支付
    PAID = "paid"            # 已支付
    ACTIVE = "active"        # 进行中
    COMPLETED = "completed"  # 已完成
    CANCELLED = "cancelled"  # 已取消


class Order(Base):
    """订单模型"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, comment="订单ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    garden_id = Column(Integer, ForeignKey("gardens.id"), nullable=False, index=True, comment="菜地ID")
    start_date = Column(Date, nullable=False, comment="租用开始日期")
    end_date = Column(Date, nullable=False, comment="租用结束日期")
    total_price = Column(Numeric(10, 2), nullable=False, comment="总价")
    status = Column(Enum(OrderStatus, values_callable=lambda x: [e.value for e in x]), default=OrderStatus.PENDING, comment="订单状态")
    payment_time = Column(DateTime(timezone=True), comment="支付时间")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    # user = relationship("User", backref="orders")
    # garden = relationship("Garden", backref="orders")

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status})>"
