@echo off
chcp 65001 >nul
echo ========================================
echo    停止云端小筑项目
echo ========================================
echo.

echo 正在查找并停止后端服务...

REM 查找占用8000端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo 发现后端进程 PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✓ 成功停止后端服务
    ) else (
        echo ✗ 停止失败，可能需要管理员权限
    )
)

REM 检查是否还有进程在运行
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo.
    echo ⚠ 警告：仍有进程占用8000端口
    echo 请手动检查并关闭
) else (
    echo.
    echo ✓ 所有服务已停止
)

echo.
echo ========================================
echo  停止完成！
echo ========================================
echo.
pause
