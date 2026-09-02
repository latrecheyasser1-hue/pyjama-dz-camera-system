"""
Pyjama DZ Camera & Surveillance System
Configuration Module
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# Supabase Settings
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "https://phfdqukhfvwuqeybnxsu.supabase.co")
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# Telegram Settings
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
TELEGRAM_ALERTS_CHANNEL_ID = os.getenv("TELEGRAM_ALERTS_CHANNEL_ID", "")

# Camera Stream URLs (Dahua RTSP or simulation)
RTSP_HANOUT_CAISSE = os.getenv("RTSP_HANOUT_CAISSE", "simulated://hanout_caisse")
RTSP_DEPOT_PACKING = os.getenv("RTSP_DEPOT_PACKING", "simulated://depot_packing")
RTSP_ATELIER_MACHINES = os.getenv("RTSP_ATELIER_MACHINES", "simulated://atelier_machines")

# AI & Detection Parameters
AI_CONFIDENCE_THRESHOLD = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.55"))
RING_BUFFER_SECONDS = int(os.getenv("RING_BUFFER_SECONDS", "30"))
CAISSE_UNATTENDED_THRESHOLD_SECONDS = int(os.getenv("CAISSE_UNATTENDED_THRESHOLD_SECONDS", "30"))
LOITERING_THRESHOLD_MINUTES = int(os.getenv("LOITERING_THRESHOLD_MINUTES", "15"))

# POS & Discount Audit Thresholds (in DZD)
ABNORMAL_DISCOUNT_THRESHOLD_DZD = float(os.getenv("ABNORMAL_DISCOUNT_THRESHOLD_DZD", "500.0"))
ABNORMAL_DISCOUNT_PERCENTAGE = float(os.getenv("ABNORMAL_DISCOUNT_PERCENTAGE", "20.0"))

# Local storage directories
CLIPS_DIR = ROOT_DIR / "storage" / "clips"
SNAPSHOTS_DIR = ROOT_DIR / "storage" / "snapshots"
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
