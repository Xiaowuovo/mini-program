"""
创建物联网相关数据库表
用于智能提醒系统的物联网功能
"""
import sys
from app.core.database import engine
from sqlalchemy import text


def create_iot_tables():
    """创建物联网相关表"""
    print("=" * 60)
    print("🔧 创建物联网相关数据库表")
    print("=" * 60)

    # 读取 SQL 文件
    sql_file = "create_iot_tables.sql"

    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
    except FileNotFoundError:
        print(f"❌ SQL 文件不存在: {sql_file}")
        return False

    # 分割 SQL 语句
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip() and not stmt.strip().startswith('--')]

    with engine.connect() as conn:
        created_tables = []

        for i, statement in enumerate(statements, 1):
            # 跳过注释和空语句
            if not statement or statement.startswith('--'):
                continue

            # 跳过 USE 语句（已在配置中指定数据库）
            if statement.upper().startswith('USE '):
                continue

            # 跳过 SHOW 和 DESCRIBE 语句（仅用于验证）
            if any(statement.upper().startswith(cmd) for cmd in ['SHOW ', 'DESCRIBE ']):
                continue

            try:
                # 执行 SQL 语句
                conn.execute(text(statement))
                conn.commit()

                # 提取表名
                if 'CREATE TABLE' in statement.upper():
                    table_name = statement.split('`')[1] if '`' in statement else 'unknown'
                    created_tables.append(table_name)
                    print(f"✅ [{i}] 创建表: {table_name}")
                else:
                    print(f"✅ [{i}] 执行成功")

            except Exception as e:
                # 如果是"表已存在"错误，忽略
                if '1050' in str(e) or 'already exists' in str(e).lower():
                    print(f"⏭️  [{i}] 表已存在，跳过")
                else:
                    print(f"❌ [{i}] 执行失败: {e}")
                    print(f"   SQL: {statement[:100]}...")

    print("\n" + "=" * 60)
    print("📊 创建结果总结")
    print("=" * 60)

    if created_tables:
        print(f"✅ 成功创建 {len(created_tables)} 个表:")
        for table in created_tables:
            print(f"   - {table}")
    else:
        print("ℹ️  所有表已存在，无需创建")

    # 验证表是否存在
    print("\n" + "=" * 60)
    print("🔍 验证表是否存在")
    print("=" * 60)

    tables_to_check = ['iot_sensors', 'iot_readings', 'planting_records', 'smart_reminders']

    with engine.connect() as conn:
        for table in tables_to_check:
            try:
                result = conn.execute(text(f"SHOW TABLES LIKE '{table}'"))
                exists = result.fetchone() is not None
                status = "✅ 存在" if exists else "❌ 不存在"
                print(f"{status} - {table}")
            except Exception as e:
                print(f"❌ 检查失败 - {table}: {e}")

    print("\n" + "=" * 60)
    print("🎉 数据库表创建完成！")
    print("=" * 60)
    print("\n现在可以：")
    print("1. 重启后端服务")
    print("2. 在小程序中测试智能提醒功能")
    print("3. 运行: python quick_add_planting.py 添加测试数据")
    print()

    return True


if __name__ == "__main__":
    try:
        success = create_iot_tables()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
