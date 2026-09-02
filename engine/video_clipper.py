"""
Pyjama DZ Camera System
Video Clipper Module (MP4 Generator with Overlays)
"""
import os
import cv2
import time
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from engine.config import CLIPS_DIR

class VideoClipper:
    """
    Creates lightweight MP4 video clips from frame buffers
    with professional security overlays (Watermark, Timecode, Alert Tag).
    """
    @staticmethod
    def create_clip(
        frames_data: List[dict],
        event_type: str,
        title: str,
        location: str = "hanout",
        output_filename: Optional[str] = None,
        fps: int = 15
    ) -> Optional[str]:
        if not frames_data:
            print("[VideoClipper] Warning: No frames provided for clip creation.")
            return None

        if not output_filename:
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"{location}_{event_type}_{timestamp_str}.mp4"

        output_path = CLIPS_DIR / output_filename

        # Get frame dimensions
        first_frame = frames_data[0]["frame"]
        height, width = first_frame.shape[:2]

        # Use MP4V or H264 codec
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

        if not out.isOpened():
            # Fallback codec
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

        for item in frames_data:
            frame = item["frame"].copy()
            frame_ts = item["timestamp"]
            ts_str = datetime.fromtimestamp(frame_ts).strftime("%Y-%m-%d %H:%M:%S")

            # Draw top alert banner
            # Semi-transparent red/amber banner at the top
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (width, 50), (20, 20, 30), -1)
            cv2.rectangle(overlay, (0, 0), (12, 50), (0, 0, 255), -1) # Red indicator bar
            cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

            # Draw text banner
            # Pyjama DZ Brand Badge
            cv2.putText(frame, "PYJAMA DZ AI GUARD", (25, 22),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 215, 0), 2, cv2.LINE_AA)
            
            # Event Title
            cv2.putText(frame, f"ALERT: {title[:40]}", (25, 42),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1, cv2.LINE_AA)

            # Timestamp on top right
            cv2.putText(frame, ts_str, (width - 200, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

            out.write(frame)

        out.release()
        print(f"[VideoClipper] Successfully saved security clip: {output_path} ({len(frames_data)} frames)")
        return str(output_path)
