@echo off
chcp 65001 >nul
title 共享菜园后端服务

echo ========================================
echo   共享菜园云端小筑 - 后端服务启动
echo ========================================
echo.

echo [1/2] 检查虚拟环境...
if not exist "backend\venv\Scripts\activate.bat" (
    echo ❌ 错误: 虚拟环境不存在
    echo 请先运行: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\activate ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)
echo ✅ 虚拟环境已就绪

echo.
echo [2/2] 启动后端服务...
echo 📍 API地址: http://localhost:8000
echo 📚 API文档: http://localhost:8000/api/docs
echo.
echo ⚠️  按 Ctrl+C 可停止服务
echo ========================================
echo.

cd backend
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo 👋 服务已停止
pause
