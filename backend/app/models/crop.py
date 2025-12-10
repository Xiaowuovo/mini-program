"""
作物生长规则模型
"""
from sqlalchemy import Column, Integer, String, Float, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class CropType(str, enum.Enum):
    """作物类型"""
    VEGETABLE = "vegetable"  # 蔬菜
    FRUIT = "fruit"  # 水果
    HERB = "herb"  # 香草
    GRAIN = "grain"  # 粮食


class GrowthStage(str, enum.Enum):
    """生长阶段"""
    SEED = "seed"  # 播种期
    SEEDLING = "seedling"  # 苗期
    GROWTH = "growth"  # 生长期
    FLOWERING = "flowering"  # 开花期
    FRUITING = "fruiting"  # 结果期
    HARVEST = "harvest"  # 收获期


class Crop(Base):
    """作物基础信息表"""
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="作物名称")
    scientific_name = Column(String(200), comment="学名")
    type = Column(String(20), nullable=False, comment="作物类型")

    # 生长周期（天）
    total_growth_days = Column(Integer, comment="总生长周期")

    # 环境需求（JSON格式）
    # 示例: {
    #   "temperature": {"min": 15, "max": 25, "optimal": 20},
    #   "humidity": {"min": 60, "max": 80, "optimal": 70},
    #   "light_hours": {"min": 6, "max": 8, "optimal": 7},
    #   "soil_ph": {"min": 6.0, "max": 7.5, "optimal": 6.5}
    # }
    environment_requirements = Column(JSON, comment="环境需求")

    # 种植难度：1-5，1最简单，5最难
    difficulty = Column(Integer, default=3, comment="种植难度")

    # 常见病虫害
    common_pests = Column(JSON, comment="常见病虫害列表")

    # 描述信息
    description = Column(String(500), comment="作物描述")
    planting_tips = Column(String(1000), comment="种植技巧")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CropGrowthStage(Base):
    """作物生长阶段详细规则表"""
    __tablename__ = "crop_growth_stages"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, nullable=False, comment="作物ID")
    stage = Column(String(20), nullable=False, comment="生长阶段")

    # 阶段天数
    stage_days = Column(Integer, comment="该阶段持续天数")

    # 浇水规则
    watering_frequency = Column(Integer, comment="浇水频率（天/次）")
    watering_amount = Column(Float, comment="单次浇水量（升）")

    # 施肥规则
    fertilizing_frequency = Column(Integer, comment="施肥频率（天/次）")
    fertilizer_type = Column(String(100), comment="肥料类型")

    # 除草规则
    weeding_frequency = Column(Integer, comment="除草频率（天/次）")

    # 病虫害预防
    pest_check_frequency = Column(Integer, comment="病虫害检查频率（天/次）")

    # 其他任务
    other_tasks = Column(JSON, comment="其他特殊任务")
    # 示例: [
    #   {"task": "修剪", "frequency": 7, "description": "修剪侧枝"},
    #   {"task": "搭架", "frequency": 0, "description": "搭建支架", "once": true}
    # ]

    # 关键提示
    stage_tips = Column(String(500), comment="该阶段关键提示")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class IoTSensor(Base):
    """物联网传感器表"""
    __tablename__ = "iot_sensors"

    id = Column(Integer, primary_key=True, index=True)
    garden_id = Column(Integer, nullable=False, comment="关联菜地ID")
    sensor_type = Column(String(50), nullable=False, comment="传感器类型")
    # 类型: temperature, humidity, soil_moisture, light, soil_ph

    device_id = Column(String(100), unique=True, comment="设备ID")
    location = Column(String(200), comment="传感器位置")

    # 状态
    is_active = Column(Integer, default=1, comment="是否激活")
    last_reading_time = Column(DateTime(timezone=True), comment="最后读数时间")

    # 配置
    reading_interval = Column(Integer, default=300, comment="读数间隔（秒）")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class IoTReading(Base):
    """物联网传感器读数表"""
    __tablename__ = "iot_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, nullable=False, index=True, comment="传感器ID")
    value = Column(Float, nullable=False, comment="读数值")
    unit = Column(String(20), comment="单位")

    # 异常标记
    is_abnormal = Column(Integer, default=0, comment="是否异常")
    abnormal_reason = Column(String(200), comment="异常原因")

    reading_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class PlantingRecord(Base):
    """种植记录表"""
    __tablename__ = "planting_records"

    id = Column(Integer, primary_key=True, index=True)
    garden_id = Column(Integer, nullable=False, comment="菜地ID")
    crop_id = Column(Integer, nullable=False, comment="作物ID")
    user_id = Column(Integer, nullable=False, comment="种植用户ID")

    # 种植信息
    planting_date = Column(DateTime(timezone=True), comment="种植日期")
    expected_harvest_date = Column(DateTime(timezone=True), comment="预计收获日期")
    actual_harvest_date = Column(DateTime(timezone=True), comment="实际收获日期")

    # 当前状态
    current_stage = Column(String(20), comment="当前生长阶段")
    current_stage_day = Column(Integer, default=1, comment="当前阶段第几天")

    # 种植数量
    quantity = Column(Integer, comment="种植数量")
    area = Column(Float, comment="占地面积（平方米）")

    # 状态
    status = Column(String(20), default="growing", comment="状态：growing/harvested/failed")

    # 备注
    notes = Column(String(500), comment="备注")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SmartReminder(Base):
    """智能提醒记录表"""
    __tablename__ = "smart_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True, comment="用户ID")
    garden_id = Column(Integer, comment="菜地ID")
    planting_record_id = Column(Integer, comment="种植记录ID")

    # 提醒类型
    reminder_type = Column(String(50), nullable=False, comment="提醒类型")
    # 类型: watering, fertilizing, weeding, pest_check, harvest, environment_alert

    # 提醒内容
    title = Column(String(200), nullable=False, comment="提醒标题")
    description = Column(String(1000), comment="提醒描述")

    # 提醒时间
    remind_time = Column(DateTime(timezone=True), nullable=False, comment="提醒时间")

    # 优先级：1-5，5最高
    priority = Column(Integer, default=3, comment="优先级")

    # 来源
    source = Column(String(50), comment="来源")
    # 来源: rule_based（规则生成）, iot_triggered（物联网触发）, manual（手动）

    # 关联数据（JSON）- 使用extra_data避免与SQLAlchemy的metadata冲突
    extra_data = Column(JSON, comment="元数据")
    # 示例: {
    #   "crop_name": "番茄",
    #   "growth_stage": "seedling",
    #   "iot_reading": {"temperature": 35, "threshold": 30}
    # }

    # 状态
    status = Column(String(20), default="pending", comment="状态")
    # 状态: pending（待处理）, completed（已完成）, ignored（已忽略）

    completed_at = Column(DateTime(timezone=True), comment="完成时间")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
