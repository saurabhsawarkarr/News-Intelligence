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

def generate_daily_summary(db: Session, target_date: date_type) -> None:
    """Generate or update the daily summary for a specific date."""
    
    # Query all articles for the given date that have been analyzed
    articles = db.query(Article, AIAnalysis).join(AIAnalysis).filter(
        func.date(Article.published_at) == target_date
    ).all()
    
    if not articles:
        logger.info(f"No analyzed articles found for {target_date}. Skipping daily summary.")
        return
        
    logger.info(f"Generating daily summary for {target_date} based on {len(articles)} articles.")
    
    # Prepare input payload for the LLM
    input_data = []
    # Limit to top 5 articles to avoid token limits
    for idx, (article, analysis) in enumerate(articles[:5], 1):
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
        existing_summary = db.query(DailySummary).filter(DailySummary.date_val == target_date).first()
        
        if existing_summary:
            existing_summary.sentiment = summary_data.get("sentiment", "Neutral")
            existing_summary.summary = summary_data.get("summary", "")
            existing_summary.events = summary_data.get("events", "")
            existing_summary.sectors = summary_data.get("sectors", "")
            existing_summary.reasoning = summary_data.get("reasoning", "")
        else:
            new_summary = DailySummary(
                date_val=target_date,
                sentiment=summary_data.get("sentiment", "Neutral"),
                summary=summary_data.get("summary", ""),
                events=summary_data.get("events", ""),
                sectors=summary_data.get("sectors", ""),
                reasoning=summary_data.get("reasoning", "")
            )
            db.add(new_summary)
            
        db.commit()
        logger.info(f"Successfully generated and saved daily summary for {target_date}.")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to generate daily summary for {target_date}: {e}")
