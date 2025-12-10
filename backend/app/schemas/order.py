"""
订单数据Schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.models.order import OrderStatus


class OrderBase(BaseModel):
    """订单基础Schema"""
    garden_id: int = Field(..., description="菜地ID")
    start_date: date = Field(..., description="租用开始日期")
    end_date: date = Field(..., description="租用结束日期")


class OrderCreate(OrderBase):
    """创建订单Schema"""
    pass


class OrderUpdate(BaseModel):
    """更新订单Schema"""
    status: Optional[OrderStatus] = Field(None, description="订单状态")


class OrderInDB(OrderBase):
    """数据库中的订单Schema"""
    id: int
    user_id: int
    total_price: Decimal
    status: OrderStatus
    payment_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Order(OrderInDB):
    """订单响应Schema"""
    pass


class OrderDetail(Order):
    """订单详情Schema（包含菜地信息）"""
    garden_name: Optional[str] = Field(None, description="菜地名称")
    garden_location: Optional[str] = Field(None, description="菜地位置")


class OrderListResponse(BaseModel):
    """订单列表响应Schema"""
    total: int = Field(..., description="总数")
    items: List[OrderDetail] = Field(..., description="订单列表")
