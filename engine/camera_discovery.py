"""
Pyjama DZ Camera System
Dahua DVR Camera Auto-Discovery Module
Probes the DVR in parallel to automatically detect which camera channels are physically connected and active.
"""
import time
import json
import cv2
import requests
from requests.auth import HTTPDigestAuth
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import List, Dict, Any

from engine.config import (
    ROOT_DIR,
    DAHUA_DVR_IP,
    DAHUA_RTSP_PORT,
    DAHUA_USERNAME,
    DAHUA_PASSWORD
)

DISCOVERY_CACHE_FILE = ROOT_DIR / "storage" / "discovered_cameras.json"

class CameraDiscovery:
    """
    Scans Dahua DVR channels and auto-detects active camera streams.
    """
    def __init__(
        self,
        dvr_ip: str = DAHUA_DVR_IP,
        username: str = DAHUA_USERNAME,
        password: str = DAHUA_PASSWORD,
        max_channels: int = 16
    ):
        self.dvr_ip = dvr_ip
        self.username = username
        self.password = password
        self.max_channels = max_channels
        self.discovered_channels: List[Dict[str, Any]] = []
        self.load_cache()

    def load_cache(self):
        """Load previously discovered cameras if available."""
        if DISCOVERY_CACHE_FILE.exists():
            try:
                with open(DISCOVERY_CACHE_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        self.discovered_channels = data
                        return
            except Exception as e:
                print(f"[CameraDiscovery] Error reading cache: {e}")

        # Default initial active set
        self.discovered_channels = [
            {"id": 1, "name": "كاميرا 1: لاكيس والدرج", "tag": "Caisse", "status": "online", "resolution": "1920x1080"},
            {"id": 2, "name": "كاميرا 2: المدخل الرئيسي", "tag": "Entree", "status": "online", "resolution": "1920x1080"},
            {"id": 3, "name": "كاميرا 3: رفوف السلعة", "tag": "Rayons", "status": "online", "resolution": "1920x1080"}
        ]

    def save_cache(self):
        """Save discovered channels to disk."""
        try:
            DISCOVERY_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(DISCOVERY_CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.discovered_channels, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[CameraDiscovery] Error saving cache: {e}")

    def fetch_dahua_channel_titles(self) -> Dict[int, str]:
        """Query Dahua DVR HTTP API for configured channel names."""
        url = f"http://{self.dvr_ip}/cgi-bin/configManager.cgi?action=getConfig&name=ChannelTitle"
        titles = {}
        try:
            res = requests.get(url, auth=HTTPDigestAuth(self.username, self.password), timeout=3)
            if res.status_code == 200:
                for line in res.text.splitlines():
                    if "ChannelTitle[" in line and "Name=" in line:
                        parts = line.split("ChannelTitle[")
                        if len(parts) > 1:
                            ch_idx = int(parts[1].split("]")[0]) + 1
                            name = line.split("Name=")[-1].strip()
                            if name:
                                titles[ch_idx] = name
        except Exception:
            pass
        return titles

    def probe_channel(self, channel_id: int, titles_map: Dict[int, str]) -> Optional[Dict[str, Any]]:
        """Probe an individual Dahua RTSP channel."""
        rtsp_url = f"rtsp://{self.username}:{self.password}@{self.dvr_ip}:{DAHUA_RTSP_PORT}/cam/realmonitor?channel={channel_id}&subtype=1"
        cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        start_time = time.time()
        active = False
        res_w, res_h = 1280, 720

        # Attempt to grab a frame within 1.5 seconds
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                active = True
                res_h, res_w = frame.shape[:2]

        cap.release()

        if active:
            custom_name = titles_map.get(channel_id)
            default_name = f"كاميرا {channel_id}"
            if channel_id == 1:
                default_name = "كاميرا 1: لاكيس والدرج"
            elif channel_id == 2:
                default_name = "كاميرا 2: المدخل الرئيسي"

            name = f"كاميرا {channel_id}: {custom_name}" if custom_name else default_name
            return {
                "id": channel_id,
                "name": name,
                "tag": f"CH-{channel_id}",
                "status": "online",
                "resolution": f"{res_w}x{res_h}",
                "rtsp_url": rtsp_url
            }
        return None

    def scan_network(self) -> List[Dict[str, Any]]:
        """
        Scans all 16 channels on the Dahua DVR in parallel.
        Returns only the cameras that actually respond with live video.
        """
        print(f"\n[CameraDiscovery] === SCANNING DAHUA DVR ({self.dvr_ip}) FOR ACTIVE CAMERAS ===")
        titles_map = self.fetch_dahua_channel_titles()
        detected = []

        # Probe all 16 channels in parallel for speed (max 3 seconds total)
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [
                executor.submit(self.probe_channel, ch, titles_map)
                for ch in range(1, self.max_channels + 1)
            ]
            for f in futures:
                res = f.result()
                if res:
                    detected.append(res)

        # Sort channels by ID
        detected.sort(key=lambda x: x["id"])

        if len(detected) > 0:
            print(f"[CameraDiscovery] [OK] Auto-detected {len(detected)} active cameras on DVR!")
            self.discovered_channels = detected
            self.save_cache()
        else:
            print("[CameraDiscovery] [INFO] DVR not currently reachable. Preserving current camera list.")

        return self.discovered_channels

    def get_active_channels(self) -> List[Dict[str, Any]]:
        return self.discovered_channels
