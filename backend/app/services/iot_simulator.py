"""
物联网数据仿真器
持续生成真实场景的传感器数据
"""
from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from app.services.iot_service import IoTService
from app.models.garden import Garden
import logging

logger = logging.getLogger(__name__)


class IoTSimulator:
    """物联网数据仿真器"""

    @staticmethod
    def generate_historical_data(
        db: Session,
        garden_id: int,
        days: int = 7,
        interval_minutes: int = 30
    ) -> Dict:
        """
        为指定菜地生成历史数据

        Args:
            db: 数据库会话
            garden_id: 菜地ID
            days: 生成多少天的历史数据
            interval_minutes: 数据采集间隔（分钟）

        Returns:
            生成的数据统计
        """
        from app.models.crop import IoTSensor, IoTReading

        logger.info(f"开始为菜地 {garden_id} 生成 {days} 天的历史数据")

        # 确保传感器存在
        sensor_types = ["temperature", "humidity", "soil_moisture", "light", "soil_ph"]
        sensors = []

        for sensor_type in sensor_types:
            sensor = db.query(IoTSensor).filter(
                IoTSensor.garden_id == garden_id,
                IoTSensor.sensor_type == sensor_type
            ).first()

            if not sensor:
                sensor = IoTService.create_sensor(
                    db,
                    garden_id=garden_id,
                    sensor_type=sensor_type,
                    device_id=f"{sensor_type}_{garden_id}"
                )

            sensors.append(sensor)

        # 生成历史数据点
        start_time = datetime.now() - timedelta(days=days)
        current_time = start_time
        end_time = datetime.now()

        generated_count = 0

        while current_time <= end_time:
            for sensor in sensors:
                # 根据时间生成真实数据
                value = IoTSimulator._generate_value_for_time(
                    sensor.sensor_type,
                    garden_id,
                    current_time
                )

                unit = IoTService._get_sensor_unit(sensor.sensor_type)

                # 检查异常
                is_abnormal, abnormal_reason = IoTService._check_abnormal(
                    db, garden_id, sensor.sensor_type, value
                )

                # 创建读数记录
                reading = IoTReading(
                    sensor_id=sensor.id,
                    value=round(value, 2),
                    unit=unit,
                    is_abnormal=is_abnormal,
                    abnormal_reason=abnormal_reason,
                    reading_time=current_time
                )

                db.add(reading)
                generated_count += 1

            current_time += timedelta(minutes=interval_minutes)

        db.commit()

        logger.info(f"成功生成 {generated_count} 条历史数据")

        return {
            "garden_id": garden_id,
            "total_readings": generated_count,
            "sensors": len(sensors),
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            }
        }

    @staticmethod
    def _generate_value_for_time(
        sensor_type: str,
        garden_id: int,
        target_time: datetime
    ) -> float:
        """
        为特定时间点生成传感器数值

        Args:
            sensor_type: 传感器类型
            garden_id: 菜地ID
            target_time: 目标时间

        Returns:
            传感器数值
        """
        import random
        import math

        hour = target_time.hour
        month = target_time.month
        day_of_year = target_time.timetuple().tm_yday

        if sensor_type == "temperature":
            # 温度：季节 + 昼夜周期
            # 年度季节变化 (正弦波)
            season_temp = 20 + 10 * math.sin((day_of_year - 80) * 2 * math.pi / 365)

            # 昼夜变化 (正弦波)
            daily_temp = 5 * math.sin((hour - 6) * math.pi / 12)

            # 随机噪声
            noise = random.uniform(-1.5, 1.5)

            value = season_temp + daily_temp + noise
            return max(5, min(40, value))

        elif sensor_type == "humidity":
            # 湿度：与温度反相关
            # 早晚湿度高，中午低
            base_humidity = 65
            daily_variation = -20 * math.sin((hour - 6) * math.pi / 12)
            noise = random.uniform(-5, 5)

            value = base_humidity + daily_variation + noise
            return max(30, min(95, value))

        elif sensor_type == "soil_moisture":
            # 土壤湿度：模拟浇水和蒸发
            # 假设每天早上8点浇水
            hours_since_watering = (hour - 8) % 24

            # 浇水后的湿度曲线 (指数衰减)
            if hours_since_watering >= 0:
                moisture_loss = 25 * (1 - math.exp(-hours_since_watering / 12))
            else:
                moisture_loss = 25 * (1 - math.exp((24 + hours_since_watering) / 12))

            base_moisture = 70 - moisture_loss
            noise = random.uniform(-3, 3)

            value = base_moisture + noise
            return max(15, min(85, value))

        elif sensor_type == "light":
            # 光照：严格遵循昼夜规律
            if 6 <= hour < 20:
                # 白天：正弦波模拟太阳轨迹
                peak_hour = 13  # 下午1点光照最强
                light_intensity = 8000 * math.sin((hour - 6) * math.pi / 14)

                # 云层影响 (20%概率)
                if random.random() < 0.2:
                    light_intensity *= random.uniform(0.4, 0.8)

                noise = random.uniform(-500, 500)
                value = light_intensity + noise
            else:
                # 夜晚
                value = random.uniform(0, 50)

            return max(0, value)

        elif sensor_type == "soil_ph":
            # pH值：相对稳定，长期缓慢变化
            base_ph = 6.5

            # 长期趋势 (每月变化)
            trend = 0.1 * math.sin(month * math.pi / 12)

            noise = random.uniform(-0.2, 0.2)

            value = base_ph + trend + noise
            return max(5.5, min(8.0, value))

        else:
            return random.uniform(0, 100)

    @staticmethod
    def update_all_gardens(db: Session) -> List[Dict]:
        """
        为所有菜地更新当前传感器数据

        Returns:
            每个菜地的更新结果
        """
        gardens = db.query(Garden).all()
        results = []

        for garden in gardens:
            try:
                simulated = IoTService.simulate_readings(
                    db,
                    garden.id,
                    realistic=True
                )

                results.append({
                    "garden_id": garden.id,
                    "garden_name": garden.name,
                    "success": True,
                    "data": simulated
                })

                logger.info(f"已更新菜地 {garden.id} ({garden.name}) 的传感器数据")

            except Exception as e:
                logger.error(f"更新菜地 {garden.id} 数据失败: {e}")
                results.append({
                    "garden_id": garden.id,
                    "garden_name": garden.name,
                    "success": False,
                    "error": str(e)
                })

        return results

    @staticmethod
    def create_weather_event(
        db: Session,
        garden_id: int,
        event_type: str,
        duration_hours: int = 2
    ) -> Dict:
        """
        模拟天气事件（如下雨、高温等）

        Args:
            db: 数据库会话
            garden_id: 菜地ID
            event_type: 事件类型 ('rain', 'heat_wave', 'cold', 'drought')
            duration_hours: 持续时间（小时）

        Returns:
            事件影响统计
        """
        from app.models.crop import IoTSensor
        import random

        logger.info(f"为菜地 {garden_id} 创建天气事件: {event_type}, 持续 {duration_hours} 小时")

        sensors = db.query(IoTSensor).filter(
            IoTSensor.garden_id == garden_id
        ).all()

        affected_sensors = []

        for sensor in sensors:
            value = None

            if event_type == "rain":
                # 下雨：土壤湿度增加，光照降低
                if sensor.sensor_type == "soil_moisture":
                    value = random.uniform(75, 90)
                elif sensor.sensor_type == "light":
                    value = random.uniform(500, 2000)
                elif sensor.sensor_type == "humidity":
                    value = random.uniform(85, 95)

            elif event_type == "heat_wave":
                # 高温：温度升高，湿度降低
                if sensor.sensor_type == "temperature":
                    value = random.uniform(35, 42)
                elif sensor.sensor_type == "humidity":
                    value = random.uniform(25, 40)
                elif sensor.sensor_type == "soil_moisture":
                    value = random.uniform(15, 30)

            elif event_type == "cold":
                # 低温
                if sensor.sensor_type == "temperature":
                    value = random.uniform(0, 8)
                elif sensor.sensor_type == "humidity":
                    value = random.uniform(70, 85)

            elif event_type == "drought":
                # 干旱：土壤湿度低，湿度低
                if sensor.sensor_type == "soil_moisture":
                    value = random.uniform(10, 20)
                elif sensor.sensor_type == "humidity":
                    value = random.uniform(30, 45)

            if value is not None:
                unit = IoTService._get_sensor_unit(sensor.sensor_type)
                reading = IoTService.record_reading(
                    db,
                    sensor.id,
                    round(value, 2),
                    unit
                )

                affected_sensors.append({
                    "sensor_type": sensor.sensor_type,
                    "value": reading.value,
                    "is_abnormal": bool(reading.is_abnormal)
                })

        return {
            "garden_id": garden_id,
            "event_type": event_type,
            "duration_hours": duration_hours,
            "affected_sensors": affected_sensors
        }
