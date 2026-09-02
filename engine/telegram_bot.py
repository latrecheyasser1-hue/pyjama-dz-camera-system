"""
Pyjama DZ Camera System
Telegram Bot Alert Service
"""
import os
import requests
from pathlib import Path
from typing import Optional
from engine.config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_ALERTS_CHANNEL_ID

class TelegramNotifier:
    """
    Handles immediate dispatch of video clips and daily summaries to Telegram.
    """
    def __init__(self, bot_token: Optional[str] = None, chat_id: Optional[str] = None):
        self.bot_token = bot_token or TELEGRAM_BOT_TOKEN
        self.chat_id = chat_id or TELEGRAM_CHAT_ID or TELEGRAM_ALERTS_CHANNEL_ID
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None

    def is_configured(self) -> bool:
        return bool(self.bot_token and self.chat_id)

    def send_message(self, text: str) -> Optional[dict]:
        if not self.is_configured():
            print(f"[TelegramMock] Message (Not sent - token missing):\n{text}")
            return {"mock": True, "ok": True}

        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        try:
            res = requests.post(url, json=payload, timeout=10)
            data = res.json()
            if data.get("ok"):
                print(f"[Telegram] Sent message successfully: message_id={data['result']['message_id']}")
                return data["result"]
            else:
                print(f"[Telegram Error] {data.get('description')}")
                return None
        except Exception as e:
            print(f"[Telegram Exception] {e}")
            return None

    def send_video_alert(
        self,
        video_path: str,
        title: str,
        location: str,
        event_type: str,
        details: str,
        duration_seconds: int = 0
    ) -> Optional[dict]:
        caption = (
            f"🚨 <b>تنبيه أمني ذكي - Pyjama DZ</b> 🚨\n\n"
            f"📍 <b>الموقع:</b> {location.upper()}\n"
            f"⚠️ <b>نوع الحدث:</b> {title}\n"
            f"⏱️ <b>المدة:</b> {duration_seconds} ثانية\n"
            f"📝 <b>التفاصيل:</b> {details}\n\n"
            f"📹 <i>المقطع التوثيقي مرفق أدناه (تخزين سحابي مجاني)</i>"
        )

        if not self.is_configured():
            print(f"[TelegramMock] Video Alert (Not sent - token missing):\n{caption}\nVideo: {video_path}")
            return {"mock": True, "ok": True, "message_id": 9999}

        if not os.path.exists(video_path):
            print(f"[Telegram Error] Video file not found: {video_path}")
            return self.send_message(caption)

        url = f"{self.base_url}/sendVideo"
        try:
            with open(video_path, "rb") as video_file:
                files = {"video": video_file}
                data = {
                    "chat_id": self.chat_id,
                    "caption": caption,
                    "parse_mode": "HTML",
                    "supports_streaming": True
                }
                res = requests.post(url, data=data, files=files, timeout=45)
                res_data = res.json()
                if res_data.get("ok"):
                    msg_id = res_data["result"]["message_id"]
                    print(f"[Telegram] Security Video Clip sent successfully! message_id={msg_id}")
                    return res_data["result"]
                else:
                    print(f"[Telegram Error] {res_data.get('description')}")
                    return None
        except Exception as e:
            print(f"[Telegram Exception] {e}")
            return None

    def send_daily_summary(self, location: str, summary_markdown: str, date_str: str) -> Optional[dict]:
        header = f"📊 <b>تقرير منتصف الليل (00:00) - Pyjama DZ</b>\n📅 <b>التاريخ:</b> {date_str}\n📍 <b>الفرع:</b> {location.upper()}\n\n"
        full_text = header + summary_markdown
        return self.send_message(full_text)
