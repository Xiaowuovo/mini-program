"""
菜地API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from app.core.database import get_db
from app.models.garden import Garden, GardenStatus
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.schemas.garden import (
    Garden as GardenSchema,
    GardenCreate,
    GardenUpdate,
    GardenListResponse,
    OrderInfo
)
from app.api.deps import get_current_user, get_current_user_optional, get_current_admin

router = APIRouter()


def _enrich_garden_with_order_info(garden: Garden, user_id: Optional[int], db: Session) -> dict:
    """
    丰富菜地信息，添加订单相关数据

    Args:
        garden: 菜地对象
        user_id: 当前用户ID（可选）
        db: 数据库会话

    Returns:
        包含订单信息的菜地字典
    """
    import json

    # 转换 garden 对象为字典，手动处理 images 字段
    garden_dict = {
        'id': garden.id,
        'name': garden.name,
        'area': garden.area,
        'price': garden.price,
        'status': garden.status,
        'location': garden.location,
        'description': garden.description,
        'images': json.loads(garden.images) if garden.images and isinstance(garden.images, str) else (garden.images or []),
        'video_stream_url': garden.video_stream_url,
        'created_at': garden.created_at,
        'updated_at': garden.updated_at
    }

    garden_dict['is_mine'] = False
    garden_dict['current_order'] = None

    # 如果用户已登录，检查是否有活跃订单
    if user_id:
        active_order = db.query(Order).filter(
            Order.user_id == user_id,
            Order.garden_id == garden.id,
            Order.status.in_([OrderStatus.PAID, OrderStatus.ACTIVE]),
            Order.end_date >= date.today()
        ).first()

        if active_order:
            # 计算剩余天数
            remaining_days = (active_order.end_date - date.today()).days

            garden_dict['is_mine'] = True
            garden_dict['current_order'] = {
                'order_id': active_order.id,
                'start_date': active_order.start_date,
                'end_date': active_order.end_date,
                'status': active_order.status,
                'remaining_days': max(0, remaining_days),
                'is_active': remaining_days >= 0
            }

    return garden_dict


@router.get("", response_model=GardenListResponse, summary="获取菜地列表")
async def get_gardens(
    status: Optional[GardenStatus] = Query(None, description="筛选状态"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    获取菜地列表

    支持按状态筛选和分页，如果用户已登录会标记用户的菜地
    """
    query = db.query(Garden)

    # 状态筛选
    if status is not None:
        query = query.filter(Garden.status == status)

    # 获取总数
    total = query.count()

    # 分页查询
    gardens = query.order_by(Garden.id.desc()).offset(skip).limit(limit).all()

    # 丰富菜地信息
    user_id = current_user.id if current_user else None
    garden_list = [
        GardenSchema(**_ensure_video_url(_enrich_garden_with_order_info(garden, user_id, db)))
        for garden in gardens
    ]

    return GardenListResponse(total=total, items=garden_list)


