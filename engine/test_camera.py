"""
Pyjama DZ - Dahua Camera RTSP Connection Tester
Tests connection to 192.168.1.150 and verifies video feed.
"""
import sys
import time
import cv2

RTSP_URL = "rtsp://admin:admin123@192.168.1.150:554/cam/realmonitor?channel=1&subtype=0"

print("=" * 60)
print("   PYJAMA DZ - TEST DE CONNEXION CAMERA DAHUA")
print("=" * 60)
print(f"\n[1/3] Tentative de connexion au DVR...")
print(f"URL: rtsp://admin:****@192.168.1.150:554/cam/realmonitor?channel=1")

start_time = time.time()
cap = cv2.VideoCapture(RTSP_URL, cv2.CAP_FFMPEG)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

if not cap.isOpened():
    print("\n[!] ECHEC: Impossible d'ouvrir le flux RTSP.")
    print("Veuillez verifier:")
    print("1. Le PC est bien connecte au meme modem que le DVR (ex: 192.168.1.x).")
    print("2. L'adresse IP du DVR est bien 192.168.1.150.")
    print("3. Le mot de passe DVR est bien: admin123.")
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
