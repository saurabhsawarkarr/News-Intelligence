import logging
from datetime import datetime, timezone
from backend.db.database import get_session
from backend.pipeline.summarizer import generate_daily_summary

logging.basicConfig(level=logging.INFO)

with get_session() as s:
    generate_daily_summary(s, datetime.now(timezone.utc).date())