@router.get("/my", response_model=GardenListResponse, summary="获取我的菜地")
async def get_my_gardens(
    status_filter: Optional[str] = Query(None, description="筛选：all/active/expired"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取我的菜地列表

    基于用户的活跃订单返回菜地列表
    """
    # 查询用户的订单
    query = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.status.in_([OrderStatus.PAID, OrderStatus.ACTIVE, OrderStatus.COMPLETED])
    )

    # 根据状态筛选
    today = date.today()
    if status_filter == 'active':
        # 只显示未过期的
        query = query.filter(Order.end_date >= today)
    elif status_filter == 'expired':
        # 只显示已过期的
        query = query.filter(Order.end_date < today)
    # 'all' 或 None - 显示全部

    # 获取总数
    total = query.count()

    # 分页查询
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    # 获取对应的菜地并丰富信息
    garden_list = []
    for order in orders:
        garden = db.query(Garden).filter(Garden.id == order.garden_id).first()
        if garden:
            remaining_days = (order.end_date - today).days

            garden_dict = GardenSchema.from_orm(garden).dict()
            garden_dict['is_mine'] = True
            garden_dict['current_order'] = {
                'order_id': order.id,
                'start_date': order.start_date,
                'end_date': order.end_date,
                'status': order.status,
                'remaining_days': max(0, remaining_days),
                'is_active': remaining_days >= 0
            }
            # 确保有视频URL
            garden_dict = _ensure_video_url(garden_dict)
            garden_list.append(GardenSchema(**garden_dict))

    return GardenListResponse(total=total, items=garden_list)


@router.get("/{garden_id}", response_model=GardenSchema, summary="获取菜地详情")
async def get_garden(
    garden_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """获取指定菜地的详细信息，包括是否是当前用户的菜地"""
    garden = db.query(Garden).filter(Garden.id == garden_id).first()

    if not garden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜地不存在"
        )

    # 丰富菜地信息
    user_id = current_user.id if current_user else None
    garden_dict = _enrich_garden_with_order_info(garden, user_id, db)

    # 确保有视频URL
    garden_dict = _ensure_video_url(garden_dict)

    return GardenSchema(**garden_dict)


@router.post("", response_model=GardenSchema, summary="创建菜地（管理员）")
async def create_garden(
    garden_data: GardenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """创建新菜地（仅管理员）"""

    garden = Garden(
        name=garden_data.name,
        area=garden_data.area,
        price=garden_data.price,
        location=garden_data.location,
        description=garden_data.description,
        images=garden_data.images,
        video_stream_url=garden_data.video_stream_url,
        status=GardenStatus.AVAILABLE
    )

    db.add(garden)
    db.commit()
    db.refresh(garden)

    return garden


@router.put("/{garden_id}", response_model=GardenSchema, summary="更新菜地（管理员）")
async def update_garden(
    garden_id: int,
    garden_data: GardenUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """更新菜地信息（仅管理员）"""

    garden = db.query(Garden).filter(Garden.id == garden_id).first()

    if not garden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜地不存在"
        )

    # 更新字段
    update_data = garden_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(garden, field, value)

    db.commit()
    db.refresh(garden)

    return garden


@router.delete("/{garden_id}", summary="删除菜地（管理员）")
async def delete_garden(
    garden_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """删除菜地（仅管理员）"""

    garden = db.query(Garden).filter(Garden.id == garden_id).first()

    if not garden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜地不存在"
        )

    db.delete(garden)
    db.commit()

    return {"message": "删除成功"}


@router.get("/{garden_id}/status", summary="获取菜地完整状态")
async def get_garden_status(
    garden_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取菜地的完整状态信息

    包括：
    - 菜地基本信息
    - 当前种植记录
    - 物联网传感器数据
    - 环境状态评估
    - 智能提醒统计
    """
    from app.models.crop import Crop
    from app.services.iot_service import IoTService

    # 1. 获取菜地基本信息
    garden = db.query(Garden).filter(Garden.id == garden_id).first()
    if not garden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="菜地不存在"
        )

    # 2. 验证用户权限（是否是我的菜地）
    user_id = current_user.id
    active_order = db.query(Order).filter(
        Order.user_id == user_id,
        Order.garden_id == garden_id,
        Order.status.in_([OrderStatus.PAID, OrderStatus.ACTIVE]),
        Order.end_date >= date.today()
    ).first()

    if not active_order:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您没有权限查看此菜地的详细状态"
        )

    # 3. 获取种植记录
    from app.models.crop import PlantingRecord
    planting_records = db.query(PlantingRecord).filter(
        PlantingRecord.garden_id == garden_id,
        PlantingRecord.user_id == user_id,
        PlantingRecord.status == 'growing'
    ).all()

    planting_info = []
    for record in planting_records:
        crop = db.query(Crop).filter(Crop.id == record.crop_id).first()
        if crop:
            # 处理日期类型（可能是date或datetime）
            planting_date = record.planting_date.date() if hasattr(record.planting_date, 'date') else record.planting_date
            expected_harvest = record.expected_harvest_date.date() if hasattr(record.expected_harvest_date, 'date') else record.expected_harvest_date

            days_since_planting = (date.today() - planting_date).days if planting_date else 0
            days_to_harvest = (expected_harvest - date.today()).days if expected_harvest else 0

            planting_info.append({
                'id': record.id,
                'crop_name': crop.name,
                'crop_category': crop.category if hasattr(crop, 'category') else None,
                'planting_date': planting_date.isoformat() if planting_date else None,
                'expected_harvest_date': expected_harvest.isoformat() if expected_harvest else None,
                'current_stage': record.current_stage,
                'current_stage_day': record.current_stage_day,
                'days_since_planting': days_since_planting,
                'days_to_harvest': max(0, days_to_harvest),
                'quantity': record.quantity,
                'area': float(record.area) if record.area else 0,
                'growth_progress': min(100, int((days_since_planting / getattr(crop, 'growth_cycle', 90)) * 100)) if days_since_planting and getattr(crop, 'growth_cycle', 90) else 0
            })

    # 4. 获取物联网传感器数据
    try:
        iot_status = IoTService.get_current_status(db, garden_id)
    except Exception as e:
        # IoT服务异常时返回空数据
        iot_status = None

    # 5. 获取智能提醒统计
    from app.models.crop import SmartReminder
    pending_reminders = db.query(SmartReminder).filter(
        SmartReminder.user_id == user_id,
        SmartReminder.garden_id == garden_id,
        SmartReminder.status == 'pending'
    ).count()

    # 6. 环境健康评分
    environment_score = 100
    environment_alerts = []

    if iot_status and 'sensors' in iot_status:
        for sensor in iot_status['sensors']:
            if sensor.get('is_abnormal'):
                environment_score -= 20
                environment_alerts.append({
                    'type': sensor['sensor_type'],
                    'message': sensor.get('abnormal_reason', '数据异常'),
                    'severity': 'high' if environment_score < 60 else 'medium'
                })

    environment_score = max(0, min(100, environment_score))

    # 7. 组装返回数据
    garden_info = {
        'id': garden.id,
        'name': garden.name,
        'area': float(garden.area),
        'location': garden.location,
        'description': garden.description,
        'images': garden.images,
        'status': garden.status.value,
        'video_stream_url': garden.video_stream_url
    }
    # 确保有视频URL
    garden_info = _ensure_video_url(garden_info)

    return {
        'garden': garden_info,
        'rental_info': {
            'order_id': active_order.id,
            'start_date': active_order.start_date.isoformat(),
            'end_date': active_order.end_date.isoformat(),
            'remaining_days': (active_order.end_date - date.today()).days,
            'status': active_order.status.value
        },
        'planting': {
            'total_crops': len(planting_info),
            'records': planting_info
        },
        'environment': {
            'health_score': environment_score,
            'status': 'excellent' if environment_score >= 90 else 'good' if environment_score >= 70 else 'warning' if environment_score >= 50 else 'critical',
            'alerts': environment_alerts,
            'iot_data': iot_status
        },
        'reminders': {
            'pending_count': pending_reminders
        }
    }


