@echo off
chcp 65001 >nul
title Pyjama DZ - AI Camera & Security System
color 0A

echo ========================================================
echo    👑 PYJAMA DZ - SMART AI CAMERA GUARD v1.0 👑
echo ========================================================
echo.
echo [1/3] Checking environment...

if not exist "venv\Scripts\python.exe" (
    echo [!] Virtual environment not found. Setting up...
    python -m venv venv
    call venv\Scripts\pip install -r engine\requirements.txt
)

echo [2/3] Starting Local AI Vision Engine ^& Caisse Guard...
start "" /B venv\Scripts\python.exe engine\main.py

echo [3/3] Launching Web Dashboard...
cd dashboard
start "" /B npm run dev

timeout /t 3 >nul
start http://localhost:3000

echo.
echo [✔] System is LIVE and Monitoring!
echo [✔] Live Dashboard: http://localhost:3000
echo [✔] Local API & Video Stream: http://127.0.0.1:8000
echo.
echo Keep this window open. Press any key to stop all services.
pause >nul

echo Stopping services...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul
echo Done.
