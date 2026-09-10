@echo off
chcp 65001 >nul
title Pyjama DZ - Enable Auto-Startup with Windows
color 0A

echo ========================================================
echo    PYJAMA DZ - AUTO STARTUP CONFIGURATION
echo    تفعيل التشغيل التلقائي مع إقلاع الويندوز
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "TARGET_BAT=%SCRIPT_DIR%Run_Pyjama_DZ_AI.bat"
set "SHORTCUT_PATH=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Pyjama_DZ_AI.lnk"

echo [*] Target batch file: %TARGET_BAT%
echo [*] Windows Startup folder: %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
echo.

powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET_BAT%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.WindowStyle = 7; $s.Description = 'Pyjama DZ AI Camera Guard Auto-Start'; $s.Save()"

if %errorlevel% equ 0 (
    echo ========================================================
    echo [OK] SUCCESS: Auto-Startup has been enabled!
    echo تم تفعيل التشغيل التلقائي بنجاح تام!
    echo.
    echo بمجرد إشعال البيسي، سيبدأ النظام ومحرك الذكاء الاصطناعي
    echo بالعمل أوتوماتيكياً في الخلفية بدون الحاجة لأي نقرة.
    echo ========================================================
) else (
    echo [!] Failed to create startup shortcut.
)

echo.
pause
