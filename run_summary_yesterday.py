import logging
from datetime import datetime, timedelta, timezone
from backend.db.database import get_session
from backend.pipeline.summarizer import generate_daily_summary

logging.basicConfig(level=logging.INFO)

with get_session() as s:
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date()
    generate_daily_summary(s, yesterday)
