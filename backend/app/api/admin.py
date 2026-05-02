"""
管理员专属API路由
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime, timedelta
from app.core.database import get_db
from app.models.user import User
from app.models.garden import Garden, GardenStatus
from app.models.order import Order, OrderStatus
from app.api.deps import get_current_admin

router = APIRouter()


@router.get("/stats", summary="获取管理统计数据")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """获取运营统计数据（仅管理员）"""

    # 菜地统计
    total_gardens = db.query(Garden).count()
    available_gardens = db.query(Garden).filter(Garden.status == GardenStatus.AVAILABLE).count()
    rented_gardens = db.query(Garden).filter(Garden.status == GardenStatus.RENTED).count()
    maintenance_gardens = db.query(Garden).filter(Garden.status == GardenStatus.MAINTENANCE).count()

    # 订单统计
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == OrderStatus.PENDING).count()
    paid_orders = db.query(Order).filter(Order.status == OrderStatus.PAID).count()
    active_orders = db.query(Order).filter(Order.status == OrderStatus.ACTIVE).count()
    completed_orders = db.query(Order).filter(Order.status == OrderStatus.COMPLETED).count()
    cancelled_orders = db.query(Order).filter(Order.status == OrderStatus.CANCELLED).count()

    # 用户统计
    total_users = db.query(User).count()
    tenant_users = db.query(User).filter(User.role == 'tenant').count()

    # 收入统计（已付款 / 进行中 / 已完成订单）
    paid_statuses = [OrderStatus.PAID, OrderStatus.ACTIVE, OrderStatus.COMPLETED]
    total_revenue_result = db.query(func.sum(Order.total_price)).filter(
        Order.status.in_(paid_statuses)
    ).scalar()
    total_revenue = float(total_revenue_result or 0)

    # 本月收入
    today = date.today()
    month_start = today.replace(day=1)
    month_revenue_result = db.query(func.sum(Order.total_price)).filter(
        Order.status.in_(paid_statuses),
        Order.created_at >= datetime.combine(month_start, datetime.min.time())
    ).scalar()
    month_revenue = float(month_revenue_result or 0)

    # 近7天收入趋势
    revenue_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        day_revenue = db.query(func.sum(Order.total_price)).filter(
            Order.status.in_(paid_statuses),
            Order.created_at >= day_start,
            Order.created_at <= day_end
        ).scalar()
        revenue_trend.append({
            'date': f"{day.month}/{day.day}",
            'amount': float(day_revenue or 0)
        })

    # 热门菜地 Top5（按订单数量）
    top_gardens_query = db.query(
        Garden.name,
        func.count(Order.id).label('order_count'),
        func.sum(Order.total_price).label('total_revenue')
    ).join(Order, Garden.id == Order.garden_id).filter(
        Order.status.in_(paid_statuses)
    ).group_by(Garden.id, Garden.name).order_by(
        func.count(Order.id).desc()
    ).limit(5).all()

    top_gardens = [
        {
            'name': row.name,
            'orders': row.order_count,
            'revenue': float(row.total_revenue or 0)
        }
        for row in top_gardens_query
    ]

    return {
        'overview': {
            'totalGardens': total_gardens,
            'rentedGardens': rented_gardens,
            'rentRate': round(rented_gardens / total_gardens * 100) if total_gardens > 0 else 0,
            'totalOrders': total_orders,
            'completedOrders': completed_orders,
            'totalRevenue': total_revenue,
            'monthRevenue': month_revenue,
            'totalUsers': total_users,
            'activeUsers': tenant_users
        },
        'gardenStats': {
            'available': available_gardens,
            'rented': rented_gardens,
            'maintenance': maintenance_gardens
        },
        'orderStats': {
            'pending': pending_orders,
            'paid': paid_orders,
            'active': active_orders,
            'completed': completed_orders,
            'cancelled': cancelled_orders
        },
        'revenueTrend': revenue_trend,
        'topGardens': top_gardens
    }


@router.get("/users", summary="获取所有用户（管理员）")
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    role: Optional[str] = Query(None, description="角色筛选：all/tenant/admin"),
    keyword: Optional[str] = Query(None, description="昵称/手机号搜索"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """获取用户列表，包含订单数量（仅管理员）"""

    query = db.query(User)

    if role and role != 'all':
        query = query.filter(User.role == role)

    if keyword:
        query = query.filter(
            User.nickname.contains(keyword) | User.phone.contains(keyword)
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    user_list = []
    for user in users:
        order_count = db.query(Order).filter(Order.user_id == user.id).count()
        user_list.append({
            'id': user.id,
            'nickname': user.nickname or '未设置昵称',
            'role': user.role,
            'phone': user.phone or '',
            'avatar': user.avatar or '',
            'created_at': user.created_at.strftime('%Y-%m-%d') if user.created_at else '',
            'total_orders': order_count
        })

    return {'total': total, 'items': user_list}


@router.get("/public-stats", summary="获取公开统计数据")
async def get_public_stats(db: Session = Depends(get_db)):
    """获取首页公开统计数据（无需认证）"""
    total_gardens = db.query(Garden).count()
    available_gardens = db.query(Garden).filter(Garden.status == GardenStatus.AVAILABLE).count()
    total_users = db.query(User).count()

    return {
        'totalGardens': total_gardens,
        'availableGardens': available_gardens,
        'totalUsers': total_users
    }
