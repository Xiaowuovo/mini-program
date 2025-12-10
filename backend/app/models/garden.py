"""
菜地数据模型
"""
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class GardenStatus(str, enum.Enum):
    """菜地状态枚举"""
    AVAILABLE = "available"      # 可租用
    RENTED = "rented"            # 已租出
    MAINTENANCE = "maintenance"  # 维护中


class Garden(Base):
    """菜地模型"""
    __tablename__ = "gardens"

    id = Column(Integer, primary_key=True, index=True, comment="菜地ID")
    name = Column(String(100), nullable=False, comment="菜地名称")
    area = Column(Numeric(10, 2), nullable=False, comment="面积(平方米)")
    price = Column(Numeric(10, 2), nullable=False, comment="租金(元/月)")
    status = Column(Enum(GardenStatus, values_callable=lambda x: [e.value for e in x]), default=GardenStatus.AVAILABLE, comment="状态")
    location = Column(String(200), comment="位置描述")
    images = Column(JSON, comment="图片URL列表")
    video_stream_url = Column(String(500), comment="视频流地址")
    description = Column(Text, comment="详细描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    def __repr__(self):
        return f"<Garden(id={self.id}, name={self.name}, status={self.status})>"
