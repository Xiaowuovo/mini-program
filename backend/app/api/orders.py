"""
订单API路由
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from dateutil.relativedelta import relativedelta
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.models.garden import Garden, GardenStatus
from app.models.user import User
from app.schemas.order import (
    Order as OrderSchema,
    OrderCreate,
    OrderUpdate,
    OrderDetail,
    OrderListResponse
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()


@router.get("/my", response_model=OrderListResponse, summary="获取我的订单统计")
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的订单统计信息（用于个人中心页面）"""

    # 查询用户的所有订单
    total = db.query(Order).filter(Order.user_id == current_user.id).count()

    # 查询不同状态的订单数量
    pending = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.status == OrderStatus.PENDING
    ).count()

    paid = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.status == OrderStatus.PAID
    ).count()

    completed = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.status == OrderStatus.COMPLETED
    ).count()

    # 获取最近的订单
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(Order.created_at.desc()).limit(5).all()

    # 构造详情列表
    order_details = []
    for order in orders:
        garden = db.query(Garden).filter(Garden.id == order.garden_id).first()
        order_dict = OrderDetail.from_orm(order).dict()
        if garden:
            order_dict["garden_name"] = garden.name
            order_dict["garden_location"] = garden.location
        order_details.append(OrderDetail(**order_dict))

    return OrderListResponse(total=total, items=order_details)


@router.get("", response_model=OrderListResponse, summary="获取订单列表")
async def get_orders(
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    status: Optional[str] = Query(None, description="订单状态筛选"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的订单列表"""

    query = db.query(Order).filter(Order.user_id == current_user.id)

    # 状态筛选（排除None和空字符串）
    if status and status.strip():
        try:
            # 使用OrderStatus枚举进行比较
            query = query.filter(Order.status == OrderStatus(status))
        except ValueError:
            pass  # 忽略无效的状态值

    # 获取总数
    total = query.count()

    # 分页查询
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    # 构造详情列表（包含菜地信息）
    order_details = []
    for order in orders:
        garden = db.query(Garden).filter(Garden.id == order.garden_id).first()
        order_dict = OrderDetail.from_orm(order).dict()
        if garden:
            order_dict["garden_name"] = garden.name
            order_dict["garden_location"] = garden.location
        order_details.append(OrderDetail(**order_dict))

    return OrderListResponse(total=total, items=order_details)


@router.get("/{order_id}", response_model=OrderDetail, summary="获取订单详情")
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定订单的详细信息"""

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )

    # 获取菜地信息
    garden = db.query(Garden).filter(Garden.id == order.garden_id).first()
    order_dict = OrderDetail.from_orm(order).dict()
    if garden:
        order_dict["garden_name"] = garden.name
        order_dict["garden_location"] = garden.location

    return OrderDetail(**order_dict)


@router.post("", response_model=OrderSchema, summary="创建订单")
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新订单

    流程:
    1. 验证菜地是否可用
    2. 计算租金总价
    3. 创建订单
    """

    # 检查菜地是否存在且可用
    garden = db.query(Garden).filter(Garden.id == order_data.garden_id).first()

    if not garden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜地不存在"
        )

    if garden.status != GardenStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该菜地当前不可租用"
        )

    # 计算租用月数和总价
    months = (order_data.end_date.year - order_data.start_date.year) * 12 + \
             (order_data.end_date.month - order_data.start_date.month)

    if months <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="结束日期必须晚于开始日期"
        )

    total_price = garden.price * months

    # 创建订单
    order = Order(
        user_id=current_user.id,
        garden_id=order_data.garden_id,
        start_date=order_data.start_date,
        end_date=order_data.end_date,
        total_price=total_price,
        status=OrderStatus.PENDING
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return order


@router.put("/{order_id}/pay", response_model=OrderSchema, summary="支付订单")
async def pay_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    支付订单（模拟支付）

    实际项目中需要接入微信支付
    """

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )

    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单状态不正确"
        )

    # 更新订单状态
    order.status = OrderStatus.PAID
    order.payment_time = datetime.now()

    # 更新菜地状态为已租出
    garden = db.query(Garden).filter(Garden.id == order.garden_id).first()
    if garden:
        garden.status = GardenStatus.RENTED

    db.commit()
    db.refresh(order)

    return order


@router.put("/{order_id}/cancel", response_model=OrderSchema, summary="取消订单")
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取消订单"""

    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )

    if order.status not in [OrderStatus.PENDING, OrderStatus.PAID]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该订单不能取消"
        )

    # 更新订单状态
    order.status = OrderStatus.CANCELLED

    # 如果菜地被租出，恢复为可用状态
    if order.status == OrderStatus.PAID:
        garden = db.query(Garden).filter(Garden.id == order.garden_id).first()
        if garden and garden.status == GardenStatus.RENTED:
            garden.status = GardenStatus.AVAILABLE

    db.commit()
    db.refresh(order)

    return order
