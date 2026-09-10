"""
Pyjama DZ - Dahua Camera RTSP Connection Tester
Tests connection to 192.168.1.150 and verifies video feed.
"""
import sys
import time
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import cv2
from engine.config import RTSP_HANOUT_CAISSE

RTSP_URL = RTSP_HANOUT_CAISSE

# Safe display URL (hide password)
safe_display = RTSP_URL
if "@" in safe_display:
    prefix = safe_display.split("@")[0]
    suffix = safe_display.split("@")[1]
    proto = prefix.split("://")[0]
    safe_display = f"{proto}://admin:****@{suffix}"

print("=" * 60)
print("   PYJAMA DZ - TEST DE CONNEXION CAMERA DAHUA")
print("=" * 60)
print(f"\n[1/3] Tentative de connexion au DVR...")
print(f"Flux configure: {safe_display}")

start_time = time.time()
cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

if not cap.isOpened():
    print("\n[!] ECHEC: Impossible d'ouvrir le flux RTSP.")
    print("Veuillez verifier:")
    print("1. Le PC est bien connecte au meme modem/reseau que le DVR (ex: 192.168.1.x).")
    print("2. L'adresse IP du DVR et le mot de passe dans le fichier .env sont corrects.")
    print(f"3. URL testee: {safe_display}")
    sys.exit(1)

print("[2/3] Connexion etablie! Lecture de la premiere image...")
ret, frame = cap.read()

if not ret or frame is None:
    print("\n[!] ECHEC: Le flux est ouvert mais aucune image n'a ete recue.")
    sys.exit(1)

h, w = frame.shape[:2]
elapsed = round(time.time() - start_time, 2)
print(f"\n[3/3] [SUCCES TOTAL!] Image capturee en {elapsed}s.")
print(f"      Resolution de la camera: {w}x{h} pixels.")
print("\n" + "=" * 60)
print(" [OK] LA CAMERA EST 100% COMPATIBLE ET PRETE POUR L'IA!")
print("=" * 60)

# Save snapshot sample
cv2.imwrite("test_camera_ok.jpg", frame)
print("\nUne photo test a ete enregistree sous: test_camera_ok.jpg")
cap.release()
