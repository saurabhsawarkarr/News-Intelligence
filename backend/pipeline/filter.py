"""
Content Filter — Phase 2A stub.

Removes irrelevant articles (crypto, entertainment, sports, lifestyle)
using a keyword blocklist applied to the article title + description.

Implementation will be completed in Phase 2.
"""

from __future__ import annotations

# ── Keyword blocklist ─────────────────────────────────────────────────────────

EXCLUDED_KEYWORDS: dict[str, list[str]] = {
    "crypto":        ["bitcoin", "crypto", "ethereum", "nft", "blockchain",
                      "binance", "defi", "altcoin"],
    "entertainment": ["bollywood", "movie", "film", "celebrity", "award",
                      "actor", "actress", "music"],
    "sports":        ["cricket", "ipl", "football", "tennis", "olympics",
                      "icc", "fifa", "bcci"],
    "lifestyle":     ["travel", "fashion", "food", "recipe", "wellness",
                      "yoga", "beauty"],
}

# ── Public API ────────────────────────────────────────────────────────────────


def is_relevant(article: dict) -> bool:
    """Return True if *article* should be kept for further processing."""
    text = (article.get("title", "") + " " + article.get("description", "")).lower()
    for category, keywords in EXCLUDED_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return False
    return True


def filter_articles(articles: list[dict]) -> list[dict]:
    """Return only the articles that pass the content filter."""
    return [a for a in articles if is_relevant(a)]
