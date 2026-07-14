"""
RSS Feed Fetcher — Phase 1 stub.

Fetches articles from all configured RSS feeds and normalises them
into a consistent internal dict schema.

Implementation will be completed in Phase 1.
"""

from __future__ import annotations

import calendar
import logging
import time
from datetime import datetime, timezone

import feedparser

logger = logging.getLogger("pipeline.fetcher")

# ── Public API ────────────────────────────────────────────────────────────────

def fetch_feed_with_retry(feed: dict, max_retries: int = 3) -> list[dict]:
    """Fetch a single feed with exponential backoff."""
    delay = 2
    for attempt in range(1, max_retries + 1):
        try:
            logger.info("Fetching %s (attempt %d/%d)...", feed["name"], attempt, max_retries)
            
            # Using a user-agent helps avoid getting blocked by some news sites
            agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            parsed = feedparser.parse(feed["url"], agent=agent)
            
            # Check for HTTP errors
            if hasattr(parsed, "status") and parsed.status >= 400:
                raise Exception(f"HTTP {parsed.status}")
                
            articles = []
            for entry in parsed.entries:
                published_at = parse_date(entry)
                # Some feeds might not have a description, default to empty string
                description = entry.get("summary", entry.get("description", ""))
                
                articles.append({
                    "title": entry.get("title", "").strip(),
                    "url": entry.get("link", "").strip(),
                    "description": description.strip(),
                    "published_at": published_at,
                    "source_name": feed["name"],
                })
            
            logger.info("Successfully fetched %d articles from %s", len(articles), feed["name"])
            return articles
            
        except Exception as e:
            logger.warning("Failed to fetch %s on attempt %d: %s", feed["name"], attempt, e)
            if attempt < max_retries:
                time.sleep(delay)
                delay *= 2
                
    logger.error("Giving up on %s after %d attempts.", feed["name"], max_retries)
    return []


def fetch_all_feeds(feed_list: list[dict]) -> list[dict]:
    """Fetch and normalise articles from every feed in *feed_list*.

    Returns a list of article dicts with keys:
        title, url, description, published_at, source_name
    """
    all_articles = []
    
    for feed in feed_list:
        articles = fetch_feed_with_retry(feed)
        all_articles.extend(articles)
        
    logger.info("Total fetched articles across all feeds: %d", len(all_articles))
    return all_articles


def parse_date(entry: dict) -> datetime | None:
    """Parse a date string from an RSS entry into a Python datetime.

    Handles multiple date formats used by different Indian news RSS sources.
    Returns None when the date cannot be parsed.
    """
    # feedparser attempts to parse dates automatically and stores it in 'published_parsed'
    if hasattr(entry, 'published_parsed') and entry.published_parsed:
        try:
            # feedparser.published_parsed is always UTC struct_time.
            # Use calendar.timegm() (NOT time.mktime()) to avoid local-timezone
            # corruption — mktime() would add IST +05:30 offset, shifting dates
            # by 5.5 hours and causing today's articles to appear as yesterday's.
            dt = datetime.fromtimestamp(calendar.timegm(entry.published_parsed), tz=timezone.utc)
            return dt
        except Exception:
            pass
            
    # Fallback: manual parsing from 'published' string if needed
    date_str = entry.get("published", entry.get("updated", ""))
    if not date_str:
        return datetime.now(timezone.utc)
        
    try:
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str)
        # Ensure it's tz-aware
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        # Final fallback
        return datetime.now(timezone.utc)
