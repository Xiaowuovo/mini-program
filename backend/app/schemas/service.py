"""
增值服务数据Schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.service import ServiceType, ServiceStatus


class ServiceBase(BaseModel):
    """增值服务基础Schema"""
    order_id: int = Field(..., description="订单ID")
    service_type: ServiceType = Field(..., description="服务类型")
    notes: Optional[str] = Field(None, description="备注")


class ServiceCreate(ServiceBase):
    """创建增值服务Schema"""
    pass


class ServiceUpdate(BaseModel):
    """更新增值服务Schema"""
    status: Optional[ServiceStatus] = Field(None, description="服务状态")
    notes: Optional[str] = Field(None, description="备注")


class ServiceInDB(ServiceBase):
    """数据库中的增值服务Schema"""
    id: int
    user_id: int
    price: Decimal
    status: ServiceStatus
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class Service(ServiceInDB):
    """增值服务响应Schema"""
    pass


class ServiceDetail(Service):
    """增值服务详情Schema（包含订单和菜地信息）"""
    garden_name: Optional[str] = Field(None, description="菜地名称")
    user_nickname: Optional[str] = Field(None, description="用户昵称")


class ServiceListResponse(BaseModel):
    """增值服务列表响应Schema"""
    total: int = Field(..., description="总数")
    items: List[ServiceDetail] = Field(..., description="服务列表")


class ServicePriceConfig(BaseModel):
    """服务价格配置Schema"""
    代浇水: Decimal = Field(default=10.00, description="代浇水价格")
    代施肥: Decimal = Field(default=20.00, description="代施肥价格")
    代除草: Decimal = Field(default=15.00, description="代除草价格")
    代除虫: Decimal = Field(default=25.00, description="代除虫价格")
    代收获: Decimal = Field(default=30.00, description="代收获价格")
