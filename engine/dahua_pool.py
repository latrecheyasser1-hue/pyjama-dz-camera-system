"""
Pyjama DZ Camera System
Dahua Multi-Channel RTSP Stream Pool
Allows instant switching between any channel (1 to 16) on the Dahua DVR.
"""
import time
import threading
import cv2
import numpy as np
from typing import Optional, Dict

from engine.config import (
    DAHUA_DVR_IP,
    DAHUA_RTSP_PORT,
    DAHUA_USERNAME,
    DAHUA_PASSWORD
)

class DahuaChannelWorker:
    """
    Dedicated worker thread capturing frames for an individual Dahua channel.
    Automatically starts on demand and shuts down when inactive to preserve bandwidth.
    """
    def __init__(self, channel_id: int):
        self.channel_id = channel_id
        # Use subtype=1 (substream D1/960x576) for lightweight, low latency multi-channel streaming
        self.rtsp_url = (
            f"rtsp://{DAHUA_USERNAME}:{DAHUA_PASSWORD}@"
            f"{DAHUA_DVR_IP}:{DAHUA_RTSP_PORT}/cam/realmonitor?channel={channel_id}&subtype=1"
        )
        self.latest_frame: Optional[np.ndarray] = None
        self.lock = threading.Lock()
        self.is_running = False
        self.last_access = time.time()
        self.thread: Optional[threading.Thread] = None
        self.is_connected = False

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        print(f"[DahuaPool] Started stream worker for CH-{self.channel_id}")

    def stop(self):
        self.is_running = False

    def _capture_loop(self):
        cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        fail_count = 0
        while self.is_running:
            ret, frame = cap.read()
            if not ret or frame is None:
                fail_count += 1
                self.is_connected = False
                if fail_count > 3:
                    # Retry reconnect after pause
                    time.sleep(2.0)
                    cap.release()
                    cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    fail_count = 0
                time.sleep(0.1)
                continue

            fail_count = 0
            self.is_connected = True

            with self.lock:
                self.latest_frame = frame

            # Auto shutdown worker if no client has watched this channel in 40 seconds
            if time.time() - self.last_access > 40:
                print(f"[DahuaPool] Stopping idle worker for CH-{self.channel_id}")
                break

            time.sleep(1.0 / 15.0)

        cap.release()
        self.is_running = False

    def get_frame(self) -> Optional[np.ndarray]:
        self.last_access = time.time()
        if not self.is_running:
            self.start()

        with self.lock:
            if self.latest_frame is not None:
                return self.latest_frame.copy()

        return None

class DahuaChannelPool:
    """
    Manages concurrent on-demand channel capture across all 16 channels.
    """
    def __init__(self):
        self.workers: Dict[int, DahuaChannelWorker] = {}
        self.lock = threading.Lock()

    def get_frame(self, channel_id: int) -> Optional[np.ndarray]:
        with self.lock:
            if channel_id not in self.workers:
                worker = DahuaChannelWorker(channel_id)
                worker.start()
                self.workers[channel_id] = worker
            worker = self.workers[channel_id]

        frame = worker.get_frame()
        if frame is not None:
            # Check if camera frame is pitch black (unplugged camera port)
            if frame.mean() < 5:
                return self._generate_no_signal_frame(channel_id, "NO SIGNAL (CAMERA OFF)")
            return frame

        # If waiting for first frame
        return self._generate_no_signal_frame(channel_id, f"CONNECTING TO CH-{channel_id}...")

    def _generate_no_signal_frame(self, channel_id: int, message: str) -> np.ndarray:
        """Generates a neat placeholder frame when a channel is disconnected or connecting."""
        placeholder = np.zeros((576, 960, 3), dtype=np.uint8)
        # Add subtle dark styling
        placeholder[:] = (20, 24, 30)
        cv2.putText(placeholder, f"CH-{channel_id:02d}", (380, 260),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.4, (80, 90, 110), 3)
        cv2.putText(placeholder, message, (310, 320),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (160, 170, 190), 2)
        return placeholder

# Global pool instance
dahua_pool = DahuaChannelPool()
