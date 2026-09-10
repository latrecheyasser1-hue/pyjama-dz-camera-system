"""
Pyjama DZ Camera System
FastAPI Local Streaming & Management Server
"""
import os
import cv2
import time
from pathlib import Path
from typing import Optional
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
DAILY_REPORTER = None

def init_api(stream_managers: dict, caisse_detector, pos_monitor, daily_reporter=None):
    global STREAMS, DETECTOR, POS_MON, DAILY_REPORTER
    STREAMS = stream_managers
    DETECTOR = caisse_detector
    POS_MON = pos_monitor
    DAILY_REPORTER = daily_reporter

@app.get("/")
def root():
    # If React dashboard build exists, serve it directly to the browser
    dashboard_index = Path(__file__).resolve().parent.parent / "dashboard" / "dist" / "index.html"
    if dashboard_index.exists():
        return FileResponse(dashboard_index)
    return {
        "service": "Pyjama DZ AI Camera Guard",
        "status": "online",
        "cameras": list(STREAMS.keys()),
        "time": time.strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/api/health")
def api_health():
    return {
        "service": "Pyjama DZ AI Camera Guard",
        "status": "online",
        "cameras": list(STREAMS.keys()),
        "time": time.strftime("%Y-%m-%d %H:%M:%S")
    }

@app.post("/api/reports/send-midnight-now")
def send_midnight_now():
    """Trigger dispatch of individual worker reports via Telegram immediately."""
    if not DAILY_REPORTER:
        return {"ok": False, "error": "Daily reporter not initialized"}
    results = DAILY_REPORTER.dispatch_all_reports()
    return {"ok": True, "dispatched": len(results), "reports": results}

from engine.camera_discovery import CameraDiscovery
camera_discovery = CameraDiscovery()

@app.get("/api/cameras/active")
def get_active_cameras():
    """Returns the list of currently detected and active camera channels."""
    channels = camera_discovery.get_active_channels()
    return {"ok": True, "count": len(channels), "cameras": channels}

@app.post("/api/cameras/scan")
def scan_cameras():
    """Scans the Dahua DVR in real-time to auto-detect connected channels."""
    detected = camera_discovery.scan_network()
    return {"ok": True, "count": len(detected), "cameras": detected}

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

from engine.dahua_pool import dahua_pool

def generate_mjpeg(camera_id: str, show_ai: bool = True, channel: int = 1):
    """Generator for MJPEG live camera streaming to browser with true Dahua multi-channel support."""
    stream = STREAMS.get(camera_id)
    is_hanout_dahua = (camera_id == "cam_hanout_caisse")

    while True:
        frame = None
        if is_hanout_dahua and channel > 0:
            frame = dahua_pool.get_frame(channel)

        # Fallback to base stream if pool frame is not ready
        if frame is None and stream:
            frame = stream.get_latest_frame()

        if frame is None:
            time.sleep(0.05)
            continue

        annotated = frame.copy()
        h, w = annotated.shape[:2]

        # Draw Channel Title Banner
        ch_names = {
            1: "CH-01: ENTREE PRINCIPALE & DEVANTURE",
            2: "CH-02: CAMERA 2",
            3: "CH-03: VUE GLOBALE DU MAGASIN & CAISSE",
            4: "CH-04: ALLÉE CENTRALE & RAYONS PYJAMAS",
            5: "CH-05: COULOIR VITRINE & MANNEQUINS",
            6: "CH-06: RAYONS & EXPOSITION",
            7: "CH-07: ESPACE CABINES D'ESSAYAGE",
            8: "CH-08: TABLES DE PRESENTATION",
            9: "CH-09: LA CAISSE (SURVEILLANCE COMPTOIR DIRECTE)",
            10: "CH-10: ARRIERE BOUTIQUE & STOCK",
            16: "CH-16: VUE COMPLETE DU MAGASIN"
        }
        ch_label = ch_names.get(channel, f"DAHUA CH-{channel:02d}")
        cv2.putText(annotated, ch_label, (20, h - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)

        if show_ai and is_hanout_dahua and (channel in [1, 3, 9]):
            # Draw AI Caisse Detection Zone
            if channel == 9: # Overhead counter
                cv2.rectangle(annotated, (int(w * 0.15), int(h * 0.20)), (int(w * 0.85), int(h * 0.85)), (0, 0, 255), 2)
                cv2.putText(annotated, "ZONE COMPTOIR CAISSE (AI)", (int(w * 0.15) + 5, int(h * 0.20) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)
            else:
                cv2.rectangle(annotated, (int(w * 0.35), int(h * 0.45)), (int(w * 0.65), int(h * 0.85)), (0, 0, 255), 2)
                cv2.putText(annotated, "ZONE CAISSE (AI)", (int(w * 0.35) + 5, int(h * 0.45) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

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

@app.get("/snapshot/{camera_id}")
def get_snapshot(camera_id: str, channel: int = 1):
    """Returns a single instant JPEG frame for a given channel without holding a streaming connection."""
    frame = None
    if camera_id == "cam_hanout_caisse" and channel > 0:
        frame = dahua_pool.get_frame(channel)

    if frame is None and camera_id in STREAMS:
        frame = STREAMS[camera_id].get_latest_frame()

    if frame is None:
        return Response(status_code=404, content="Frame not available")

    ret, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not ret:
        return Response(status_code=500, content="Encoding error")

    return Response(
        content=jpeg.tobytes(),
        media_type="image/jpeg",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
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

# Mount React production build so dashboard is served directly from Python
from fastapi.staticfiles import StaticFiles
dashboard_dist = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if dashboard_dist.exists():
    app.mount("/", StaticFiles(directory=str(dashboard_dist), html=True), name="static_dashboard")
