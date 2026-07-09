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

    # ── Phase 1: Fetch ─────────────────────────────────────────────────────
    # from backend.pipeline.fetcher import fetch_all_feeds
    # from backend.config import RSS_FEEDS
    # raw_articles = fetch_all_feeds(RSS_FEEDS)
    # logger.info("Fetched %d raw articles", len(raw_articles))

    # ── Phase 2A: Filter ───────────────────────────────────────────────────
    # from backend.pipeline.filter import filter_articles
    # filtered = filter_articles(raw_articles)
    # logger.info("After content filter: %d articles", len(filtered))

    # ── Phase 2B: Deduplicate ─────────────────────────────────────────────
    # from backend.pipeline.deduplicator import deduplicate
    # unique = deduplicate(filtered, existing_urls=set())
    # logger.info("After deduplication: %d unique articles", len(unique))

    # ── Phase 3: AI Analysis ───────────────────────────────────────────────
    # from backend.pipeline.analyzer import analyze_batch
    # analyzed = analyze_batch(unique)
    # logger.info("AI analysis complete: %d articles enriched", len(analyzed))

    # ── Phase 4: Store ─────────────────────────────────────────────────────
    # (Storage implementation in Phase 4)

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    logger.info("Pipeline finished in %.1fs", elapsed)
    logger.info("═══════════════════════════════════════")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        logger.exception("Pipeline crashed with unhandled exception")
        sys.exit(1)
