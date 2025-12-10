@echo off
chcp 65001 >nul
echo ============================================
echo 检查数据库表结构
echo ============================================
echo.

mysql -u root -p123456 -e "USE garden_db; SHOW TABLES;" 2>nul

echo.
echo ============================================
echo IoT 相关表:
echo ============================================
mysql -u root -p123456 -e "USE garden_db; DESCRIBE iot_sensors;" 2>nul | findstr /V "Warning"
echo.
echo ============================================
echo 智能提醒表:
echo ============================================
mysql -u root -p123456 -e "USE garden_db; DESCRIBE smart_reminders;" 2>nul | findstr /V "Warning"
echo.
echo ============================================
echo 种植记录表:
echo ============================================
mysql -u root -p123456 -e "USE garden_db; DESCRIBE planting_records;" 2>nul | findstr /V "Warning"
echo.

pause
