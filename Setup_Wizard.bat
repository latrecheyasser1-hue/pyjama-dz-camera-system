@echo off
chcp 65001 >nul
title Pyjama DZ - Client Camera Setup Wizard
color 0B

echo ========================================================
echo    👑 PYJAMA DZ - ASSISTANT D'INSTALLATION CLIENT 👑
echo ========================================================
echo.
echo مرحباً بك في معالج التثبيت السريع لنظام الحراسة الذكي لـ Pyjama DZ!
echo.
echo اختر مكان هذا الجهاز:
echo [1] الحانوت (Magasin - La Caisse)
echo [2] الديبو (Dépôt - Stock ^& Emballage)
echo [3] الورشة (Atelier - Machines ^& Confection)
echo.
set /p choice="أدخل رقم الاختيار (1-3): "

if "%choice%"=="1" (
    set LOCATION=hanout
    set CAM_ID=cam_hanout_caisse
    echo [✔] تم اختيار: الحانوت ومراقبة لاكيس
) else if "%choice%"=="2" (
    set LOCATION=depot
    set CAM_ID=cam_depot_packing
    echo [✔] تم اختيار: الديبو وطاولات التغليف
) else (
    set LOCATION=atelier
    set CAM_ID=cam_atelier_machines
    echo [✔] تم اختيار: الورشة وآلات الخياطة
)

echo.
echo [?] أدخل عنوان IP تاع علبة DVR أو اضغط Enter للاستعمال الافتراضي [192.168.1.108]:
set /p DVR_IP=""
if "%DVR_IP%"=="" set DVR_IP=192.168.1.108

echo [?] أدخل كلمة المرور (Password) لعلبة DVR [admin123]:
set /p DVR_PASS=""
if "%DVR_PASS%"=="" set DVR_PASS=admin123

echo.
echo [✔] جارٍ ضبط الإعدادات وحفظها في .env...
echo RTSP_%LOCATION%_CAISSE=rtsp://admin:%DVR_PASS%@%DVR_IP%:554/cam/realmonitor?channel=1^&subtype=1 >> .env

echo.
echo ========================================================
echo [✔] تم ضبط إعدادات الكاميرا بنجاح!
echo [✔] لتشغيل الحراسة الآن، قم بتشغيل: Run_Pyjama_DZ_AI.bat
echo ========================================================
pause
