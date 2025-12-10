@echo off
chcp 65001 >nul
echo ============================================
echo 云端小筑 - 数据库初始化脚本
echo ============================================
echo.

REM 检查MySQL是否安装
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到MySQL命令
    echo 请确保MySQL已安装并添加到系统PATH中
    pause
    exit /b 1
)

echo ✅ 检测到MySQL已安装
echo.

REM 提示输入MySQL密码
set /p MYSQL_PASSWORD="请输入MySQL root密码 (默认: 123456): "
if "%MYSQL_PASSWORD%"=="" set MYSQL_PASSWORD=123456

echo.
echo 正在初始化数据库...
echo.

REM 执行SQL脚本
mysql -u root -p%MYSQL_PASSWORD% < init_database.sql

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo ✅ 数据库初始化成功!
    echo ============================================
    echo.
    echo 📊 已创建数据库: garden_db
    echo 📋 已创建14张表
    echo 📝 已插入测试数据
    echo.
    echo 🔑 数据库信息:
    echo    主机: localhost
    echo    端口: 3306
    echo    数据库: garden_db
    echo    用户名: root
    echo    密码: %MYSQL_PASSWORD%
    echo.
    echo 🚀 下一步:
    echo    1. 编辑 .env 文件,确保数据库配置正确
    echo    2. 运行 run.bat 启动后端服务
    echo.
) else (
    echo.
    echo ❌ 数据库初始化失败!
    echo 请检查:
    echo    1. MySQL服务是否启动: net start MySQL
    echo    2. root密码是否正确
    echo    3. init_database.sql 文件是否存在
    echo.
)

pause
