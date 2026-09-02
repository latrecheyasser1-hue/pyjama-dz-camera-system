"""
Pyjama DZ Camera System
Stream Manager (Dahua RTSP & Realistic Simulation Engine)
"""
import cv2
import time
import math
import random
import threading
import numpy as np
from typing import Optional, Dict
from engine.ring_buffer import RingBuffer

class StreamManager:
    """
    Manages live camera video streams from Dahua RTSP or realistic simulated feeds.
    Continuously buffers frames into a RingBuffer.
    """
    def __init__(self, camera_id: str, stream_url: str, location: str = "hanout", fps: int = 15):
        self.camera_id = camera_id
        self.stream_url = stream_url
        self.location = location
        self.fps = fps
        self.ring_buffer = RingBuffer(max_seconds=30, fps=fps)
        self.is_running = False
        self.thread: Optional[threading.Thread] = None
        self.sim_state = {
            "time_step": 0,
            "drawer_open": False,
            "customer_present": False,
            "cashier_present": True,
            "cashier_x": 0.50,
            "cashier_y": 0.60,
            "customer_x": 0.18,
            "customer_y": 0.65,
            "drawer_timer": 0,
            "sim_scenario": "normal" # "normal", "theft_no_customer", "unattended_drawer", "large_discount"
        }

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        print(f"[StreamManager] Started camera capture stream for '{self.camera_id}' ({self.stream_url})")

    def stop(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)
        print(f"[StreamManager] Stopped camera capture stream for '{self.camera_id}'")

    def _capture_loop(self):
        is_simulation = self.stream_url.startswith("simulated://") or "simulated" in self.stream_url

        if is_simulation:
            self._simulation_loop()
        else:
            self._rtsp_loop()

    def _rtsp_loop(self):
        cap = cv2.VideoCapture(self.stream_url, cv2.CAP_FFMPEG)
        # Low latency RTSP buffer
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        while self.is_running:
            ret, frame = cap.read()
            if not ret:
                print(f"[StreamManager] RTSP stream disconnected for {self.camera_id}, retrying in 3s...")
                time.sleep(3)
                cap.release()
                cap = cv2.VideoCapture(self.stream_url, cv2.CAP_FFMPEG)
                continue

            # Resize to standard 720p or 640x360 for fast AI processing if needed
            h, w = frame.shape[:2]
            if w > 1280:
                frame = cv2.resize(frame, (1280, 720))

            self.ring_buffer.append(frame, timestamp=time.time())
            time.sleep(1.0 / self.fps)

        cap.release()

    def _simulation_loop(self):
        """
        Generates a realistic surveillance video frame for testing and demonstration.
        Simulates: Cash register counter, cashier movement, customer arrivals, drawer openings.
        """
        width, height = 1280, 720

        while self.is_running:
            self.sim_state["time_step"] += 1
            t = self.sim_state["time_step"]

            # Scenario rotation for demonstration
            cycle = t % 600 # 600 frames at 15 FPS = 40 seconds cycle
            if 50 <= cycle < 180:
                # Customer present, normal sale, drawer open with customer
                self.sim_state["customer_present"] = True
                self.sim_state["cashier_present"] = True
                self.sim_state["drawer_open"] = (100 <= cycle <= 150)
                self.sim_state["sim_scenario"] = "normal_sale"
            elif 240 <= cycle < 350:
                # Suspicious: Drawer open WITHOUT customer present!
                self.sim_state["customer_present"] = False
                self.sim_state["cashier_present"] = True
                self.sim_state["drawer_open"] = (260 <= cycle <= 330)
                self.sim_state["sim_scenario"] = "theft_no_customer"
            elif 400 <= cycle < 520:
                # Cashier left caisse open and walked away!
                self.sim_state["customer_present"] = False
                self.sim_state["cashier_present"] = False # Cashier stepped away
                self.sim_state["drawer_open"] = True
                self.sim_state["sim_scenario"] = "unattended_caisse"
            else:
                self.sim_state["customer_present"] = False
                self.sim_state["cashier_present"] = True
                self.sim_state["drawer_open"] = False
                self.sim_state["sim_scenario"] = "idle"

            # Create base room background
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            # Wall color (Sleek store interior)
            frame[:] = (35, 38, 45) # Dark slate store wall
            # Floor color
            cv2.rectangle(frame, (0, 300), (width, height), (55, 60, 70), -1)

            # Store shelves in background with pyjama merchandise
            for shelf_y in [120, 180, 240]:
                cv2.rectangle(frame, (100, shelf_y), (width - 100, shelf_y + 12), (90, 80, 70), -1)
                for item_x in range(120, width - 120, 60):
                    color = [(180, 100, 80), (80, 120, 180), (140, 80, 160), (100, 160, 120)][(item_x // 60) % 4]
                    cv2.rectangle(frame, (item_x, shelf_y - 35), (item_x + 45, shelf_y), color, -1)

            # Cashier Counter (Le Comptoir)
            cv2.rectangle(frame, (400, 380), (880, 660), (45, 45, 55), -1)
            cv2.rectangle(frame, (400, 380), (880, 420), (70, 70, 85), -1) # Countertop
            cv2.putText(frame, "PYJAMA DZ - COMPTOIR CAISSE", (430, 410),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 220), 2)

            # POS Screen on Counter
            cv2.rectangle(frame, (480, 320), (580, 380), (25, 25, 30), -1)
            cv2.rectangle(frame, (490, 330), (570, 370), (10, 80, 160), -1) # POS Blue Screen
            cv2.putText(frame, "POS", (510, 355), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            # Cash Drawer (Tiroir Caisse)
            drawer_color = (0, 180, 0) if not self.sim_state["drawer_open"] else (0, 80, 255) # Red if open
            if self.sim_state["drawer_open"]:
                # Open Drawer extended forward
                cv2.rectangle(frame, (620, 420), (780, 520), (30, 30, 35), -1)
                cv2.rectangle(frame, (620, 420), (780, 520), drawer_color, 3)
                # Compartments
                cv2.rectangle(frame, (630, 430), (690, 470), (40, 120, 40), -1) # Cash bills
                cv2.rectangle(frame, (700, 430), (760, 470), (140, 120, 40), -1)
                cv2.putText(frame, "DRAWER OPEN", (635, 505), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
            else:
                # Closed Drawer flush with counter
                cv2.rectangle(frame, (620, 420), (780, 460), (30, 30, 35), -1)
                cv2.rectangle(frame, (620, 420), (780, 460), (100, 100, 110), 2)
                cv2.putText(frame, "DRAWER CLOSED", (630, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1)

            # Draw Cashier (behind counter)
            if self.sim_state["cashier_present"]:
                cx = 650 + int(math.sin(t * 0.05) * 15)
                cy = 310
                # Head
                cv2.circle(frame, (cx, cy), 35, (210, 180, 160), -1)
                # Body / Uniform (Pyjama DZ Black/Gold)
                cv2.rectangle(frame, (cx - 50, cy + 35), (cx + 50, 420), (30, 30, 40), -1)
                cv2.putText(frame, "CASHIER", (cx - 35, cy - 45), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 120), 2)

                # Hands when operating drawer
                if self.sim_state["drawer_open"]:
                    hand_x = cx + int(math.sin(t * 0.1) * 25)
                    hand_y = 440
                    cv2.circle(frame, (hand_x, hand_y), 15, (210, 180, 160), -1)
            else:
                # Empty Cashier Chair
                cv2.putText(frame, "[CASHIER AWAY - UNATTENDED]", (540, 310),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2)

            # Draw Customer (in front of counter)
            if self.sim_state["customer_present"]:
                cust_x = 220 + int(math.sin(t * 0.03) * 10)
                cust_y = 460
                # Customer Head & Body
                cv2.circle(frame, (cust_x, cust_y - 60), 32, (200, 170, 150), -1)
                cv2.rectangle(frame, (cust_x - 45, cust_y - 25), (cust_x + 45, 620), (70, 90, 140), -1)
                cv2.putText(frame, "CUSTOMER", (cust_x - 40, cust_y - 100), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 200, 0), 2)

            # Live camera HUD info
            timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(frame, f"CAM: {self.camera_id.upper()} | {timestamp_str} | 15.0 FPS",
                        (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            self.ring_buffer.append(
                frame,
                timestamp=time.time(),
                metadata=self.sim_state.copy()
            )
            time.sleep(1.0 / self.fps)

    def get_latest_frame(self) -> Optional[np.ndarray]:
        return self.ring_buffer.get_latest_frame()

    def get_state(self) -> Dict:
        return self.sim_state.copy()
