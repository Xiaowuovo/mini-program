"""
物联网数据服务
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.models.crop import IoTSensor, IoTReading, PlantingRecord, Crop, CropGrowthStage


class IoTService:
    """物联网数据处理服务"""

    @staticmethod
    def create_sensor(
        db: Session,
        garden_id: int,
        sensor_type: str,
        device_id: str,
        location: str = None
    ) -> IoTSensor:
        """创建传感器"""
        sensor = IoTSensor(
            garden_id=garden_id,
            sensor_type=sensor_type,
            device_id=device_id,
            location=location
        )
        db.add(sensor)
        db.commit()
        db.refresh(sensor)
        return sensor

    @staticmethod
    def record_reading(
        db: Session,
        sensor_id: int,
        value: float,
        unit: str = None
    ) -> IoTReading:
        """记录传感器读数"""
        # 获取传感器信息
        sensor = db.query(IoTSensor).filter(IoTSensor.id == sensor_id).first()
        if not sensor:
            raise ValueError("传感器不存在")

        # 检查是否异常
        is_abnormal, abnormal_reason = IoTService._check_abnormal(
            db, sensor.garden_id, sensor.sensor_type, value
        )

        # 创建读数记录
        reading = IoTReading(
            sensor_id=sensor_id,
            value=value,
            unit=unit,
            is_abnormal=1 if is_abnormal else 0,
            abnormal_reason=abnormal_reason
        )
        db.add(reading)

        # 更新传感器最后读数时间
        sensor.last_reading_time = datetime.now()

        db.commit()
        db.refresh(reading)
        return reading

    @staticmethod
    def _check_abnormal(
        db: Session,
        garden_id: int,
        sensor_type: str,
        value: float
    ) -> tuple:
        """检查读数是否异常"""
        # 获取该菜地的种植记录
        planting_records = db.query(PlantingRecord).filter(
            and_(
                PlantingRecord.garden_id == garden_id,
                PlantingRecord.status == "growing"
            )
        ).all()

        if not planting_records:
            return False, None

        # 获取作物的环境需求
        for record in planting_records:
            crop = db.query(Crop).filter(Crop.id == record.crop_id).first()
            if not crop or not crop.environment_requirements:
                continue

            requirements = crop.environment_requirements

            # 根据传感器类型检查
            if sensor_type == "temperature":
                if "temperature" in requirements:
                    temp_req = requirements["temperature"]
                    if value < temp_req.get("min", -100):
                        return True, f"温度过低，低于{temp_req['min']}°C"
                    if value > temp_req.get("max", 100):
                        return True, f"温度过高，高于{temp_req['max']}°C"

            elif sensor_type == "humidity":
                if "humidity" in requirements:
                    hum_req = requirements["humidity"]
                    if value < hum_req.get("min", 0):
                        return True, f"湿度过低，低于{hum_req['min']}%"
                    if value > hum_req.get("max", 100):
                        return True, f"湿度过高，高于{hum_req['max']}%"

            elif sensor_type == "soil_moisture":
                # 土壤湿度阈值一般在20-80%
                if value < 20:
                    return True, "土壤过于干燥，需要浇水"
                if value > 80:
                    return True, "土壤过于湿润，注意排水"

            elif sensor_type == "soil_ph":
                if "soil_ph" in requirements:
                    ph_req = requirements["soil_ph"]
                    if value < ph_req.get("min", 0):
                        return True, f"土壤pH过低，低于{ph_req['min']}"
                    if value > ph_req.get("max", 14):
                        return True, f"土壤pH过高，高于{ph_req['max']}"

        return False, None

    @staticmethod
    def get_latest_readings(
        db: Session,
        garden_id: int,
        hours: int = 24
    ) -> Dict[str, List[Dict]]:
        """获取最近的传感器读数"""
        # 获取该菜地的所有传感器
        sensors = db.query(IoTSensor).filter(
            and_(
                IoTSensor.garden_id == garden_id,
                IoTSensor.is_active == 1
            )
        ).all()

        result = {}
        cutoff_time = datetime.now() - timedelta(hours=hours)

        for sensor in sensors:
            readings = db.query(IoTReading).filter(
                and_(
                    IoTReading.sensor_id == sensor.id,
                    IoTReading.reading_time >= cutoff_time
                )
            ).order_by(desc(IoTReading.reading_time)).all()

            result[sensor.sensor_type] = [
                {
                    "value": r.value,
                    "unit": r.unit,
                    "time": r.reading_time.isoformat(),
                    "is_abnormal": bool(r.is_abnormal),
                    "abnormal_reason": r.abnormal_reason
                }
                for r in readings
            ]

        return result

    @staticmethod
    def get_current_status(db: Session, garden_id: int, auto_simulate: bool = True) -> Dict:
        """
        获取菜地当前环境状态

        Args:
            db: 数据库会话
            garden_id: 菜地ID
            auto_simulate: 如果没有真实数据，是否自动生成仿真数据

        Returns:
            传感器状态字典，格式: {
                'sensors': [
                    {
                        'id': 1,
                        'sensor_type': 'temperature',
                        'current_value': 25.5,
                        'unit': '°C',
                        'is_abnormal': False,
                        'last_reading_time': '2025-12-09T10:30:00'
                    },
                    ...
                ],
                'last_update': '2025-12-09T10:30:00'
            }
        """
        sensors = db.query(IoTSensor).filter(
            and_(
                IoTSensor.garden_id == garden_id,
                IoTSensor.is_active == 1
            )
        ).all()

        # 如果没有传感器且允许自动模拟，先生成模拟数据
        if not sensors and auto_simulate:
            IoTService.simulate_readings(db, garden_id, realistic=True)
            sensors = db.query(IoTSensor).filter(
                and_(
                    IoTSensor.garden_id == garden_id,
                    IoTSensor.is_active == 1
                )
            ).all()

        sensor_list = []
        latest_time = None

        for sensor in sensors:
            # 获取最新读数
            latest = db.query(IoTReading).filter(
                IoTReading.sensor_id == sensor.id
            ).order_by(desc(IoTReading.reading_time)).first()

            # 如果传感器没有读数且允许自动模拟，生成一条
            if not latest and auto_simulate:
                value = IoTService._generate_realistic_value(sensor.sensor_type, garden_id)
                unit = IoTService._get_sensor_unit(sensor.sensor_type)
                latest = IoTService.record_reading(db, sensor.id, round(value, 2), unit)

            if latest:
                sensor_list.append({
                    "id": sensor.id,
                    "sensor_type": sensor.sensor_type,
                    "current_value": float(latest.value),
                    "unit": latest.unit,
                    "is_abnormal": bool(latest.is_abnormal),
                    "abnormal_reason": latest.abnormal_reason,
                    "last_reading_time": latest.reading_time.isoformat()
                })

                # 记录最新的更新时间
                if not latest_time or latest.reading_time > latest_time:
                    latest_time = latest.reading_time

        return {
            "sensors": sensor_list,
            "last_update": latest_time.isoformat() if latest_time else None
        }

    @staticmethod
    def simulate_readings(db: Session, garden_id: int, realistic: bool = True) -> Dict:
        """
        模拟生成传感器读数

        Args:
            db: 数据库会话
            garden_id: 菜地ID
            realistic: 是否生成真实场景数据（考虑时间、天气等因素）

        Returns:
            模拟的传感器读数字典
        """
        import random
        from datetime import datetime

        sensor_types = ["temperature", "humidity", "soil_moisture", "light", "soil_ph"]

        # 确保传感器存在
        for sensor_type in sensor_types:
            existing = db.query(IoTSensor).filter(
                and_(
                    IoTSensor.garden_id == garden_id,
                    IoTSensor.sensor_type == sensor_type
                )
            ).first()

            if not existing:
                IoTService.create_sensor(
                    db,
                    garden_id=garden_id,
                    sensor_type=sensor_type,
                    device_id=f"{sensor_type}_{garden_id}_{random.randint(1000, 9999)}"
                )

        # 生成模拟数据
        simulated = {}
        sensors = db.query(IoTSensor).filter(
            IoTSensor.garden_id == garden_id
        ).all()

        for sensor in sensors:
            if realistic:
                # 生成符合真实场景的数据
                value = IoTService._generate_realistic_value(sensor.sensor_type, garden_id)
            else:
                # 生成随机但合理的数据
                value = IoTService._generate_random_value(sensor.sensor_type)

            unit = IoTService._get_sensor_unit(sensor.sensor_type)

            reading = IoTService.record_reading(
                db, sensor.id, round(value, 2), unit
            )

            simulated[sensor.sensor_type] = {
                "value": reading.value,
                "unit": reading.unit,
                "is_abnormal": bool(reading.is_abnormal),
                "abnormal_reason": reading.abnormal_reason
            }

        return simulated

    @staticmethod
    def _generate_realistic_value(sensor_type: str, garden_id: int) -> float:
        """
        生成真实场景的传感器数值
        考虑时间、季节、天气等因素
        """
        import random
        from datetime import datetime

        now = datetime.now()
        hour = now.hour
        month = now.month

        # 基础值 + 时间波动 + 随机噪声
        if sensor_type == "temperature":
            # 温度：根据时间和季节变化
            base_temp = 20.0  # 基础温度

            # 季节因素 (冬季低，夏季高)
            if month in [12, 1, 2]:  # 冬季
                base_temp = 12.0
            elif month in [6, 7, 8]:  # 夏季
                base_temp = 28.0
            elif month in [3, 4, 5]:  # 春季
                base_temp = 18.0
            else:  # 秋季
                base_temp = 20.0

            # 时间因素 (白天高，夜晚低)
            if 6 <= hour < 10:  # 早晨
                temp_offset = random.uniform(-2, 2)
            elif 10 <= hour < 16:  # 中午
                temp_offset = random.uniform(3, 8)
            elif 16 <= hour < 20:  # 傍晚
                temp_offset = random.uniform(0, 4)
            else:  # 夜晚
                temp_offset = random.uniform(-5, -1)

            value = base_temp + temp_offset + random.uniform(-1, 1)
            return max(5, min(40, value))  # 限制在5-40°C

        elif sensor_type == "humidity":
            # 湿度：与温度反相关
            base_humidity = 60.0

            # 时间因素 (早晨和夜晚湿度高)
            if 5 <= hour < 9:  # 早晨有露水
                humidity_offset = random.uniform(10, 20)
            elif 11 <= hour < 16:  # 中午较干燥
                humidity_offset = random.uniform(-15, -5)
            elif 20 <= hour or hour < 5:  # 夜晚湿度高
                humidity_offset = random.uniform(5, 15)
            else:
                humidity_offset = random.uniform(-5, 5)

            value = base_humidity + humidity_offset + random.uniform(-3, 3)
            return max(30, min(95, value))  # 限制在30-95%

        elif sensor_type == "soil_moisture":
            # 土壤湿度：相对稳定，但会缓慢下降
            # 模拟浇水后的湿度变化
            base_moisture = 55.0

            # 根据菜地ID生成不同的湿度状态（模拟不同浇水时间）
            garden_offset = (garden_id * 7) % 30 - 15  # -15到+15的偏移

            # 时间因素 (白天蒸发快，湿度下降)
            if 10 <= hour < 18:
                moisture_offset = random.uniform(-10, -3)
            else:
                moisture_offset = random.uniform(-3, 3)

            value = base_moisture + garden_offset + moisture_offset + random.uniform(-2, 2)
            return max(15, min(85, value))  # 限制在15-85%

        elif sensor_type == "light":
            # 光照：根据时间变化显著
            if 6 <= hour < 8:  # 清晨
                value = random.uniform(500, 2000)
            elif 8 <= hour < 11:  # 上午
                value = random.uniform(3000, 6000)
            elif 11 <= hour < 15:  # 中午
                value = random.uniform(6000, 10000)
            elif 15 <= hour < 18:  # 下午
                value = random.uniform(3000, 7000)
            elif 18 <= hour < 20:  # 傍晚
                value = random.uniform(500, 2000)
            else:  # 夜晚
                value = random.uniform(0, 100)

            # 添加云层影响
            if random.random() < 0.2:  # 20%概率有云
                value *= random.uniform(0.3, 0.7)

            return max(0, value)

        elif sensor_type == "soil_ph":
            # pH值：相对稳定
            base_ph = 6.5
            value = base_ph + random.uniform(-0.3, 0.3)
            return max(5.5, min(8.0, value))

        else:
            return random.uniform(0, 100)

    @staticmethod
    def _generate_random_value(sensor_type: str) -> float:
        """生成随机但合理的传感器数值"""
        import random

        if sensor_type == "temperature":
            return random.uniform(15, 30)
        elif sensor_type == "humidity":
            return random.uniform(50, 80)
        elif sensor_type == "soil_moisture":
            return random.uniform(30, 70)
        elif sensor_type == "light":
            return random.uniform(3000, 8000)
        elif sensor_type == "soil_ph":
            return random.uniform(6.0, 7.5)
        else:
            return random.uniform(0, 100)

    @staticmethod
    def _get_sensor_unit(sensor_type: str) -> str:
        """获取传感器单位"""
        units = {
            "temperature": "°C",
            "humidity": "%",
            "soil_moisture": "%",
            "light": "lux",
            "soil_ph": "pH"
        }
        return units.get(sensor_type, "")
