"""
快速添加种植记录测试脚本
用于快速生成测试数据
"""
from app.core.database import SessionLocal
from app.models.crop import PlantingRecord, Crop, GrowthStage
from app.models.garden import Garden
from app.models.order import Order, OrderStatus
from app.models.user import User
from datetime import datetime, timedelta, date


def add_test_planting_records():
    """添加测试种植记录"""
    db = SessionLocal()

    try:
        # 1. 获取第一个用户
        user = db.query(User).first()
        if not user:
            print("❌ 没有找到用户，请先创建用户")
            return

        print(f"✅ 找到用户: {user.username} (ID: {user.id})")

        # 2. 获取第一个菜地
        garden = db.query(Garden).first()
        if not garden:
            print("❌ 没有找到菜地，请先创建菜地")
            return

        print(f"✅ 找到菜地: {garden.name} (ID: {garden.id})")

        # 3. 检查或创建订单
        active_order = db.query(Order).filter(
            Order.user_id == user.id,
            Order.garden_id == garden.id,
            Order.status.in_([OrderStatus.PAID, OrderStatus.ACTIVE]),
            Order.end_date >= date.today()
        ).first()

        if not active_order:
            # 创建一个测试订单
            from app.models.order import Order

            active_order = Order(
                user_id=user.id,
                garden_id=garden.id,
                start_date=date.today(),
                end_date=date.today() + timedelta(days=90),
                total_price=garden.price,
                status=OrderStatus.ACTIVE
            )
            db.add(active_order)
            db.commit()
            db.refresh(active_order)
            print(f"✅ 创建订单 (ID: {active_order.id})")
        else:
            print(f"✅ 找到订单 (ID: {active_order.id})")

        # 4. 获取作物
        crops = db.query(Crop).all()
        if not crops:
            print("❌ 没有找到作物，请先运行 init_system.py 初始化作物数据")
            return

        print(f"✅ 找到 {len(crops)} 种作物")

        # 5. 为每种作物创建种植记录
        created_count = 0
        for i, crop in enumerate(crops[:3]):  # 只添加前3种作物
            # 检查是否已存在
            existing = db.query(PlantingRecord).filter(
                PlantingRecord.garden_id == garden.id,
                PlantingRecord.crop_id == crop.id,
                PlantingRecord.user_id == user.id,
                PlantingRecord.status == "growing"
            ).first()

            if existing:
                print(f"⏭️  {crop.name} 已有种植记录，跳过")
                continue

            # 创建种植记录（种植日期分别为今天、7天前、14天前）
            days_ago = i * 7
            planting_date = datetime.now() - timedelta(days=days_ago)
            expected_harvest_date = planting_date + timedelta(days=crop.total_growth_days)

            planting_record = PlantingRecord(
                garden_id=garden.id,
                crop_id=crop.id,
                user_id=user.id,
                planting_date=planting_date,
                expected_harvest_date=expected_harvest_date,
                current_stage=GrowthStage.SEEDLING.value if days_ago > 5 else GrowthStage.SEED.value,
                current_stage_day=min(days_ago + 1, 7),
                quantity=10,
                area=2.0,
                status="growing",
                notes=f"测试种植记录 - {crop.name}"
            )

            db.add(planting_record)
            created_count += 1
            print(f"✅ 添加种植记录: {crop.name} (种植于 {days_ago} 天前)")

        db.commit()

        print(f"\n🎉 成功添加 {created_count} 条种植记录！")
        print("\n现在可以：")
        print("1. 在小程序中查看'我的菜地'")
        print("2. 进入'任务提醒'查看智能提醒")
        print("3. 或运行调度器生成提醒: python -m app.services.scheduler")

    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🌱 快速添加种植记录测试数据")
    print("=" * 60)
    add_test_planting_records()
