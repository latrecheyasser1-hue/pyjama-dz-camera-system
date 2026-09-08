@echo off
chcp 65001 >nul
title Pyjama DZ - Test Camera Dahua
color 0A

echo ========================================================
echo    PYJAMA DZ - TEST RAPIDE CAMERA DAHUA (192.168.1.150)
echo ========================================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [!] Veuillez d'abord executer: Install_For_Client.bat
    pause
    exit /b
)

venv\Scripts\python.exe engine\test_camera.py

echo.
pause
