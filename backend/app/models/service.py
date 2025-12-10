"""
增值服务数据模型
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ServiceType(str, enum.Enum):
    """服务类型枚举"""
    WATERING = "代浇水"
    FERTILIZING = "代施肥"
    WEEDING = "代除草"
    PEST_CONTROL = "代除虫"
    HARVESTING = "代收获"


class ServiceStatus(str, enum.Enum):
    """服务状态枚举"""
    PENDING = "pending"        # 待处理
    PROCESSING = "processing"  # 处理中
    COMPLETED = "completed"    # 已完成
    CANCELLED = "cancelled"    # 已取消


class Service(Base):
    """增值服务模型"""
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True, comment="服务ID")
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True, comment="订单ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    service_type = Column(Enum(ServiceType, values_callable=lambda x: [e.value for e in x]), nullable=False, comment="服务类型")
    price = Column(Numeric(10, 2), nullable=False, comment="服务价格")
    status = Column(Enum(ServiceStatus, values_callable=lambda x: [e.value for e in x]), default=ServiceStatus.PENDING, comment="状态")
    notes = Column(Text, comment="备注")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    completed_at = Column(DateTime(timezone=True), comment="完成时间")

    def __repr__(self):
        return f"<Service(id={self.id}, service_type={self.service_type}, status={self.status})>"
