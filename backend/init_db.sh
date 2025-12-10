#!/bin/bash

# ============================================
# 云端小筑 - 数据库初始化脚本 (Linux/Mac)
# ============================================

echo "============================================"
echo "云端小筑 - 数据库初始化脚本"
echo "============================================"
echo ""

# 检查MySQL是否安装
if ! command -v mysql &> /dev/null; then
    echo "❌ 错误: 未找到MySQL命令"
    echo "请先安装MySQL:"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-server"
    echo "  CentOS/RHEL: sudo yum install mysql-server"
    echo "  macOS: brew install mysql"
    exit 1
fi

echo "✅ 检测到MySQL已安装"
echo ""

# 提示输入MySQL密码
read -p "请输入MySQL root密码 (默认: 123456): " MYSQL_PASSWORD
MYSQL_PASSWORD=${MYSQL_PASSWORD:-123456}

echo ""
echo "正在初始化数据库..."
echo ""

# 执行SQL脚本
mysql -u root -p"$MYSQL_PASSWORD" < init_database.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "✅ 数据库初始化成功!"
    echo "============================================"
    echo ""
    echo "📊 已创建数据库: garden_db"
    echo "📋 已创建14张表"
    echo "📝 已插入测试数据"
    echo ""
    echo "🔑 数据库信息:"
    echo "   主机: localhost"
    echo "   端口: 3306"
    echo "   数据库: garden_db"
    echo "   用户名: root"
    echo "   密码: $MYSQL_PASSWORD"
    echo ""
    echo "🚀 下一步:"
    echo "   1. 编辑 .env 文件,确保数据库配置正确"
    echo "   2. 运行 ./start.sh 启动后端服务"
    echo ""
else
    echo ""
    echo "❌ 数据库初始化失败!"
    echo "请检查:"
    echo "   1. MySQL服务是否启动"
    echo "      Ubuntu/Debian: sudo systemctl status mysql"
    echo "      CentOS/RHEL: sudo systemctl status mysqld"
    echo "      macOS: brew services list"
    echo "   2. root密码是否正确"
    echo "   3. init_database.sql 文件是否存在"
    echo ""
    exit 1
fi
