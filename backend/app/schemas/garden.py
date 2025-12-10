"""
菜地数据Schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.models.garden import GardenStatus
from app.models.order import OrderStatus


class GardenBase(BaseModel):
    """菜地基础Schema"""
    name: str = Field(..., max_length=100, description="菜地名称")
    area: Decimal = Field(..., description="面积(平方米)", ge=0)
    price: Decimal = Field(..., description="租金(元/月)", ge=0)
    location: Optional[str] = Field(None, max_length=200, description="位置描述")
    description: Optional[str] = Field(None, description="详细描述")


class GardenCreate(GardenBase):
    """创建菜地Schema"""
    images: Optional[List[str]] = Field(default=[], description="图片URL列表")
    video_stream_url: Optional[str] = Field(None, max_length=500, description="视频流地址")


class GardenUpdate(BaseModel):
    """更新菜地Schema"""
    name: Optional[str] = Field(None, max_length=100, description="菜地名称")
    area: Optional[Decimal] = Field(None, description="面积(平方米)", ge=0)
    price: Optional[Decimal] = Field(None, description="租金(元/月)", ge=0)
    status: Optional[GardenStatus] = Field(None, description="状态")
    location: Optional[str] = Field(None, max_length=200, description="位置描述")
    images: Optional[List[str]] = Field(None, description="图片URL列表")
    video_stream_url: Optional[str] = Field(None, max_length=500, description="视频流地址")
    description: Optional[str] = Field(None, description="详细描述")


class GardenInDB(GardenBase):
    """数据库中的菜地Schema"""
    id: int
    status: GardenStatus
    images: Optional[List[str]]
    video_stream_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderInfo(BaseModel):
    """订单信息（嵌套在菜地响应中）"""
    order_id: int = Field(..., description="订单ID")
    start_date: date = Field(..., description="开始日期")
    end_date: date = Field(..., description="结束日期")
    status: OrderStatus = Field(..., description="订单状态")
    remaining_days: int = Field(..., description="剩余天数", ge=0)
    is_active: bool = Field(..., description="是否在使用中")

    class Config:
        from_attributes = True


class Garden(GardenInDB):
    """菜地响应Schema（包含用户相关信息）"""
    is_mine: Optional[bool] = Field(default=False, description="是否是我的菜地")
    current_order: Optional[OrderInfo] = Field(None, description="当前订单信息（如果是我的菜地）")

    class Config:
        from_attributes = True


class GardenListResponse(BaseModel):
    """菜地列表响应Schema"""
    total: int = Field(..., description="总数")
    items: List[Garden] = Field(..., description="菜地列表")
