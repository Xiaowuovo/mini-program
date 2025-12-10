"""
智能提醒算法引擎
基于作物生长规则和物联网数据生成智能提醒
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.crop import (
    PlantingRecord, Crop, CropGrowthStage, SmartReminder,
    IoTReading, IoTSensor, GrowthStage
)
from app.services.iot_service import IoTService


class SmartReminderEngine:
    """智能提醒引擎"""

    @staticmethod
    def generate_reminders(db: Session, user_id: int = None) -> List[SmartReminder]:
        """
        生成智能提醒
        综合考虑：
        1. 作物生长规则
        2. 物联网传感器数据
        3. 历史记录
        """
        reminders = []

        # 获取所有进行中的种植记录
        query = db.query(PlantingRecord).filter(
            PlantingRecord.status == "growing"
        )
        if user_id:
            query = query.filter(PlantingRecord.user_id == user_id)

        planting_records = query.all()

        for record in planting_records:
            # 1. 基于生长规则的提醒
            rule_reminders = SmartReminderEngine._generate_rule_based_reminders(
                db, record
            )
            reminders.extend(rule_reminders)

            # 2. 基于物联网数据的提醒
            iot_reminders = SmartReminderEngine._generate_iot_based_reminders(
                db, record
            )
            reminders.extend(iot_reminders)

            # 3. 收获提醒
            harvest_reminder = SmartReminderEngine._check_harvest_time(
                db, record
            )
            if harvest_reminder:
                reminders.append(harvest_reminder)

        # 保存提醒到数据库（去重）
        for reminder in reminders:
            SmartReminderEngine._save_reminder(db, reminder)

        return reminders

    @staticmethod
    def _generate_rule_based_reminders(
        db: Session,
        record: PlantingRecord
    ) -> List[SmartReminder]:
        """基于作物生长规则生成提醒"""
        reminders = []

        # 获取作物信息
        crop = db.query(Crop).filter(Crop.id == record.crop_id).first()
        if not crop:
            return reminders

        # 获取当前生长阶段的规则
        stage_rule = db.query(CropGrowthStage).filter(
            and_(
                CropGrowthStage.crop_id == record.crop_id,
                CropGrowthStage.stage == record.current_stage
            )
        ).first()

        if not stage_rule:
            return reminders

        now = datetime.now()

        # 浇水提醒
        if stage_rule.watering_frequency:
            last_watering = SmartReminderEngine._get_last_completion_time(
                db, record.id, "watering"
            )
            days_since = (now - last_watering).days if last_watering else stage_rule.watering_frequency + 1

            if days_since >= stage_rule.watering_frequency:
                reminders.append(SmartReminder(
                    user_id=record.user_id,
                    garden_id=record.garden_id,
                    planting_record_id=record.id,
                    reminder_type="watering",
                    title=f"该给{crop.name}浇水了",
                    description=f"建议浇水量：{stage_rule.watering_amount}升",
                    remind_time=now,
                    priority=4,
                    source="rule_based",
                    extra_data={
                        "crop_name": crop.name,
                        "growth_stage": record.current_stage,
                        "watering_amount": stage_rule.watering_amount,
                        "frequency": stage_rule.watering_frequency
                    }
                ))

        # 施肥提醒
        if stage_rule.fertilizing_frequency:
            last_fertilizing = SmartReminderEngine._get_last_completion_time(
                db, record.id, "fertilizing"
            )
            days_since = (now - last_fertilizing).days if last_fertilizing else stage_rule.fertilizing_frequency + 1

            if days_since >= stage_rule.fertilizing_frequency:
                reminders.append(SmartReminder(
                    user_id=record.user_id,
                    garden_id=record.garden_id,
                    planting_record_id=record.id,
                    reminder_type="fertilizing",
                    title=f"该给{crop.name}施肥了",
                    description=f"推荐肥料：{stage_rule.fertilizer_type}",
                    remind_time=now,
                    priority=3,
                    source="rule_based",
                    extra_data={
                        "crop_name": crop.name,
                        "growth_stage": record.current_stage,
                        "fertilizer_type": stage_rule.fertilizer_type,
                        "frequency": stage_rule.fertilizing_frequency
                    }
                ))

        # 除草提醒
        if stage_rule.weeding_frequency:
            last_weeding = SmartReminderEngine._get_last_completion_time(
                db, record.id, "weeding"
            )
            days_since = (now - last_weeding).days if last_weeding else stage_rule.weeding_frequency + 1

            if days_since >= stage_rule.weeding_frequency:
                reminders.append(SmartReminder(
                    user_id=record.user_id,
                    garden_id=record.garden_id,
                    planting_record_id=record.id,
                    reminder_type="weeding",
                    title=f"{crop.name}需要除草",
                    description="及时清除杂草，避免与作物争夺养分",
                    remind_time=now,
                    priority=2,
                    source="rule_based",
                    extra_data={
                        "crop_name": crop.name,
                        "growth_stage": record.current_stage,
                        "frequency": stage_rule.weeding_frequency
                    }
                ))

        # 病虫害检查提醒
        if stage_rule.pest_check_frequency:
            last_check = SmartReminderEngine._get_last_completion_time(
                db, record.id, "pest_check"
            )
            days_since = (now - last_check).days if last_check else stage_rule.pest_check_frequency + 1

            if days_since >= stage_rule.pest_check_frequency:
                pest_info = ", ".join(crop.common_pests) if crop.common_pests else "常见病虫害"
                reminders.append(SmartReminder(
                    user_id=record.user_id,
                    garden_id=record.garden_id,
                    planting_record_id=record.id,
                    reminder_type="pest_check",
                    title=f"检查{crop.name}的病虫害",
                    description=f"注意观察：{pest_info}",
                    remind_time=now,
                    priority=3,
                    source="rule_based",
                    extra_data={
                        "crop_name": crop.name,
                        "growth_stage": record.current_stage,
                        "common_pests": crop.common_pests
                    }
                ))

        return reminders

    @staticmethod
    def _generate_iot_based_reminders(
        db: Session,
        record: PlantingRecord
    ) -> List[SmartReminder]:
        """基于物联网数据生成提醒"""
        reminders = []

        crop = db.query(Crop).filter(Crop.id == record.crop_id).first()
        if not crop or not crop.environment_requirements:
            return reminders

        # 获取最新的传感器读数
        sensors = db.query(IoTSensor).filter(
            and_(
                IoTSensor.garden_id == record.garden_id,
                IoTSensor.is_active == 1
            )
        ).all()

        now = datetime.now()
        requirements = crop.environment_requirements

        for sensor in sensors:
            # 获取最新读数
            latest_reading = db.query(IoTReading).filter(
                IoTReading.sensor_id == sensor.id
            ).order_by(IoTReading.reading_time.desc()).first()

            if not latest_reading:
                continue

            # 如果读数已经标记为异常，生成提醒
            if latest_reading.is_abnormal:
                # 检查是否已有类似提醒（避免重复）
                existing = db.query(SmartReminder).filter(
                    and_(
                        SmartReminder.user_id == record.user_id,
                        SmartReminder.garden_id == record.garden_id,
                        SmartReminder.reminder_type == "environment_alert",
                        SmartReminder.status == "pending",
                        SmartReminder.created_at >= now - timedelta(hours=1)
                    )
                ).first()

                if not existing:
                    priority = 5 if sensor.sensor_type in ["temperature", "soil_moisture"] else 4

                    reminders.append(SmartReminder(
                        user_id=record.user_id,
                        garden_id=record.garden_id,
                        planting_record_id=record.id,
                        reminder_type="environment_alert",
                        title=f"{crop.name}环境异常警告",
                        description=latest_reading.abnormal_reason,
                        remind_time=now,
                        priority=priority,
                        source="iot_triggered",
                        extra_data={
                            "crop_name": crop.name,
                            "sensor_type": sensor.sensor_type,
                            "value": latest_reading.value,
                            "unit": latest_reading.unit,
                            "abnormal_reason": latest_reading.abnormal_reason
                        }
                    ))

        return reminders

    @staticmethod
    def _check_harvest_time(
        db: Session,
        record: PlantingRecord
    ) -> Optional[SmartReminder]:
        """检查是否到收获时间"""
        if not record.expected_harvest_date:
            return None

        now = datetime.now()
        days_until_harvest = (record.expected_harvest_date - now).days

        # 提前3天提醒
        if 0 <= days_until_harvest <= 3:
            crop = db.query(Crop).filter(Crop.id == record.crop_id).first()

            # 检查是否已有收获提醒
            existing = db.query(SmartReminder).filter(
                and_(
                    SmartReminder.planting_record_id == record.id,
                    SmartReminder.reminder_type == "harvest",
                    SmartReminder.status == "pending"
                )
            ).first()

            if not existing:
                return SmartReminder(
                    user_id=record.user_id,
                    garden_id=record.garden_id,
                    planting_record_id=record.id,
                    reminder_type="harvest",
                    title=f"{crop.name}即将可以收获",
                    description=f"预计{days_until_harvest}天后可以收获，请做好准备",
                    remind_time=now,
                    priority=5,
                    source="rule_based",
                    extra_data={
                        "crop_name": crop.name,
                        "expected_harvest_date": record.expected_harvest_date.isoformat(),
                        "days_until_harvest": days_until_harvest
                    }
                )

        return None

    @staticmethod
    def _get_last_completion_time(
        db: Session,
        planting_record_id: int,
        reminder_type: str
    ) -> Optional[datetime]:
        """获取某类任务的最后完成时间"""
        last_reminder = db.query(SmartReminder).filter(
            and_(
                SmartReminder.planting_record_id == planting_record_id,
                SmartReminder.reminder_type == reminder_type,
                SmartReminder.status == "completed"
            )
        ).order_by(SmartReminder.completed_at.desc()).first()

        return last_reminder.completed_at if last_reminder else None

    @staticmethod
    def _save_reminder(db: Session, reminder: SmartReminder) -> SmartReminder:
        """保存提醒（去重）"""
        # 检查是否已存在相同的提醒
        existing = db.query(SmartReminder).filter(
            and_(
                SmartReminder.user_id == reminder.user_id,
                SmartReminder.planting_record_id == reminder.planting_record_id,
                SmartReminder.reminder_type == reminder.reminder_type,
                SmartReminder.status == "pending",
                SmartReminder.created_at >= datetime.now() - timedelta(hours=6)
            )
        ).first()

        if existing:
            return existing

        db.add(reminder)
        db.commit()
        db.refresh(reminder)
        return reminder

    @staticmethod
    def complete_reminder(db: Session, reminder_id: int, user_id: int) -> bool:
        """完成提醒"""
        reminder = db.query(SmartReminder).filter(
            and_(
                SmartReminder.id == reminder_id,
                SmartReminder.user_id == user_id
            )
        ).first()

        if not reminder:
            return False

        reminder.status = "completed"
        reminder.completed_at = datetime.now()
        db.commit()
        return True

    @staticmethod
    def update_growth_stage(db: Session, planting_record_id: int) -> bool:
        """更新作物生长阶段"""
        record = db.query(PlantingRecord).filter(
            PlantingRecord.id == planting_record_id
        ).first()

        if not record or not record.planting_date:
            return False

        # 获取所有生长阶段
        stages = db.query(CropGrowthStage).filter(
            CropGrowthStage.crop_id == record.crop_id
        ).order_by(CropGrowthStage.id).all()

        if not stages:
            return False

        # 计算种植天数
        days_since_planting = (datetime.now() - record.planting_date).days

        # 确定当前阶段
        accumulated_days = 0
        for stage in stages:
            accumulated_days += stage.stage_days
            if days_since_planting < accumulated_days:
                # 更新阶段
                if record.current_stage != stage.stage:
                    record.current_stage = stage.stage
                    record.current_stage_day = days_since_planting - (accumulated_days - stage.stage_days) + 1
                    db.commit()
                return True

        # 已超过所有阶段，应该收获了
        record.current_stage = GrowthStage.HARVEST
        db.commit()
        return True
