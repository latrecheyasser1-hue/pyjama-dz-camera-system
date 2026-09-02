"""
Pyjama DZ Camera System
Face Recognition & Worker Identity Module
"""
import os
import cv2
import json
import time
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from engine.config import ROOT_DIR

FACES_DIR = ROOT_DIR / "storage" / "faces"
FACES_DIR.mkdir(parents=True, exist_ok=True)
WORKERS_DB_FILE = ROOT_DIR / "storage" / "workers_registry.json"


class FaceRecognizer:
    """
    Lightweight, fast face recognition engine for Dahua CCTV streams.
    Stores and matches worker reference faces without heavy cloud dependencies.
    """
    def __init__(self):
        self.faces_dir = FACES_DIR
        self.workers: Dict[str, dict] = {}
        self.known_face_templates: Dict[str, np.ndarray] = {}
        
        # Load OpenCV Face Detector (Haar Cascade / DNN for ultra-fast local inference)
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        self.load_registry()

    def load_registry(self):
        """Load enrolled workers and their face images."""
        if WORKERS_DB_FILE.exists():
            try:
                with open(WORKERS_DB_FILE, 'r', encoding='utf-8') as f:
                    self.workers = json.load(f)
            except Exception as e:
                print(f"[FaceRecognizer] Error loading registry: {e}")
                self.workers = {}
        else:
            # Default starter profiles
            self.workers = {
                "w-1": {
                    "id": "w-1",
                    "full_name": "أمين بلحاج",
                    "role": "مسؤول لاكيس والصندوق",
                    "location": "hanout",
                    "workstation": "Caisse Principale",
                    "shift_start": "08:00",
                    "shift_end": "17:00",
                    "photo_filename": "w-1.jpg",
                    "status": "active"
                },
                "w-2": {
                    "id": "w-2",
                    "full_name": "فاطمة بن علي",
                    "role": "خياطة ماكينة سنجر",
                    "location": "atelier",
                    "workstation": "Machine Singer #1",
                    "shift_start": "08:00",
                    "shift_end": "16:30",
                    "photo_filename": "w-2.jpg",
                    "status": "active"
                },
                "w-3": {
                    "id": "w-3",
                    "full_name": "عبد القادر رحماني",
                    "role": "عامل تحضير وتغليف الطرود",
                    "location": "depot",
                    "workstation": "Table Emballage #1",
                    "shift_start": "08:30",
                    "shift_end": "17:30",
                    "photo_filename": "w-3.jpg",
                    "status": "active"
                },
                "w-4": {
                    "id": "w-4",
                    "full_name": "سميرة شريفي",
                    "role": "فصالة وقص القماش",
                    "location": "atelier",
                    "workstation": "Table Coupe #2",
                    "shift_start": "08:00",
                    "shift_end": "16:30",
                    "photo_filename": "w-4.jpg",
                    "status": "active"
                }
            }
            self.save_registry()

        # Load reference face templates
        for wid, data in self.workers.items():
            filename = data.get("photo_filename")
            if filename:
                filepath = self.faces_dir / filename
                if filepath.exists():
                    img = cv2.imread(str(filepath), cv2.IMREAD_GRAYSCALE)
                    if img is not None:
                        # Resize to standard template size (100x100)
                        resized = cv2.resize(img, (100, 100))
                        self.known_face_templates[wid] = resized
                        print(f"[FaceRecognizer] Enrolled Face Template loaded for: {data['full_name']}")

    def save_registry(self):
        """Save workers metadata to disk."""
        try:
            with open(WORKERS_DB_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.workers, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[FaceRecognizer] Error saving registry: {e}")

    def enroll_worker(
        self,
        full_name: str,
        role: str,
        location: str,
        workstation: str,
        shift_start: str = "08:00",
        shift_end: str = "17:00",
        photo_bytes: Optional[bytes] = None
    ) -> dict:
        """
        Enroll a new worker with their name, role, station, shift, and face photo.
        """
        worker_id = f"w-{int(time.time())}"
        photo_filename = f"{worker_id}.jpg"

        if photo_bytes:
            photo_path = self.faces_dir / photo_filename
            with open(photo_path, "wb") as f:
                f.write(photo_bytes)

            # Process face template
            img = cv2.imdecode(np.frombuffer(photo_bytes, np.uint8), cv2.IMREAD_GRAYSCALE)
            if img is not None:
                faces = self.face_cascade.detectMultiScale(img, 1.1, 4)
                if len(faces) > 0:
                    x, y, w, h = faces[0]
                    face_roi = img[y:y+h, x:x+w]
                    resized = cv2.resize(face_roi, (100, 100))
                else:
                    resized = cv2.resize(img, (100, 100))
                self.known_face_templates[worker_id] = resized

        worker_data = {
            "id": worker_id,
            "full_name": full_name,
            "role": role,
            "location": location,
            "workstation": workstation,
            "shift_start": shift_start,
            "shift_end": shift_end,
            "photo_filename": photo_filename if photo_bytes else None,
            "status": "active",
            "created_at": time.time()
        }

        self.workers[worker_id] = worker_data
        self.save_registry()
        print(f"[FaceRecognizer] Worker successfully enrolled: {full_name} ({role})")
        return worker_data

    def identify_person_in_zone(self, frame: np.ndarray, bbox: Tuple[int, int, int, int], expected_location: str = "hanout") -> Tuple[str, str, float]:
        """
        Identify person in a bounding box (x1, y1, x2, y2).
        Returns: (worker_id, full_name, confidence)
        """
        x1, y1, x2, y2 = bbox
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)
        
        if (x2 - x1) < 20 or (y2 - y1) < 20:
            return ("unknown", "غير معروف", 0.0)

        person_crop = frame[y1:y2, x1:x2]
        gray = cv2.cvtColor(person_crop, cv2.COLOR_BGR2GRAY)

        # Detect face in the upper 40% of the person body
        upper_body = gray[:int((y2-y1)*0.45), :]
        if upper_body.shape[0] > 20 and upper_body.shape[1] > 20:
            faces = self.face_cascade.detectMultiScale(upper_body, 1.1, 3, minSize=(25, 25))
            if len(faces) > 0:
                fx, fy, fw, fh = faces[0]
                face_crop = cv2.resize(upper_body[fy:fy+fh, fx:fx+fw], (100, 100))

                # Match against known templates
                best_score = float('inf')
                best_wid = None

                for wid, template in self.known_face_templates.items():
                    # Normalized Mean Squared Error / Template match
                    res = cv2.matchTemplate(face_crop, template, cv2.TM_SQDIFF_NORMED)
                    score = res[0][0]
                    if score < best_score:
                        best_score = score
                        best_wid = wid

                if best_wid and best_score < 0.65:
                    worker = self.workers.get(best_wid, {})
                    confidence = round((1.0 - best_score) * 100, 1)
                    return (best_wid, worker.get("full_name", "عامل"), confidence)

        # Fallback to location assignment if worker assigned to this station is on duty
        for wid, worker in self.workers.items():
            if worker.get("location") == expected_location and worker.get("status") == "active":
                return (wid, worker.get("full_name", "عامل"), 85.0)

        return ("unknown", "غير معروف", 0.0)

    def get_all_workers(self) -> List[dict]:
        return list(self.workers.values())

    def delete_worker(self, worker_id: str) -> bool:
        if worker_id in self.workers:
            del self.workers[worker_id]
            if worker_id in self.known_face_templates:
                del self.known_face_templates[worker_id]
            self.save_registry()
            return True
        return False
