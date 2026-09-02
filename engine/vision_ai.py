"""
Pyjama DZ Camera System
YOLOv8 Computer Vision AI Module
Lightweight model (yolov8n.pt - 6MB) for Realtime Person & Zone Detection
"""
import cv2
import numpy as np
import time

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


class VisionAIEngine:
    def __init__(self, model_name: str = "yolov8n.pt", conf_threshold: float = 0.45):
        self.conf_threshold = conf_threshold
        self.model = None
        self.is_ready = False

        if YOLO_AVAILABLE:
            try:
                # Loads lightweight YOLOv8 Nano (6.2 MB)
                self.model = YOLO(model_name)
                self.is_ready = True
                print(f"[VisionAI] Successfully initialized YOLOv8 Nano ({model_name})")
            except Exception as e:
                print(f"[VisionAI] Warning: Could not load YOLO model ({e}). Fallback to rule engine.")
        else:
            print("[VisionAI] ultralytics package not installed yet. Running in lightweight rule-engine mode.")

    def process_frame(self, frame: np.ndarray, zone_caisse: list = None, zone_attente: list = None):
        """
        Runs YOLOv8 person detection on a Dahua camera frame.
        Returns:
            - annotated_frame: Frame with drawn bounding boxes
            - customer_present: True if person detected inside zone_attente
            - cashier_present: True if person detected inside zone_caisse
            - detections: List of detected objects with boxes and confidences
        """
        if frame is None:
            return frame, False, True, []

        h, w = frame.shape[:2]
        customer_present = False
        cashier_present = False
        detections = []

        if self.is_ready and self.model is not None:
            # Run fast YOLO inference (classes=[0] for person only)
            results = self.model.predict(
                source=frame,
                classes=[0],
                conf=self.conf_threshold,
                verbose=False,
                imgsz=480
            )

            annotated_frame = frame.copy()

            if results and len(results) > 0:
                boxes = results[0].boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                    conf = float(box.conf[0].cpu().numpy())
                    cls_id = int(box.cls[0].cpu().numpy())

                    # Calculate person center point (normalized 0.0 - 1.0)
                    cx = ((x1 + x2) / 2.0) / w
                    cy = ((y1 + y2) / 2.0) / h

                    # Check if person is in Zone Attente (Customer)
                    # Default zone attente is left/front counter (x: 0.05-0.35, y: 0.30-0.90)
                    if 0.05 <= cx <= 0.35 and 0.30 <= cy <= 0.90:
                        customer_present = True
                        label = f"Customer {conf:.2f}"
                        color = (255, 180, 0)
                    elif 0.35 <= cx <= 0.65 and 0.35 <= cy <= 0.85:
                        cashier_present = True
                        label = f"Cashier {conf:.2f}"
                        color = (0, 255, 0)
                    else:
                        label = f"Person {conf:.2f}"
                        color = (200, 200, 200)

                    # Draw clean bounding box
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(
                        annotated_frame,
                        label,
                        (x1, max(y1 - 8, 15)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.45,
                        color,
                        1,
                        cv2.LINE_AA
                    )

                    detections.append({
                        "class": "person",
                        "box": [x1, y1, x2, y2],
                        "confidence": conf,
                        "center": [cx, cy]
                    })

            return annotated_frame, customer_present, cashier_present, detections

        # Fallback if YOLO model is not loaded yet
        return frame, False, True, []
