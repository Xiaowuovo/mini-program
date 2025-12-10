@echo off
chcp 65001 >nul
echo ========================================
echo    云端小筑 - 共享菜园管理系统
echo ========================================
echo.

REM 检查MySQL是否运行
echo [1/3] 检查MySQL数据库...
netstat -ano | findstr :3306 >nul
if %errorlevel% equ 0 (
    echo     ✓ MySQL已运行
) else (
    echo     ✗ MySQL未运行，请先启动MySQL！
    echo.
    echo     提示：可以通过以下方式启动：
    echo     - 打开XAMPP/WAMP控制面板启动MySQL
    echo     - 或运行: net start MySQL
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] 启动后端服务...
echo     启动FastAPI后端（端口8000）...

REM 启动后端服务（后台运行）
start /B cmd /C "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > logs\backend.log 2>&1"

REM 等待后端启动
echo     等待后端启动...
timeout /t 5 /nobreak >nul

REM 检查后端是否成功启动
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    echo     ✓ 后端服务启动成功（http://127.0.0.1:8000）
) else (
    echo     ✗ 后端服务启动失败，请查看日志：backend\logs\backend.log
    pause
    exit /b 1
)

echo.
echo [3/3] 打开API文档和微信开发者工具...

REM 在浏览器中打开API文档
start http://127.0.0.1:8000/api/docs

echo     ✓ API文档已在浏览器中打开
echo.
echo ========================================
echo    启动完成！
echo ========================================
echo.
echo  后端服务: http://127.0.0.1:8000
echo  API文档:  http://127.0.0.1:8000/api/docs
echo  日志位置: backend\logs\backend.log
echo.
echo  前端开发:
echo  1. 打开微信开发者工具
echo  2. 导入项目目录: %cd%\miniprogram
echo  3. 点击"编译"开始开发
echo.
echo ========================================
echo  按任意键关闭此窗口...
echo  (关闭不会停止后端服务)
echo ========================================
pause >nul
