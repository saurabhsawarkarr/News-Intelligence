"""
Pipeline entry point — orchestrates the full pipeline:
    fetch → filter → deduplicate → analyze → store

Called by GitHub Actions every hour, or locally via:
    python -m backend.pipeline.run
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("pipeline.run")


def main() -> None:
    start = datetime.now(timezone.utc)
    logger.info("═══════════════════════════════════════")
    logger.info("News Intelligence Pipeline starting…")
    logger.info("Start time: %s", start.isoformat())

    from backend.db.database import init_db
    init_db()

    # ── Phase 1: Fetch ─────────────────────────────────────────────────────
    from backend.pipeline.fetcher import fetch_all_feeds
    from backend.config import RSS_FEEDS
    raw_articles = fetch_all_feeds(RSS_FEEDS)
    logger.info("Fetched %d raw articles", len(raw_articles))

    # ── Phase 2A: Filter ───────────────────────────────────────────────────
    from backend.pipeline.filter import filter_articles
    filtered = filter_articles(raw_articles)
    logger.info("After content filter: %d articles", len(filtered))

    # ── Phase 2B: Deduplicate ─────────────────────────────────────────────
    from backend.db.database import get_session, get_existing_urls, get_unanalyzed
    
    with get_session() as db:
        existing_urls = get_existing_urls(db)
        
    from backend.pipeline.deduplicator import deduplicate
    unique = deduplicate(filtered, existing_urls=existing_urls)
    logger.info("After deduplication: %d unique articles", len(unique))

    # Fetch some previously unanalyzed articles to retry
    with get_session() as db:
        unanalyzed_db = get_unanalyzed(db)
        # Limit to 30 to avoid hitting limits immediately
        unanalyzed_db = unanalyzed_db[:30] 
        
        unanalyzed_dicts = []
        for a in unanalyzed_db:
            unanalyzed_dicts.append({
                "id": a.id,
                "title": a.canonical_title,
                "description": a.canonical_title, 
                "url": a.sources[0].url if a.sources else "",
                "is_from_db": True
            })
            
    if not unique and not unanalyzed_dicts:
        logger.info("No new or unanalyzed articles to process. Exiting pipeline.")
        return

    # ── Phase 3: AI Analysis ───────────────────────────────────────────────
    from backend.pipeline.analyzer import analyze_batch
    combined_batch = unique + unanalyzed_dicts
    analyzed = analyze_batch(combined_batch)
    logger.info("AI analysis complete: %d articles enriched", len(analyzed))

    # ── Phase 4: Store ─────────────────────────────────────────────────────
    from backend.db.database import save_article, save_analysis
    with get_session() as db:
        saved_count = 0
        updated_count = 0
        for article in analyzed:
            try:
                if article.get("is_from_db"):
                    if article.get("is_analyzed") and "sentiment" in article:
                        save_analysis(db, article["id"], article)
                        updated_count += 1
                else:
                    save_article(db, article)
                    saved_count += 1
            except Exception as e:
                logger.error("Error saving article '%s': %s", article.get("title"), e)
        logger.info("Successfully stored %d new articles and updated %d existing articles", saved_count, updated_count)

    # ── Phase 5: Daily Summary ─────────────────────────────────────────────
    # Generate summary for the current IST calendar date.
    # Articles and the UI use IST (UTC+05:30), so keying the summary on the
    # UTC date would mismatch when running after 18:30 UTC (midnight IST+).
    from backend.pipeline.summarizer import generate_daily_summary
    from datetime import timedelta
    with get_session() as db:
        IST_OFFSET = timedelta(hours=5, minutes=30)
        today = (datetime.now(timezone.utc) + IST_OFFSET).date()
        generate_daily_summary(db, today)

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    logger.info("Pipeline finished in %.1fs", elapsed)
    logger.info("═══════════════════════════════════════")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        logger.exception("Pipeline crashed with unhandled exception")
        sys.exit(1)
