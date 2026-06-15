@echo off
title 材料样本管理系统 - 启动器
echo ============================================
echo   材料样本管理系统 - 启动器
echo ============================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [1/2] 正在启动本地服务...
start /b npx vite --port 5173 >nul 2>&1

echo [2/2] 等待服务就绪...
timeout /t 3 /nobreak >nul

echo.
echo 服务已启动，正在打开应用窗口...
echo 关闭此窗口将停止服务

start "" "chrome" --app=http://localhost:5173 --window-size=1440,900 --name="材料样本管理系统"

:loop
timeout /t 5 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo 服务已停止
    exit /b 0
)
goto loop
