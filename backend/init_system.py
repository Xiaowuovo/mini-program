"""
系统初始化脚本
初始化作物数据、传感器等基础数据
"""
import sys
import os

# 添加项目路径到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.services.crop_initializer import CropInitializer
from app.services.iot_simulator import IoTSimulator
from app.models import crop, garden, user, order, reminder, service, post, comment, like
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def init_database():
    """初始化数据库表"""
    logger.info("开始初始化数据库表...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ 数据库表创建成功")
        return True
    except Exception as e:
        logger.error(f"✗ 数据库表创建失败: {e}")
        return False


def init_crops():
    """初始化作物数据"""
    logger.info("开始初始化作物数据...")
    db = SessionLocal()
    try:
        result = CropInitializer.initialize_crops(db)
        logger.info(f"✓ {result['message']}")
        return True
    except Exception as e:
        logger.error(f"✗ 作物数据初始化失败: {e}")
        return False
    finally:
        db.close()


def init_iot_sensors():
    """为所有菜地初始化物联网传感器"""
    logger.info("开始初始化物联网传感器...")
    db = SessionLocal()
    try:
        from app.models.garden import Garden
        from app.services.iot_service import IoTService

        gardens = db.query(Garden).all()

        if not gardens:
            logger.warning("⚠ 未找到菜地数据，跳过传感器初始化")
            logger.info("  提示: 请先在系统中创建菜地")
            return True

        sensor_types = ["temperature", "humidity", "soil_moisture", "light", "soil_ph"]
        total_sensors = 0

        for garden in gardens:
            for sensor_type in sensor_types:
                # 检查是否已存在
                from app.models.crop import IoTSensor
                existing = db.query(IoTSensor).filter(
                    IoTSensor.garden_id == garden.id,
                    IoTSensor.sensor_type == sensor_type
                ).first()

                if existing:
                    continue

                # 创建传感器
                sensor = IoTService.create_sensor(
                    db,
                    garden_id=garden.id,
                    sensor_type=sensor_type,
                    device_id=f"{sensor_type}_{garden.id}_{garden.name}"
                )
                total_sensors += 1

        logger.info(f"✓ 成功为 {len(gardens)} 个菜地创建 {total_sensors} 个传感器")
        return True

    except Exception as e:
        logger.error(f"✗ 传感器初始化失败: {e}")
        return False
    finally:
        db.close()


def generate_sample_iot_data():
    """生成示例物联网数据"""
    logger.info("开始生成示例物联网数据...")
    db = SessionLocal()
    try:
        from app.models.garden import Garden

        gardens = db.query(Garden).all()

        if not gardens:
            logger.warning("⚠ 未找到菜地数据，跳过数据生成")
            return True

        logger.info(f"为 {len(gardens)} 个菜地生成历史数据（最近7天）...")

        for garden in gardens:
            result = IoTSimulator.generate_historical_data(
                db,
                garden_id=garden.id,
                days=7,
                interval_minutes=60  # 每小时一次
            )
            logger.info(f"  ✓ 菜地 {garden.name}: {result['total_readings']} 条数据")

        logger.info("✓ 示例物联网数据生成完成")
        return True

    except Exception as e:
        logger.error(f"✗ 物联网数据生成失败: {e}")
        return False
    finally:
        db.close()


def show_summary():
    """显示系统状态摘要"""
    logger.info("")
    logger.info("=" * 60)
    logger.info("系统状态摘要")
    logger.info("=" * 60)

    db = SessionLocal()
    try:
        from app.models.crop import Crop, CropGrowthStage, IoTSensor, IoTReading
        from app.models.garden import Garden

        crops_count = db.query(Crop).count()
        stages_count = db.query(CropGrowthStage).count()
        gardens_count = db.query(Garden).count()
        sensors_count = db.query(IoTSensor).count()
        readings_count = db.query(IoTReading).count()

        logger.info(f"作物种类: {crops_count}")
        logger.info(f"生长阶段规则: {stages_count}")
        logger.info(f"菜地数量: {gardens_count}")
        logger.info(f"传感器数量: {sensors_count}")
        logger.info(f"传感器读数: {readings_count}")

    except Exception as e:
        logger.error(f"获取统计数据失败: {e}")
    finally:
        db.close()

    logger.info("=" * 60)


def main():
    """主函数"""
    logger.info("=" * 60)
    logger.info("智能菜地系统初始化工具")
    logger.info("=" * 60)
    logger.info("")

    # 执行初始化步骤
    steps = [
        ("初始化数据库表", init_database),
        ("初始化作物数据", init_crops),
        ("初始化物联网传感器", init_iot_sensors),
        ("生成示例物联网数据", generate_sample_iot_data),
    ]

    success_count = 0
    for step_name, step_func in steps:
        logger.info("")
        if step_func():
            success_count += 1
        else:
            logger.error(f"步骤失败: {step_name}")

    logger.info("")
    logger.info("=" * 60)
    logger.info(f"初始化完成: {success_count}/{len(steps)} 个步骤成功")
    logger.info("=" * 60)
    logger.info("")

    # 显示摘要
    show_summary()

    # 提示下一步
    logger.info("")
    logger.info("下一步操作:")
    logger.info("  1. 启动后端服务: python -m uvicorn app.main:app --reload")
    logger.info("  2. 启动调度器: python -m app.services.scheduler")
    logger.info("")


if __name__ == "__main__":
    main()
