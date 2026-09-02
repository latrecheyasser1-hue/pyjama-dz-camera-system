"""
Pyjama DZ Camera System
Ring Buffer for Pre/Post Event Video Clipping
"""
import time
import threading
from collections import deque
from typing import List, Tuple, Optional
import numpy as np

class RingBuffer:
    """
    Thread-safe Circular Buffer that keeps the last N seconds of video frames.
    Allows extracting clips with pre-roll (e.g. 10s before event) and post-roll.
    """
    def __init__(self, max_seconds: int = 30, fps: int = 15):
        self.max_seconds = max_seconds
        self.fps = fps
        self.max_frames = max_seconds * fps
        self.buffer = deque(maxlen=self.max_frames)
        self.lock = threading.Lock()

    def append(self, frame: np.ndarray, timestamp: Optional[float] = None, metadata: Optional[dict] = None):
        """Append a frame with its timestamp to the buffer."""
        if timestamp is None:
            timestamp = time.time()
        with self.lock:
            self.buffer.append({
                "frame": frame.copy(),
                "timestamp": timestamp,
                "metadata": metadata or {}
            })

    def get_latest_frame(self) -> Optional[np.ndarray]:
        """Get the most recent frame."""
        with self.lock:
            if not self.buffer:
                return None
            return self.buffer[-1]["frame"]

    def extract_clip_frames(self, start_timestamp: float, end_timestamp: float) -> List[dict]:
        """
        Extract all frames falling within [start_timestamp, end_timestamp].
        """
        with self.lock:
            if not self.buffer:
                return []
            
            selected = [
                item for item in self.buffer
                if start_timestamp <= item["timestamp"] <= end_timestamp
            ]
            
            # If buffer is slightly short, return all available up to end_timestamp
            if not selected:
                selected = list(self.buffer)
                
            return selected

    def clear(self):
        with self.lock:
            self.buffer.clear()

    def __len__(self):
        with self.lock:
            return len(self.buffer)
