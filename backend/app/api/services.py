"""
增值服务API路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
from app.core.database import get_db
from app.models.service import Service, ServiceType, ServiceStatus
from app.models.order import Order, OrderStatus
from app.models.garden import Garden
from app.models.user import User
from app.schemas.service import (
    Service as ServiceSchema,
    ServiceCreate,
    ServiceUpdate,
    ServiceDetail,
    ServiceListResponse,
    ServicePriceConfig
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

# 服务价格配置（实际项目中应该存储在数据库或配置文件）
SERVICE_PRICES = {
    ServiceType.WATERING: Decimal("10.00"),
    ServiceType.FERTILIZING: Decimal("20.00"),
    ServiceType.WEEDING: Decimal("15.00"),
    ServiceType.PEST_CONTROL: Decimal("25.00"),
    ServiceType.HARVESTING: Decimal("30.00"),
}


@router.get("/prices", response_model=ServicePriceConfig, summary="获取服务价格配置")
async def get_service_prices():
    """获取各类增值服务的价格"""
    return {
        "代浇水": SERVICE_PRICES[ServiceType.WATERING],
        "代施肥": SERVICE_PRICES[ServiceType.FERTILIZING],
        "代除草": SERVICE_PRICES[ServiceType.WEEDING],
        "代除虫": SERVICE_PRICES[ServiceType.PEST_CONTROL],
        "代收获": SERVICE_PRICES[ServiceType.HARVESTING],
    }


@router.get("", response_model=ServiceListResponse, summary="获取增值服务列表")
async def get_services(
    status: Optional[ServiceStatus] = Query(None, description="筛选状态"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的增值服务列表"""

    query = db.query(Service).filter(Service.user_id == current_user.id)

    # 状态筛选
    if status is not None:
        query = query.filter(Service.status == status)

    # 获取总数
    total = query.count()

    # 分页查询
    services = query.order_by(Service.created_at.desc()).offset(skip).limit(limit).all()

    # 构造详情列表（包含订单和菜地信息）
    service_details = []
    for service in services:
        order = db.query(Order).filter(Order.id == service.order_id).first()
        garden = None
        if order:
            garden = db.query(Garden).filter(Garden.id == order.garden_id).first()

        service_dict = ServiceDetail.from_orm(service).dict()
        if garden:
            service_dict["garden_name"] = garden.name
        service_dict["user_nickname"] = current_user.nickname

        service_details.append(ServiceDetail(**service_dict))

    return ServiceListResponse(total=total, items=service_details)


@router.get("/{service_id}", response_model=ServiceDetail, summary="获取增值服务详情")
async def get_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定增值服务的详细信息"""

    service = db.query(Service).filter(
        Service.id == service_id,
        Service.user_id == current_user.id
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务不存在"
        )

    # 获取关联信息
    order = db.query(Order).filter(Order.id == service.order_id).first()
    garden = None
    if order:
        garden = db.query(Garden).filter(Garden.id == order.garden_id).first()

    service_dict = ServiceDetail.from_orm(service).dict()
    if garden:
        service_dict["garden_name"] = garden.name
    service_dict["user_nickname"] = current_user.nickname

    return ServiceDetail(**service_dict)


@router.post("", response_model=ServiceSchema, summary="创建增值服务")
async def create_service(
    service_data: ServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新的增值服务请求

    流程:
    1. 验证订单是否存在且属于当前用户
    2. 验证订单状态是否有效（已支付或进行中）
    3. 根据服务类型计算价格
    4. 创建服务记录
    """

    # 验证订单
    order = db.query(Order).filter(
        Order.id == service_data.order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )

    if order.status not in [OrderStatus.PAID, OrderStatus.ACTIVE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单状态不正确，无法申请服务"
        )

    # 获取服务价格
    price = SERVICE_PRICES.get(service_data.service_type, Decimal("0.00"))

    # 创建服务
    service = Service(
        order_id=service_data.order_id,
        user_id=current_user.id,
        service_type=service_data.service_type,
        price=price,
        notes=service_data.notes,
        status=ServiceStatus.PENDING
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return service


@router.put("/{service_id}/cancel", response_model=ServiceSchema, summary="取消增值服务")
async def cancel_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取消增值服务（仅待处理状态可取消）"""

    service = db.query(Service).filter(
        Service.id == service_id,
        Service.user_id == current_user.id
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务不存在"
        )

    if service.status != ServiceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该服务不能取消"
        )

    service.status = ServiceStatus.CANCELLED

    db.commit()
    db.refresh(service)

    return service


# ========== 管理员接口 ==========

@router.get("/admin/all", response_model=ServiceListResponse, summary="获取所有增值服务（管理员）")
async def get_all_services_admin(
    status: Optional[ServiceStatus] = Query(None, description="筛选状态"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """管理员获取所有增值服务列表"""

    query = db.query(Service)

    # 状态筛选
    if status is not None:
        query = query.filter(Service.status == status)

    # 获取总数
    total = query.count()

    # 分页查询
    services = query.order_by(Service.created_at.desc()).offset(skip).limit(limit).all()

    # 构造详情列表
    service_details = []
    for service in services:
        order = db.query(Order).filter(Order.id == service.order_id).first()
        garden = None
        user = db.query(User).filter(User.id == service.user_id).first()

        if order:
            garden = db.query(Garden).filter(Garden.id == order.garden_id).first()

        service_dict = ServiceDetail.from_orm(service).dict()
        if garden:
            service_dict["garden_name"] = garden.name
        if user:
            service_dict["user_nickname"] = user.nickname

        service_details.append(ServiceDetail(**service_dict))

    return ServiceListResponse(total=total, items=service_details)


@router.put("/admin/{service_id}", response_model=ServiceSchema, summary="更新增值服务状态（管理员）")
async def update_service_admin(
    service_id: int,
    service_update: ServiceUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """管理员更新增值服务状态"""

    service = db.query(Service).filter(Service.id == service_id).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服务不存在"
        )

    # 更新状态
    if service_update.status is not None:
        service.status = service_update.status

        # 如果标记为完成，记录完成时间
        if service_update.status == ServiceStatus.COMPLETED:
            service.completed_at = datetime.now()

    # 更新备注
    if service_update.notes is not None:
        service.notes = service_update.notes

    db.commit()
    db.refresh(service)

    return service
