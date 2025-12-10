"""
定时任务调度器
自动执行智能提醒生成和物联网数据采集
"""
import schedule
import time
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.smart_reminder_engine import SmartReminderEngine
from app.services.iot_simulator import IoTSimulator

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class TaskScheduler:
    """任务调度器"""

    @staticmethod
    def generate_smart_reminders():
        """生成智能提醒任务"""
        logger.info("=" * 60)
        logger.info("开始执行智能提醒生成任务")

        db = SessionLocal()
        try:
            # 生成智能提醒
            reminders = SmartReminderEngine.generate_reminders(db)

            logger.info(f"成功生成 {len(reminders)} 条智能提醒")

            # 按类型统计
            type_count = {}
            for reminder in reminders:
                type_count[reminder.reminder_type] = type_count.get(reminder.reminder_type, 0) + 1

            logger.info(f"提醒类型分布: {type_count}")

        except Exception as e:
            logger.error(f"智能提醒生成失败: {e}", exc_info=True)
        finally:
            db.close()

        logger.info("智能提醒生成任务完成")
        logger.info("=" * 60)

    @staticmethod
    def update_iot_data():
        """更新物联网数据任务"""
        logger.info("=" * 60)
        logger.info("开始执行物联网数据更新任务")

        db = SessionLocal()
        try:
            # 更新所有菜地的传感器数据
            results = IoTSimulator.update_all_gardens(db)

            success_count = sum(1 for r in results if r.get("success"))
            logger.info(f"成功更新 {success_count}/{len(results)} 个菜地的传感器数据")

            # 记录失败的菜地
            for result in results:
                if not result.get("success"):
                    logger.error(f"菜地 {result['garden_id']} 更新失败: {result.get('error')}")

        except Exception as e:
            logger.error(f"物联网数据更新失败: {e}", exc_info=True)
        finally:
            db.close()

        logger.info("物联网数据更新任务完成")
        logger.info("=" * 60)

    @staticmethod
    def update_growth_stages():
        """更新作物生长阶段任务"""
        logger.info("=" * 60)
        logger.info("开始执行作物生长阶段更新任务")

        db = SessionLocal()
        try:
            from app.models.crop import PlantingRecord

            # 获取所有进行中的种植记录
            records = db.query(PlantingRecord).filter(
                PlantingRecord.status == "growing"
            ).all()

            updated_count = 0
            for record in records:
                if SmartReminderEngine.update_growth_stage(db, record.id):
                    updated_count += 1

            logger.info(f"成功更新 {updated_count}/{len(records)} 条种植记录的生长阶段")

        except Exception as e:
            logger.error(f"生长阶段更新失败: {e}", exc_info=True)
        finally:
            db.close()

        logger.info("作物生长阶段更新任务完成")
        logger.info("=" * 60)

    @staticmethod
    def daily_summary():
        """每日统计汇总"""
        logger.info("=" * 60)
        logger.info("开始执行每日统计汇总")

        db = SessionLocal()
        try:
            from app.models.crop import SmartReminder, PlantingRecord
            from sqlalchemy import func, and_
            from datetime import timedelta

            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

            # 今日生成的提醒数
            today_reminders = db.query(SmartReminder).filter(
                SmartReminder.created_at >= today
            ).count()

            # 今日完成的提醒数
            today_completed = db.query(SmartReminder).filter(
                and_(
                    SmartReminder.completed_at >= today,
                    SmartReminder.status == "completed"
                )
            ).count()

            # 待处理提醒数
            pending_reminders = db.query(SmartReminder).filter(
                SmartReminder.status == "pending"
            ).count()

            # 进行中的种植记录
            active_plants = db.query(PlantingRecord).filter(
                PlantingRecord.status == "growing"
            ).count()

            logger.info(f"今日生成提醒: {today_reminders} 条")
            logger.info(f"今日完成提醒: {today_completed} 条")
            logger.info(f"待处理提醒: {pending_reminders} 条")
            logger.info(f"进行中的种植: {active_plants} 项")

        except Exception as e:
            logger.error(f"每日统计失败: {e}", exc_info=True)
        finally:
            db.close()

        logger.info("每日统计汇总完成")
        logger.info("=" * 60)

    @staticmethod
    def start():
        """启动调度器"""
        logger.info("智能菜地调度器启动")
        logger.info("调度任务配置:")
        logger.info("  - 更新物联网数据: 每5分钟")
        logger.info("  - 更新生长阶段: 每天00:00")
        logger.info("  - 生成智能提醒: 每天06:00, 12:00, 18:00")
        logger.info("  - 每日统计汇总: 每天23:00")
        logger.info("")

        # 物联网数据更新 - 每5分钟
        schedule.every(5).minutes.do(TaskScheduler.update_iot_data)

        # 生长阶段更新 - 每天凌晨执行
        schedule.every().day.at("00:00").do(TaskScheduler.update_growth_stages)

        # 智能提醒生成 - 每天早、中、晚各执行一次
        schedule.every().day.at("06:00").do(TaskScheduler.generate_smart_reminders)
        schedule.every().day.at("12:00").do(TaskScheduler.generate_smart_reminders)
        schedule.every().day.at("18:00").do(TaskScheduler.generate_smart_reminders)

        # 每日统计 - 每天晚上11点
        schedule.every().day.at("23:00").do(TaskScheduler.daily_summary)

        # 立即执行一次初始化任务
        logger.info("执行初始化任务...")
        TaskScheduler.update_growth_stages()
        TaskScheduler.generate_smart_reminders()
        TaskScheduler.update_iot_data()

        # 进入调度循环
        logger.info("进入调度循环，调度器运行中...")
        try:
            while True:
                schedule.run_pending()
                time.sleep(10)  # 每10秒检查一次
        except KeyboardInterrupt:
            logger.info("调度器收到停止信号")
        except Exception as e:
            logger.error(f"调度器异常: {e}", exc_info=True)
        finally:
            logger.info("调度器已停止")


def run_scheduler():
    """运行调度器的入口函数"""
    TaskScheduler.start()


if __name__ == "__main__":
    # 直接运行调度器
    run_scheduler()
