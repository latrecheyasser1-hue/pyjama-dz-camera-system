"""
Pyjama DZ Camera System
Supabase Cloud Synchronization Service
"""
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from engine.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY

class SupabaseSync:
    """
    Handles realtime syncing of security events, camera health, and metrics with Supabase.
    """
    def __init__(self):
        key = SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY
        if SUPABASE_URL and key:
            try:
                self.client: Optional[Client] = create_client(SUPABASE_URL, key)
                print(f"[SupabaseSync] Connected to {SUPABASE_URL}")
            except Exception as e:
                print(f"[SupabaseSync Warning] Failed to initialize client: {e}")
                self.client = None
        else:
            self.client = None
            print("[SupabaseSync Warning] Supabase credentials missing in config.")

    def record_security_event(
        self,
        camera_id: str,
        location: str,
        event_type: str,
        title: str,
        description: str,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        duration_seconds: int = 0,
        severity: str = "warning",
        worker_tags: Optional[List[str]] = None,
        telegram_sent: bool = False,
        telegram_message_id: Optional[str] = None,
        telegram_video_url: Optional[str] = None,
        local_clip_path: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if not self.client:
            print(f"[SupabaseMock] Recorded event: {title} ({event_type})")
            return {"id": "mock-event-id", "title": title}

        payload = {
            "camera_id": camera_id,
            "location": location,
            "event_type": event_type,
            "severity": severity,
            "title": title,
            "description": description,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat() if end_time else None,
            "duration_seconds": duration_seconds,
            "worker_tags": worker_tags or [],
            "telegram_sent": telegram_sent,
            "telegram_message_id": str(telegram_message_id) if telegram_message_id else None,
            "telegram_video_url": telegram_video_url,
            "local_clip_path": local_clip_path,
            "resolved": False
        }

        try:
            res = self.client.table("security_events").insert(payload).execute()
            if res.data:
                print(f"[SupabaseSync] Successfully logged event in database: ID={res.data[0]['id']}")
                return res.data[0]
            return None
        except Exception as e:
            print(f"[SupabaseSync Error] Failed to insert security event: {e}")
            return None

    def get_camera_zones(self, camera_id: str) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            res = self.client.table("camera_zones").select("*").eq("camera_id", camera_id).eq("is_active", True).execute()
            return res.data or []
        except Exception as e:
            print(f"[SupabaseSync Error] Failed to fetch camera zones: {e}")
            return []

    def update_camera_heartbeat(self, camera_id: str, status: str = "online", fps: int = 15):
        if not self.client:
            return
        try:
            self.client.table("cameras").update({
                "status": status,
                "fps": fps,
                "last_heartbeat": datetime.now().isoformat()
            }).eq("id", camera_id).execute()
        except Exception as e:
            print(f"[SupabaseSync Error] Failed to update camera heartbeat: {e}")
