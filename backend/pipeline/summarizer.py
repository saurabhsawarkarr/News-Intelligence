"""
Groq AI Daily Summarizer.

Generates a daily summary of the market based on all analyzed articles for a given date.
"""

from __future__ import annotations

import json
import logging
from datetime import date as date_type

from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.db.models import Article, AIAnalysis, DailySummary
from backend.pipeline.analyzer import get_groq_client

logger = logging.getLogger("pipeline.summarizer")

SYSTEM_PROMPT = """\
You are a financial analyst specialising in the Indian stock market (NSE/BSE).

You will be provided with a list of news articles and their AI-generated analysis for a specific day.
Generate a comprehensive daily market summary based ONLY on the provided articles.
Return a JSON object with:
- "sentiment": Overall market sentiment for the day ("Positive", "Negative", or "Neutral").
- "summary": A 3-4 sentence high-level summary of the day's main events.
- "events": A bulleted list of the top 3-5 most important events. Format as a single markdown string with bullet points (e.g., "- Event 1\\n- Event 2").
- "sectors": A comma-separated string of the most impacted sectors (e.g., "Banking, Auto, IT").
- "reasoning": 2-3 sentences explaining the overall sentiment and sector impacts.

Rules:
- Do not hallucinate events not present in the input.
- Always return valid JSON only. No extra text.
"""

def _generate_summary_payload(db: Session, target_date: date_type, articles: list, sector_val: str | None) -> None:
    if not articles:
        return
        
    input_data = []
    for idx, (article, analysis) in enumerate(articles, 1):
        input_data.append(
            f"Article {idx}:\n"
            f"Headline: {article.canonical_title}\n"
            f"Sentiment: {analysis.sentiment}\n"
            f"Primary Sector: {analysis.primary_sector}\n"
            f"Summary: {analysis.summary}\n"
        )
        
    prompt = "Here are the articles for the day:\n\n" + "\n".join(input_data)
    
    client = get_groq_client()
    if not client:
        logger.error("GROQ_API_KEY missing or invalid, skipping daily summary.")
        return
        
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1024,
        )
        
        content = response.choices[0].message.content
        summary_data = json.loads(content)
        
        # Ensure it exists or update it
        existing_summary = db.query(DailySummary).filter(
            DailySummary.date_val == target_date,
            DailySummary.sector_val == sector_val if sector_val else DailySummary.sector_val.is_(None)
        ).first()
        
        if existing_summary:
            existing_summary.sentiment = summary_data.get("sentiment", "Neutral")
            existing_summary.summary = summary_data.get("summary", "")
            existing_summary.events = summary_data.get("events", "")
            existing_summary.sectors = summary_data.get("sectors", "")
            existing_summary.reasoning = summary_data.get("reasoning", "")
        else:
            new_summary = DailySummary(
                date_val=target_date,
                sector_val=sector_val,
                sentiment=summary_data.get("sentiment", "Neutral"),
                summary=summary_data.get("summary", ""),
                events=summary_data.get("events", ""),
                sectors=summary_data.get("sectors", ""),
                reasoning=summary_data.get("reasoning", "")
            )
            db.add(new_summary)
            
        db.commit()
        logger.info(f"Successfully generated and saved daily summary for {target_date} (Sector: {sector_val}).")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to generate daily summary for {target_date} (Sector: {sector_val}): {e}")

def generate_daily_summary(db: Session, target_date: date_type) -> None:
    """Generate or update the daily summary for a specific date and its sectors."""
    
    # Query all articles for the given date that have been analyzed
    articles = db.query(Article, AIAnalysis).join(AIAnalysis).filter(
        func.date(Article.published_at) == target_date
    ).all()
    
    if not articles:
        logger.info(f"No analyzed articles found for {target_date}. Skipping daily summary.")
        return
        
    logger.info(f"Generating daily summary for {target_date} based on {len(articles)} articles.")
    
    # 1. Generate Overall Summary (Top 5 articles)
    _generate_summary_payload(db, target_date, articles[:5], None)
    
    # 2. Extract distinct sectors
    sectors = set()
    for _, analysis in articles:
        if analysis.primary_sector:
            sectors.add(analysis.primary_sector.strip())
        if analysis.secondary_sector:
            sectors.add(analysis.secondary_sector.strip())
            
    # 3. Generate Sector Summaries (Top 5 per sector)
    for sector in sectors:
        sector_articles = [
            item for item in articles 
            if (item[1].primary_sector == sector or item[1].secondary_sector == sector)
        ]
        if sector_articles:
            _generate_summary_payload(db, target_date, sector_articles[:5], sector)

AGGREGATION_PROMPT = """\
You are a financial analyst specialising in the Indian stock market (NSE/BSE).

You will be provided with a list of daily market summaries covering a specific date range.
Synthesize these daily summaries into a single, cohesive aggregated summary for the entire period.
Return a JSON object with:
- "sentiment": Overall market sentiment for the period ("Positive", "Negative", or "Neutral").
- "summary": A 3-4 sentence high-level summary of the period's main trends and events.
- "events": A bulleted list of the top 3-5 most important events across the period. Format as a single markdown string with bullet points (e.g., "- Event 1\\n- Event 2").
- "sectors": A comma-separated string of the most impacted sectors across the period.
- "reasoning": 2-3 sentences explaining the overall sentiment and sector impacts over this period.

Rules:
- Do not hallucinate events not present in the input.
- Always return valid JSON only. No extra text.
"""

def generate_aggregated_summary(daily_summaries: list[DailySummary]) -> dict | None:
    if not daily_summaries:
        return None
        
    input_data = []
    for idx, ds in enumerate(daily_summaries, 1):
        input_data.append(
            f"Date: {ds.date_val}\n"
            f"Sentiment: {ds.sentiment}\n"
            f"Sectors: {ds.sectors}\n"
            f"Summary: {ds.summary}\n"
            f"Events: {ds.events}\n"
        )
        
    prompt = "Here are the daily summaries for the period:\n\n" + "\n".join(input_data)
    
    client = get_groq_client()
    if not client:
        logger.error("GROQ_API_KEY missing or invalid, skipping aggregated summary.")
        return None
        
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": AGGREGATION_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=800,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        logger.error(f"Failed to generate aggregated AI summary: {e}")
        return None
