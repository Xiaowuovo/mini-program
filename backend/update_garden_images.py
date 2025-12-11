"""
更新数据库中菜地的图片链接
将旧的无效图片链接替换为新的有效链接
"""
import sys
import os
import random

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.garden import Garden
from garden_images import GARDEN_IMAGES
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def update_garden_images():
    """更新所有菜地的图片链接"""
    db = SessionLocal()
    try:
        # 获取所有菜地
        gardens = db.query(Garden).all()
        logger.info(f"找到 {len(gardens)} 个菜地，开始更新图片...")

        updated_count = 0
        for garden in gardens:
            # 随机选择1-3张图片
            image_count = random.randint(1, 3)
            new_images = random.sample(GARDEN_IMAGES, image_count)

            # 更新图片
            garden.images = new_images
            updated_count += 1

            logger.info(f"✓ 更新菜地 [{garden.name}] 的图片 ({len(new_images)}张)")

        # 提交更改
        db.commit()
        logger.info(f"\n✅ 成功更新 {updated_count} 个菜地的图片链接！")
        logger.info(f"所有图片现在都使用 Picsum Photos 的真实照片")

        # 显示几个示例
        logger.info("\n示例图片链接:")
        for i, img in enumerate(GARDEN_IMAGES[:5], 1):
            logger.info(f"  {i}. {img}")

        return True

    except Exception as e:
        logger.error(f"✗ 更新失败: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("开始更新菜地图片链接...")
    logger.info("=" * 60)

    success = update_garden_images()

    if success:
        logger.info("\n" + "=" * 60)
        logger.info("✅ 更新完成！现在可以重启后端服务查看效果")
        logger.info("=" * 60)
    else:
        logger.info("\n" + "=" * 60)
        logger.info("❌ 更新失败，请检查错误信息")
        logger.info("=" * 60)
