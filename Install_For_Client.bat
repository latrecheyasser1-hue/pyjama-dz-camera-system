@echo off
chcp 65001 >nul
title Pyjama DZ - Auto Installer
color 0B

echo ========================================================
echo    PYJAMA DZ - INSTALLATION AUTOMATIQUE DU SYSTEME
echo ========================================================
echo.

echo [1/4] Verification de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Erreur: Python n'est pas installe sur ce PC.
    echo Veuillez installer Python depuis: https://www.python.org/downloads/
    echo N'oubliez pas de cocher: Add Python to PATH
    pause
    exit /b 1
)
echo [OK] Python detecte.

echo [2/4] Preparation de l'environnement virtuel (venv)...
if not exist "venv\Scripts\pip.exe" (
    echo [*] Creation d'un environnement virtuel propre...
    if exist "venv" rmdir /s /q "venv" 2>nul
    python -m venv venv
)

if not exist "venv\Scripts\python.exe" (
    echo [!] Erreur: Impossible de creer le venv.
    pause
    exit /b 1
)
echo [OK] Environnement virtuel pret.

echo [3/4] Installation des bibliotheques IA et Vision...
echo [*] Veuillez patienter...
call venv\Scripts\python.exe -m pip install -r engine\requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [!] Erreur lors de l'installation des dependances.
    echo Verifiez votre connexion Internet et relancez le script.
    pause
    exit /b 1
)
echo [OK] Bibliotheques installees.

echo.
echo [4/4] Telechargement automatique du modele IA...
call venv\Scripts\python.exe -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
if %errorlevel% neq 0 (
    echo.
    echo [!] Erreur lors du telechargement du modele YOLOv8.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo [OK] INSTALLATION TERMINEE AVEC SUCCES!
echo [OK] Le systeme IA et YOLOv8 sont 100%% operationnels!
echo ========================================================
echo.
echo Pour demarrer la surveillance:
echo 1. Testez la camera avec: Test_Camera_Dahua.bat
echo 2. Lancez le systeme avec: Run_Pyjama_DZ_AI.bat
echo ========================================================
pause
