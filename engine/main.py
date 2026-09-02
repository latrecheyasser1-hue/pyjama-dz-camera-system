"""
Pyjama DZ Camera & Surveillance System
Main Execution Entrypoint
"""
import sys
import os

# Fix Windows console UTF-8 encoding
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import time
import uvicorn
import threading
from pathlib import Path

# Ensure root directory is in python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from engine.config import (
    RTSP_HANOUT_CAISSE,
    RTSP_DEPOT_PACKING,
    RTSP_ATELIER_MACHINES
)
from engine.stream_manager import StreamManager
from engine.supabase_sync import SupabaseSync
from engine.telegram_bot import TelegramNotifier
from engine.caisse_detector import CaisseDetector
from engine.pos_monitor import POSMonitor
from engine.api_server import app, init_api

def detector_worker(caisse_detector: CaisseDetector, stop_event: threading.Event):
    """Background thread that runs the Caisse AI detection loop at 10 FPS."""
    print("[Main] Caisse AI Detection Worker started.")
    while not stop_event.is_set():
        try:
            caisse_detector.process_step()
        except Exception as e:
            print(f"[Detector Worker Error] {e}")
        time.sleep(0.1) # 10 FPS evaluation

def heartbeat_worker(supabase_sync: SupabaseSync, stop_event: threading.Event):
    """Updates camera online status in Supabase every 30 seconds."""
    while not stop_event.is_set():
        try:
            supabase_sync.update_camera_heartbeat("cam_hanout_caisse", status="online", fps=15)
            supabase_sync.update_camera_heartbeat("cam_depot_packing", status="online", fps=15)
            supabase_sync.update_camera_heartbeat("cam_atelier_machines", status="online", fps=15)
        except Exception as e:
            print(f"[Heartbeat Error] {e}")
        time.sleep(30)

def main():
    print("""
    ========================================================
       PYJAMA DZ - AI CAMERA & SURVEILLANCE SYSTEM
       Smart Caisse Guard & Realtime Threat Detection
    ========================================================
    """)

    # 1. Initialize Services
    supabase_sync = SupabaseSync()
    telegram_notifier = TelegramNotifier()

    if telegram_notifier.is_configured():
        print("[Main] [OK] Telegram Bot connected.")
    else:
        print("[Main] [INFO] Telegram Bot running in Simulation/Mock mode (Token not set in .env yet).")

    # 2. Start Camera Streams
    streams = {
        "cam_hanout_caisse": StreamManager(
            camera_id="cam_hanout_caisse",
            stream_url=RTSP_HANOUT_CAISSE,
            location="hanout",
            fps=15
        ),
        "cam_depot_packing": StreamManager(
            camera_id="cam_depot_packing",
            stream_url=RTSP_DEPOT_PACKING,
            location="depot",
            fps=15
        ),
        "cam_atelier_machines": StreamManager(
            camera_id="cam_atelier_machines",
            stream_url=RTSP_ATELIER_MACHINES,
            location="atelier",
            fps=15
        ),
    }

    for stream in streams.values():
        stream.start()

    # 3. Initialize Detectors
    caisse_detector = CaisseDetector(
        stream_manager=streams["cam_hanout_caisse"],
        supabase_sync=supabase_sync,
        telegram_notifier=telegram_notifier
    )

    pos_monitor = POSMonitor(
        on_discount_event_cb=caisse_detector.handle_pos_discount_event
    )
    pos_monitor.start_simulation()

    # 4. Start Background Worker Threads
    stop_event = threading.Event()
    det_thread = threading.Thread(target=detector_worker, args=(caisse_detector, stop_event), daemon=True)
    det_thread.start()

    hb_thread = threading.Thread(target=heartbeat_worker, args=(supabase_sync, stop_event), daemon=True)
    hb_thread.start()

    # 5. Initialize API Server
    init_api(streams, caisse_detector, pos_monitor)

    print("\n[Main] Local Video Streaming & API Server listening on: http://127.0.0.1:8000")
    print("[Main] Caisse Live MJPEG Feed: http://127.0.0.1:8000/stream/cam_hanout_caisse")
    print("[Main] Status: ONLINE\n")

    try:
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")
    except KeyboardInterrupt:
        print("\n[Main] Shutting down Pyjama DZ Camera Engine...")
    finally:
        stop_event.set()
        for stream in streams.values():
            stream.stop()
        pos_monitor.stop()
        print("[Main] Engine stopped cleanly.")

if __name__ == "__main__":
    main()
