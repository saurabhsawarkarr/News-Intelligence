"""
Groq AI Analyzer — Phase 3 stub.

Calls the Groq LLM to produce structured financial analysis for each article:
    - summary
    - sentiment        (Positive / Negative / Neutral)
    - primary_sector
    - secondary_sector
    - reasoning

Implementation will be completed in Phase 3.
"""

from __future__ import annotations

# -- System prompt (defined here so it can be reviewed / tweaked independently) -

SYSTEM_PROMPT = """\
You are a financial analyst specialising in the Indian stock market (NSE/BSE).

Given a news article title and description, analyse the news and return a JSON
object with:
- "summary":          A 2-3 sentence factual summary of what happened.
- "sentiment":        One of "Positive", "Negative", or "Neutral" -- evaluated
                      strictly from the perspective of Indian stock market
                      investors (NOT the emotional tone of the article).
- "primary_sector":  The main Indian market sector affected (e.g., Banking,
                      IT, Energy, Pharma, FMCG, Automobiles, Real Estate,
                      Infrastructure, Metals, Aviation, Telecom, Agriculture).
- "secondary_sector": A second affected sector, or null if not applicable.
- "reasoning":        2-3 sentences explaining WHY this sector may be affected
                      from a market perspective.

Rules:
- Evaluate sentiment from the investor's perspective
  (e.g., rate cuts = Positive for Banking).
- Focus on sector-level impact, NOT individual stock predictions.
- If the article has no clear market impact, set sentiment to "Neutral".
- Always return valid JSON only. No extra text.
"""

# -- Public API ---------------------------------------------------------------


import os
import json
import time
import logging
from groq import Groq

logger = logging.getLogger("pipeline.analyzer")


class DailyQuotaExceededError(Exception):
    """Raised when the Groq daily token-per-day limit is hit.

    Signals analyze_batch() to stop calling the API immediately and store
    all remaining articles with is_analyzed=False so they appear in the
    dashboard without blocking for hours.
    """
    pass


def get_groq_client() -> Groq | None:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        return None
    return Groq(api_key=api_key)


def analyze_article(title: str, description: str, max_retries: int = 3) -> dict | None:
    """Call Groq LLM and return a parsed analysis dict, or None on failure.

    Raises DailyQuotaExceededError immediately when the Groq daily token limit
    is hit, so the caller can short-circuit the batch instead of retrying
    every article for minutes at a time.
    """
    client = get_groq_client()
    if not client:
        logger.error("GROQ_API_KEY is missing or invalid.")
        return None

    prompt = f"Title: {title}\n\nDescription: {description}"

    delay = 2
    for attempt in range(1, max_retries + 1):
        try:
            response = client.chat.completions.create(
                model="groq/compound-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,   # Low temp for consistent structured output
                max_tokens=512,
            )

            content = response.choices[0].message.content
            analysis = json.loads(content)

            # Validate sentiment
            if analysis.get("sentiment") not in ["Positive", "Negative", "Neutral"]:
                analysis["sentiment"] = "Neutral"

            # Ensure all required fields exist
            required_fields = [
                "summary", "sentiment", "primary_sector",
                "secondary_sector", "reasoning",
            ]
            for field in required_fields:
                if field not in analysis:
                    logger.warning("Missing required field '%s' in analysis output.", field)
                    return None

            return analysis

        except Exception as e:
            error_str = str(e)
            # Detect daily token quota exhaustion (TPD limit).
            # Retrying is pointless until the quota resets at midnight UTC,
            # so raise immediately to stop the whole batch.
            if "rate_limit_exceeded" in error_str and "tokens per day" in error_str.lower():
                logger.warning(
                    "Daily Groq token quota exhausted. "
                    "Stopping AI analysis for all remaining articles."
                )
                raise DailyQuotaExceededError("Groq daily token quota exhausted.")

            logger.warning("Groq analysis failed on attempt %d: %s", attempt, e)
            if attempt < max_retries:
                time.sleep(delay)
                delay *= 2

    logger.error("Failed to analyze article after %d attempts.", max_retries)
    return None


def analyze_batch(articles: list[dict]) -> list[dict]:
    """Analyze a list of articles, respecting the Groq free-tier rate limit.

    Returns a new list of article dicts with the analysis fields merged in.
    Articles where analysis fails are included with ``is_analyzed=False``.

    When the daily token quota is exhausted ALL remaining articles are saved
    immediately with is_analyzed=False so they appear in the dashboard without
    blocking the pipeline for hours.
    """
    results = []
    quota_exhausted = False

    for i, article in enumerate(articles):
        if quota_exhausted:
            # Daily limit already hit — store without AI analysis so it shows in UI
            results.append({**article, "is_analyzed": False})
            continue

        logger.info(
            "Analyzing article %d/%d: %s",
            i + 1, len(articles), article["title"],
        )
        try:
            analysis = analyze_article(article["title"], article["description"])
        except DailyQuotaExceededError:
            quota_exhausted = True
            remaining = len(articles) - i
            logger.warning(
                "Quota exhausted at article %d/%d. "
                "Saving remaining %d articles without AI analysis.",
                i + 1, len(articles), remaining,
            )
            results.append({**article, "is_analyzed": False})
            continue

        if analysis:
            results.append({**article, **analysis, "is_analyzed": True})
        else:
            results.append({**article, "is_analyzed": False})

        # Rate limit: max 30 req/min on free tier (1 req / 2 s).
        # Add a small buffer to stay comfortably under the limit.
        if i < len(articles) - 1:
            time.sleep(2.1)

    return results
