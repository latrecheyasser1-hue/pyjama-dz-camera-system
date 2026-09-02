"""
Pyjama DZ Camera System
Video Clipper Module (H.264 MP4 Generator for Web & Telegram)
"""
import os
import cv2
import time
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from engine.config import CLIPS_DIR

try:
    import imageio
    IMAGEIO_AVAILABLE = True
except ImportError:
    IMAGEIO_AVAILABLE = False


class VideoClipper:
    """
    Creates lightweight H.264 MP4 video clips from frame buffers
    compatible with HTML5 web browsers and Telegram.
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
        first_frame = frames_data[0]["frame"]
        height, width = first_frame.shape[:2]

        processed_rgb_frames = []

        for item in frames_data:
            frame = item["frame"].copy()
            frame_ts = item["timestamp"]
            ts_str = datetime.fromtimestamp(frame_ts).strftime("%Y-%m-%d %H:%M:%S")

            # Draw top security alert banner
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (width, 45), (15, 23, 42), -1)
            cv2.rectangle(overlay, (0, 0), (8, 45), (0, 0, 230), -1)
            cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)

            # Draw clean brand badge
            cv2.putText(frame, "PYJAMA DZ AI GUARD", (20, 20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 215, 0), 2, cv2.LINE_AA)

            # Event Title
            cv2.putText(frame, f"ALERT: {title[:45]}", (20, 38),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (240, 240, 240), 1, cv2.LINE_AA)

            # Timestamp on right
            cv2.putText(frame, ts_str, (width - 190, 28),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

            # Convert BGR to RGB for standard H.264 video encoding
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            processed_rgb_frames.append(rgb_frame)

        # Write standard H.264 video with imageio-ffmpeg for 100% browser compatibility
        if IMAGEIO_AVAILABLE:
            try:
                writer = imageio.get_writer(
                    str(output_path),
                    fps=fps,
                    codec='libx264',
                    quality=8,
                    pixelformat='yuv420p',
                    macro_block_size=None
                )
                for f in processed_rgb_frames:
                    writer.append_data(f)
                writer.close()
                print(f"[VideoClipper] Saved browser-compatible H.264 clip: {output_path} ({len(processed_rgb_frames)} frames)")
                return str(output_path)
            except Exception as e:
                print(f"[VideoClipper] imageio encoding error: {e}. Falling back to OpenCV writer.")

        # Fallback OpenCV writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
        for item in frames_data:
            out.write(item["frame"])
        out.release()
        print(f"[VideoClipper] Saved fallback clip: {output_path}")
        return str(output_path)