# 统一的视频流URL配置
UNIFIED_VIDEO_STREAM_URL = "https://sf1-hscdn-tos.pstatp.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8"


def _ensure_video_url(garden_dict: dict) -> dict:
    """
    确保菜地有视频流URL
    如果没有或是示例URL，则使用统一的视频源
    """
    if not garden_dict.get('video_stream_url') or 'example.com' in str(garden_dict.get('video_stream_url', '')):
        garden_dict['video_stream_url'] = UNIFIED_VIDEO_STREAM_URL
    return garden_dict


@router.post("/planting-records", summary="创建种植记录")
async def create_planting_record(
    request_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    为菜地创建种植记录
    """
    from app.models.crop import PlantingRecord, Crop, GrowthStage
    from datetime import datetime, timedelta

    # 从请求体获取参数
    garden_id = request_data.get('garden_id')
    crop_id = request_data.get('crop_id')
    planting_date = request_data.get('planting_date')
    quantity = request_data.get('quantity', 1)
    area = request_data.get('area', 0)
    notes = request_data.get('notes', '')

    # 参数验证
    if not garden_id:
        raise HTTPException(status_code=400, detail="缺少必需参数: garden_id")
    if not crop_id:
        raise HTTPException(status_code=400, detail="缺少必需参数: crop_id")
    if not planting_date:
        raise HTTPException(status_code=400, detail="缺少必需参数: planting_date")

    # 验证菜地是否存在
    garden = db.query(Garden).filter(Garden.id == garden_id).first()
    if not garden:
        raise HTTPException(status_code=404, detail="菜地不存在")

    # 验证用户是否有该菜地的租赁权限
    active_order = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.garden_id == garden_id,
        Order.status.in_([OrderStatus.PAID, OrderStatus.ACTIVE]),
        Order.end_date >= date.today()
    ).first()

    if not active_order:
        raise HTTPException(status_code=403, detail="您没有该菜地的租赁权限")

    # 验证作物是否存在
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="作物不存在")

    # 解析种植日期
    try:
        planting_datetime = datetime.strptime(planting_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="日期格式错误，应为 YYYY-MM-DD")

    # 计算预计收获日期
    expected_harvest_date = planting_datetime + timedelta(days=crop.total_growth_days)

    # 创建种植记录
    planting_record = PlantingRecord(
        garden_id=garden_id,
        crop_id=crop_id,
        user_id=current_user.id,
        planting_date=planting_datetime,
        expected_harvest_date=expected_harvest_date,
        current_stage=GrowthStage.SEED.value,
        current_stage_day=1,
        quantity=quantity,
        area=area,
        status="growing",
        notes=notes
    )

    db.add(planting_record)
    db.commit()
    db.refresh(planting_record)

    return {
        "message": "种植记录创建成功",
        "planting_record": {
            "id": planting_record.id,
            "crop_name": crop.name,
            "planting_date": planting_record.planting_date.isoformat(),
            "expected_harvest_date": planting_record.expected_harvest_date.isoformat(),
            "quantity": planting_record.quantity,
            "area": planting_record.area
        }
    }
