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
    pause
    exit /b
)

echo [2/4] Creation de l'environnement virtuel (venv)...
if not exist "venv\Scripts\python.exe" (
    python -m venv venv
)

echo [3/4] Installation des bibliotheques IA et Vision (YOLOv8 + OpenCV)...
call venv\Scripts\python.exe -m pip install --upgrade pip
call venv\Scripts\pip install -r engine\requirements.txt

echo [4/4] Telechargement automatique du modele IA (YOLOv8 Nano - 6MB)...
call venv\Scripts\python.exe -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

echo.
echo ========================================================
echo [OK] INSTALLATION TERMINEE AVEC SUCCES!
echo [OK] Le systeme IA est pret a fonctionner sur ce PC.
echo.
echo Pour demarrer la surveillance:
echo 1. Lancez Setup_Wizard.bat (pour entrer l'IP de la camera)
echo 2. Lancez Run_Pyjama_DZ_AI.bat (pour demarrer)
echo ========================================================
pause
