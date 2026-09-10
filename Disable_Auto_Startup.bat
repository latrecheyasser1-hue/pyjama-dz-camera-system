@echo off
chcp 65001 >nul
title Pyjama DZ - Disable Auto-Startup
color 0C

echo ========================================================
echo    PYJAMA DZ - DISABLE AUTO STARTUP
echo    إلغاء التشغيل التلقائي مع الويندوز
echo ========================================================
echo.

set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Pyjama_DZ_AI.lnk"

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [OK] Auto-Startup has been disabled successfully.
    echo تم إلغاء التشغيل التلقائي بنجاح.
) else (
    echo [INFO] Auto-Startup was not enabled.
    echo التشغيل التلقائي غير مفعل حالياً.
)

echo.
pause
