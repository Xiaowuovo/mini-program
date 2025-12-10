@echo off
chcp 65001 >nul
REM 共享菜园云端小筑 - 后端启动脚本

echo ========================================
echo   共享菜园"云端小筑" 后端服务
echo ========================================
echo.

REM 检查虚拟环境
if not exist "venv\" (
    echo [错误] 虚拟环境不存在！
    echo 请先运行: python -m venv venv
    pause
    exit /b 1
)

REM 激活虚拟环境
echo [1/3] 激活虚拟环境...
call venv\Scripts\activate.bat

REM 检查依赖
echo [2/3] 检查依赖包...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo [警告] 依赖包未安装，正在安装...
    pip install -r requirements.txt
)

REM 启动服务
echo [3/3] 启动后端服务...
echo.
echo ========================================
echo   服务已启动！
echo   📚 API文档: http://localhost:8000/api/docs
echo   📊 ReDoc: http://localhost:8000/api/redoc
echo   💚 健康检查: http://localhost:8000/health
echo ========================================
echo.
echo 按 Ctrl+C 停止服务
echo.

python -m app.main

pause
