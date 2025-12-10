@echo off
chcp 65001 >nul
cls

echo ================================
echo   共享菜园云端小筑 - 后端服务
echo ================================
echo.

echo [1/3] 检查虚拟环境...
if not exist "venv\Scripts\python.exe" (
    echo ❌ 虚拟环境不存在
    echo.
    echo 正在创建虚拟环境...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ 创建失败
        pause
        exit /b 1
    )
    echo ✅ 虚拟环境创建成功
    echo.
    echo 正在安装依赖...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装成功
) else (
    echo ✅ 虚拟环境已存在
)

echo.
echo [2/3] 激活虚拟环境...
call venv\Scripts\activate.bat
echo ✅ 已激活

echo.
echo [3/3] 启动后端服务...
echo.
echo 🚀 服务启动中...
echo 📍 地址: http://localhost:8000
echo 📚 文档: http://localhost:8000/docs
echo.
echo ⚠️  按 Ctrl+C 可以停止服务
echo.
echo ================================
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000