"""
Pyjama DZ Camera System
Caisse Detector & Security Rules Engine
"""
import time
from datetime import datetime
from typing import Dict, Any, Optional
from engine.stream_manager import StreamManager
from engine.video_clipper import VideoClipper
from engine.telegram_bot import TelegramNotifier
from engine.supabase_sync import SupabaseSync
from engine.config import (
    CAISSE_UNATTENDED_THRESHOLD_SECONDS,
    ABNORMAL_DISCOUNT_THRESHOLD_DZD,
    ABNORMAL_DISCOUNT_PERCENTAGE
)

class CaisseDetector:
    """
    Analyzes live camera frames from the Hanout / Caisse camera.
    Monitors drawer state, customer presence, unattended cash box, and POS events.
    """
    def __init__(self, stream_manager: StreamManager, supabase_sync: SupabaseSync, telegram_notifier: TelegramNotifier):
        self.stream = stream_manager
        self.supabase = supabase_sync
        self.telegram = telegram_notifier

        # State tracking
        self.drawer_was_open = False
        self.drawer_open_start_time: Optional[float] = None
        self.unattended_alert_triggered = False
        self.last_event_time = 0
        self.cooldown_seconds = 15 # Prevent alert spamming

    def process_step(self):
        state = self.stream.get_state()
        current_time = time.time()

        drawer_is_open = state.get("drawer_open", False)
        customer_present = state.get("customer_present", False)
        cashier_present = state.get("cashier_present", True)
        scenario = state.get("sim_scenario", "normal")

        # -------------------------------------------------------------
        # 1. Detect NEW Drawer Opening
        # -------------------------------------------------------------
        if drawer_is_open and not self.drawer_was_open:
            self.drawer_was_open = True
            self.drawer_open_start_time = current_time
            self.unattended_alert_triggered = False
            print(f"[CaisseDetector] Cash Drawer Opened (Customer: {customer_present}, Cashier: {cashier_present})")

            # Check Rule 1: Drawer opened with NO CUSTOMER present
            if not customer_present and (current_time - self.last_event_time > self.cooldown_seconds):
                self._trigger_no_customer_drawer_alert(current_time)

        # -------------------------------------------------------------
        # 2. Check Unattended Open Drawer (Left open > 30s)
        # -------------------------------------------------------------
        if drawer_is_open and self.drawer_open_start_time:
            elapsed = current_time - self.drawer_open_start_time
            if elapsed >= CAISSE_UNATTENDED_THRESHOLD_SECONDS and not self.unattended_alert_triggered:
                if not cashier_present or not customer_present:
                    self.unattended_alert_triggered = True
                    self._trigger_unattended_caisse_alert(current_time, int(elapsed))

        # -------------------------------------------------------------
        # 3. Detect Drawer Closing
        # -------------------------------------------------------------
        if not drawer_is_open and self.drawer_was_open:
            open_duration = int(current_time - (self.drawer_open_start_time or current_time))
            self.drawer_was_open = False
            self.drawer_open_start_time = None
            self.unattended_alert_triggered = False
            print(f"[CaisseDetector] Cash Drawer Closed (Was open for {open_duration}s)")

    def handle_pos_discount_event(self, original_price: float, paid_price: float, discount_amount: float, ticket_id: str):
        """
        Triggered when POS software logs a large/abnormal discount.
        """
        discount_percent = (discount_amount / original_price) * 100 if original_price > 0 else 0
        if discount_amount >= ABNORMAL_DISCOUNT_THRESHOLD_DZD or discount_percent >= ABNORMAL_DISCOUNT_PERCENTAGE:
            current_time = time.time()
            title = f"تخفيض استثنائي كبير ({int(discount_amount)} دج / {int(discount_percent)}%)"
            details = f"رقم التذكرة: #{ticket_id} | المبلغ الأصلي: {int(original_price)} دج | المدفوع: {int(paid_price)} دج | التخفيض: {int(discount_amount)} دج"

            print(f"[CaisseDetector] ABNORMAL DISCOUNT DETECTED: {title}")
            self._record_and_dispatch_event(
                event_type="suspicious_reach",
                title=title,
                details=details,
                severity="warning",
                duration_seconds=15,
                event_timestamp=current_time
            )

    def _trigger_no_customer_drawer_alert(self, event_time: float):
        self.last_event_time = event_time
        title = "فتح درج النقود بدون وجود زبون (No Customer)"
        details = "تم فتح درج النقود (La Caisse) في غياب أي زبون أمام الكونتوار. حركة مشبوهة تتطلب المراجعة."
        print(f"[CaisseDetector] TRIGGERED: {title}")

        self._record_and_dispatch_event(
            event_type="caisse_unattended",
            title=title,
            details=details,
            severity="critical",
            duration_seconds=10,
            event_timestamp=event_time
        )

    def _trigger_unattended_caisse_alert(self, event_time: float, elapsed_seconds: int):
        self.last_event_time = event_time
        title = f"ترك لاكيس مفتوحة وبدون حراسة ({elapsed_seconds} ثانية)"
        details = f"درج النقود ترك مفتوحاً لأكثر من {elapsed_seconds} ثانية دون وجود المسؤول عند الكونتوار."
        print(f"[CaisseDetector] TRIGGERED: {title}")

        self._record_and_dispatch_event(
            event_type="caisse_unattended",
            title=title,
            details=details,
            severity="critical",
            duration_seconds=elapsed_seconds,
            event_timestamp=event_time
        )

    def _record_and_dispatch_event(
        self,
        event_type: str,
        title: str,
        details: str,
        severity: str,
        duration_seconds: int,
        event_timestamp: float
    ):
        # 1. Extract frames from buffer (-10s to +5s)
        start_ts = event_timestamp - 10.0
        end_ts = event_timestamp + 5.0
        frames_data = self.stream.ring_buffer.extract_clip_frames(start_ts, end_ts)

        # 2. Create MP4 Video Clip
        clip_path = VideoClipper.create_clip(
            frames_data=frames_data,
            event_type=event_type,
            title=title,
            location="hanout"
        )

        # 3. Dispatch to Telegram
        tg_res = None
        if clip_path:
            tg_res = self.telegram.send_video_alert(
                video_path=clip_path,
                title=title,
                location="hanout",
                event_type=event_type,
                details=details,
                duration_seconds=duration_seconds
            )

        tg_msg_id = tg_res.get("message_id") if tg_res else None

        # 4. Save Record in Supabase
        self.supabase.record_security_event(
            camera_id=self.stream.camera_id,
            location="hanout",
            event_type=event_type,
            title=title,
            description=details,
            start_time=datetime.fromtimestamp(event_timestamp),
            end_time=datetime.now(),
            duration_seconds=duration_seconds,
            severity=severity,
            telegram_sent=bool(tg_res),
            telegram_message_id=str(tg_msg_id) if tg_msg_id else None,
            local_clip_path=clip_path
        )
