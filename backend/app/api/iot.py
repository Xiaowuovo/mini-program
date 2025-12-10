"""
物联网API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.iot_service import IoTService
from app.services.iot_simulator import IoTSimulator

router = APIRouter()


@router.get("/gardens/{garden_id}/status", summary="获取菜地传感器状态")
async def get_garden_iot_status(
    garden_id: int,
    auto_simulate: bool = Query(True, description="如果没有数据，是否自动生成仿真数据"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取指定菜地的物联网传感器当前状态

    - **garden_id**: 菜地ID
    - **auto_simulate**: 是否自动生成仿真数据（默认true）
    """
    try:
        status = IoTService.get_current_status(db, garden_id, auto_simulate=auto_simulate)
        return status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取传感器状态失败: {str(e)}"
        )


@router.post("/gardens/{garden_id}/simulate", summary="生成仿真数据")
async def simulate_garden_data(
    garden_id: int,
    realistic: bool = Query(True, description="是否生成真实场景数据"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    为指定菜地生成仿真传感器数据

    - **garden_id**: 菜地ID
    - **realistic**: true=真实场景数据(考虑时间/季节), false=随机数据
    """
    try:
        simulated = IoTService.simulate_readings(db, garden_id, realistic=realistic)
        return {
            "garden_id": garden_id,
            "realistic": realistic,
            "data": simulated
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成仿真数据失败: {str(e)}"
        )


@router.post("/gardens/{garden_id}/history", summary="生成历史数据")
async def generate_historical_data(
    garden_id: int,
    days: int = Query(7, ge=1, le=30, description="生成多少天的历史数据"),
    interval_minutes: int = Query(30, ge=5, le=120, description="数据采集间隔（分钟）"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    为指定菜地生成历史传感器数据

    - **garden_id**: 菜地ID
    - **days**: 生成天数 (1-30天)
    - **interval_minutes**: 采集间隔 (5-120分钟)

    用于测试和演示，生成真实场景的历史数据曲线
    """
    try:
        result = IoTSimulator.generate_historical_data(
            db,
            garden_id,
            days=days,
            interval_minutes=interval_minutes
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成历史数据失败: {str(e)}"
        )


@router.post("/gardens/{garden_id}/weather-event", summary="模拟天气事件")
async def create_weather_event(
    garden_id: int,
    event_type: str = Query(..., regex="^(rain|heat_wave|cold|drought)$"),
    duration_hours: int = Query(2, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    为指定菜地模拟天气事件

    - **garden_id**: 菜地ID
    - **event_type**: 事件类型
      - `rain`: 下雨（土壤湿度↑，光照↓）
      - `heat_wave`: 高温（温度↑，湿度↓）
      - `cold`: 低温（温度↓）
      - `drought`: 干旱（土壤湿度↓，湿度↓）
    - **duration_hours**: 持续时间（小时）
    """
    try:
        result = IoTSimulator.create_weather_event(
            db,
            garden_id,
            event_type,
            duration_hours
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建天气事件失败: {str(e)}"
        )


@router.post("/update-all", summary="更新所有菜地数据")
async def update_all_gardens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    为所有菜地更新当前传感器数据

    用于批量更新所有菜地的物联网数据
    """
    try:
        results = IoTSimulator.update_all_gardens(db)

        success_count = sum(1 for r in results if r['success'])
        fail_count = len(results) - success_count

        return {
            "total": len(results),
            "success": success_count,
            "failed": fail_count,
            "results": results
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新数据失败: {str(e)}"
        )


@router.get("/sensors/history", summary="获取传感器历史数据")
async def get_sensor_history(
    garden_id: int = Query(..., description="菜地ID"),
    sensor_type: Optional[str] = Query(None, description="传感器类型（可选）"),
    hours: int = Query(24, ge=1, le=168, description="查询最近多少小时的数据"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取传感器历史数据

    - **garden_id**: 菜地ID
    - **sensor_type**: 传感器类型（可选，不指定则返回所有类型）
    - **hours**: 查询时间范围（1-168小时，即最多7天）
    """
    from app.models.crop import IoTSensor, IoTReading
    from datetime import datetime, timedelta

    try:
        # 查询传感器
        query = db.query(IoTSensor).filter(IoTSensor.garden_id == garden_id)
        if sensor_type:
            query = query.filter(IoTSensor.sensor_type == sensor_type)

        sensors = query.all()

        if not sensors:
            return {
                "garden_id": garden_id,
                "sensor_type": sensor_type,
                "data": []
            }

        # 查询历史数据
        start_time = datetime.now() - timedelta(hours=hours)
        history_data = []

        for sensor in sensors:
            readings = db.query(IoTReading).filter(
                IoTReading.sensor_id == sensor.id,
                IoTReading.reading_time >= start_time
            ).order_by(IoTReading.reading_time).all()

            history_data.append({
                "sensor_type": sensor.sensor_type,
                "device_id": sensor.device_id,
                "readings": [
                    {
                        "time": r.reading_time.isoformat(),
                        "value": float(r.value),
                        "unit": r.unit,
                        "is_abnormal": bool(r.is_abnormal)
                    }
                    for r in readings
                ]
            })

        return {
            "garden_id": garden_id,
            "sensor_type": sensor_type,
            "time_range": {
                "start": start_time.isoformat(),
                "end": datetime.now().isoformat(),
                "hours": hours
            },
            "data": history_data
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"查询历史数据失败: {str(e)}"
        )
