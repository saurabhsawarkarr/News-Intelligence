"""
Central configuration module.

Loads environment variables from .env (for local dev) and exposes them
as typed constants used across the backend.
"""

import os
from dotenv import load_dotenv

# Load .env file when running locally (no-op in CI/production where vars are injected)
load_dotenv()

# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL: str = os.environ["DATABASE_URL"]

# ─── Groq LLM ─────────────────────────────────────────────────────────────────
GROQ_API_KEY: str = os.environ["GROQ_API_KEY"]

# ─── RSS Feed Sources ─────────────────────────────────────────────────────────
RSS_FEEDS: list[dict] = [
    {"name": "Moneycontrol",               "url": "https://www.moneycontrol.com/rss/latestnews.xml"},
    {"name": "Moneycontrol Markets",       "url": "https://www.moneycontrol.com/rss/marketreports.xml"},
    {"name": "Economic Times Markets",     "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"},
    {"name": "Economic Times Economy",     "url": "https://economictimes.indiatimes.com/economy/rssfeeds/1373380680.cms"},
    {"name": "LiveMint Markets",           "url": "https://www.livemint.com/rss/markets"},
    {"name": "Business Standard Markets", "url": "https://www.business-standard.com/rss/markets-106.rss"},
    {"name": "Business Standard Economy", "url": "https://www.business-standard.com/rss/economy-policy-102.rss"},
    {"name": "Financial Express Markets", "url": "https://www.financialexpress.com/market/feed/"},
    {"name": "NDTV Profit",               "url": "https://feeds.feedburner.com/ndtvprofit-latest"},
]

# ─── Pipeline settings ────────────────────────────────────────────────────────
# Groq free tier: 30 requests/minute → pause every 25 requests
GROQ_RATE_LIMIT_BATCH: int = 25
GROQ_RATE_LIMIT_SLEEP: float = 2.0   # seconds

# Deduplication thresholds
FUZZY_TITLE_THRESHOLD: int = 85        # RapidFuzz token_sort_ratio (0–100)
SEMANTIC_SIM_THRESHOLD: float = 0.92  # cosine similarity (0–1)
SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"

# Groq model
GROQ_MODEL: str = "llama-3.1-8b-instant"
GROQ_MAX_TOKENS: int = 512
GROQ_TEMPERATURE: float = 0.2
