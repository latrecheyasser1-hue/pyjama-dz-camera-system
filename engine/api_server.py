"""
Pyjama DZ Camera System
FastAPI Local Streaming & Management Server
"""
import os
import cv2
import time
from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from engine.config import CLIPS_DIR

app = FastAPI(title="Pyjama DZ Camera AI Engine", version="1.0.0")

# Enable CORS for local/cloud dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reference to active stream managers and detector
STREAMS = {}
DETECTOR = None
POS_MON = None

def init_api(stream_managers: dict, caisse_detector, pos_monitor):
    global STREAMS, DETECTOR, POS_MON
    STREAMS = stream_managers
    DETECTOR = caisse_detector
    POS_MON = pos_monitor

@app.get("/")
def root():
    return {
        "service": "Pyjama DZ AI Camera Guard",
        "status": "online",
        "cameras": list(STREAMS.keys()),
        "time": time.strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/status")
def get_status():
    status_data = {}
    for cam_id, stream in STREAMS.items():
        state = stream.get_state() if hasattr(stream, "get_state") else {}
        status_data[cam_id] = {
            "is_running": stream.is_running,
            "stream_url": stream.stream_url,
            "location": stream.location,
            "state": state
        }
    return status_data

def generate_mjpeg(camera_id: str, show_ai: bool = True, channel: int = 1):
    """Generator for MJPEG live camera streaming to browser."""
    stream = STREAMS.get(camera_id)
    if not stream:
        return

    while True:
        frame = stream.get_latest_frame()
        if frame is None:
            time.sleep(0.05)
            continue

        annotated = frame.copy()
        h, w = annotated.shape[:2]

        # Draw Channel Title Banner
        ch_names = {
            1: "CH-01: CAISSE & COMPTOIR",
            2: "CH-02: ENTREE PRINCIPALE",
            3: "CH-03: RAYONS & PYJAMAS",
            4: "CH-04: CABINES & STOCK"
        }
        ch_label = ch_names.get(channel, f"CH-{channel:02d}")
        cv2.putText(annotated, ch_label, (20, h - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)

        if show_ai and camera_id == "cam_hanout_caisse" and channel == 1:
            # Draw AI Zone Overlay (Zone de Caisse in Red, Zone Attente in Blue)
            # 1. Zone Caisse
            cv2.rectangle(annotated, (int(w * 0.35), int(h * 0.45)), (int(w * 0.65), int(h * 0.85)), (0, 0, 255), 2)
            cv2.putText(annotated, "ZONE CAISSE (AI)", (int(w * 0.35) + 5, int(h * 0.45) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

            # 2. Zone Attente Client
            cv2.rectangle(annotated, (int(w * 0.05), int(h * 0.30)), (int(w * 0.30), int(h * 0.90)), (255, 180, 0), 2)
            cv2.putText(annotated, "ZONE ATTENTE", (int(w * 0.05) + 5, int(h * 0.30) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 180, 0), 2)

        # Encode JPEG
        ret, jpeg = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
        if not ret:
            continue

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        time.sleep(1.0 / 15.0)

@app.get("/stream/{camera_id}")
def video_feed(camera_id: str, ai: bool = True, channel: int = 1):
    """MJPEG Live video feed for web browser with multi-channel support."""
    if camera_id not in STREAMS:
        return Response(status_code=404, content=f"Camera {camera_id} not found")
    return StreamingResponse(
        generate_mjpeg(camera_id, show_ai=ai, channel=channel),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/clips")
def list_clips():
    """List all recorded suspicious MP4 clips."""
    clips = []
    if CLIPS_DIR.exists():
        for file in sorted(CLIPS_DIR.glob("*.mp4"), key=os.path.getmtime, reverse=True):
            clips.append({
                "filename": file.name,
                "size_mb": round(file.stat().st_size / (1024 * 1024), 2),
                "modified": time.ctime(file.stat().st_mtime),
                "url": f"/clips/{file.name}"
            })
    return clips

@app.get("/clips/{filename}")
def get_clip(filename: str):
    file_path = CLIPS_DIR / filename
    if not file_path.exists():
        return Response(status_code=404, content="Clip not found")
    return FileResponse(
        file_path,
        media_type="video/mp4",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-cache"
        }
    )

@app.post("/test/trigger-discount")
def test_discount():
    """Manual test endpoint to simulate an abnormal discount."""
    if POS_MON:
        POS_MON.trigger_manual_transaction(
            original=2500.0,
            paid=1500.0,
            discount=1000.0,
            ticket_id=f"TEST_{int(time.time())}"
        )
        return {"ok": True, "message": "Triggered abnormal discount simulation (-1000 DA)"}
    return {"ok": False, "message": "POS Monitor not initialized"}

@app.post("/test/trigger-no-customer")
def test_no_customer():
    """Manual test endpoint to trigger a no-customer drawer alert."""
    if DETECTOR:
        DETECTOR._trigger_no_customer_drawer_alert(time.time())
        return {"ok": True, "message": "Triggered no-customer drawer opening alert"}
    return {"ok": False, "message": "Detector not initialized"}

# ==================== Worker Face Enrollment APIs ====================
from fastapi import Form, UploadFile, File
from engine.face_recognizer import FaceRecognizer, FACES_DIR

face_recognizer = FaceRecognizer()

@app.get("/api/workers")
def get_workers_list():
    """Return all registered workers."""
    return face_recognizer.get_all_workers()

@app.post("/api/workers/enroll")
async def enroll_worker(
    full_name: str = Form(...),
    role: str = Form(...),
    location: str = Form(...),
    workstation: str = Form(...),
    shift_start: str = Form("08:00"),
    shift_end: str = Form("17:00"),
    photo: Optional[UploadFile] = File(None)
):
    """Register a new worker with their face photo."""
    photo_bytes = None
    if photo:
        photo_bytes = await photo.read()

    worker = face_recognizer.enroll_worker(
        full_name=full_name,
        role=role,
        location=location,
        workstation=workstation,
        shift_start=shift_start,
        shift_end=shift_end,
        photo_bytes=photo_bytes
    )
    return {"ok": True, "worker": worker}

@app.delete("/api/workers/{worker_id}")
def delete_worker(worker_id: str):
    """Delete an enrolled worker."""
    success = face_recognizer.delete_worker(worker_id)
    return {"ok": success}

@app.get("/api/workers/photos/{filename}")
def get_worker_photo(filename: str):
    """Serve worker face photo."""
    file_path = FACES_DIR / filename
    if not file_path.exists():
        return Response(status_code=404, content="Photo not found")
    return FileResponse(file_path, media_type="image/jpeg")
