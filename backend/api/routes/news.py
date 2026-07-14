"""
News API routes — Phase 5 stub.

GET /api/news           → paginated + filtered list of articles
GET /api/news/sectors   → list of unique sectors in the DB
GET /api/health         → pipeline health check
"""

from __future__ import annotations

from datetime import datetime, date as date_type, timezone, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Any

from backend.db.database import get_db
from backend.db.models import Article, AIAnalysis, DailySummary
from backend.api.schemas import NewsListResponse, ArticleSchema, HealthResponse, DailySummarySchema

router = APIRouter(prefix="/api")

# IST is UTC+5:30 — articles are stored as naive UTC in SQLite.
# To filter by a local IST calendar date, subtract IST offset to get the
# equivalent UTC window.
IST_OFFSET = timedelta(hours=5, minutes=30)

def _flatten_article(article: Article) -> dict[str, Any]:
    """Helper to flatten Article and AIAnalysis for response."""
    data = {
        "id": article.id,
        "title": article.canonical_title,
        "published_at": article.published_at.replace(tzinfo=timezone.utc) if article.published_at else None,
        "fetched_at": article.fetched_at.replace(tzinfo=timezone.utc) if article.fetched_at else None,
        "is_analyzed": article.is_analyzed,
        "sources": [{"name": s.source_name, "url": s.url} for s in article.sources]
    }
    if article.analysis:
        data.update({
            "summary": article.analysis.summary,
            "sentiment": article.analysis.sentiment,
            "primary_sector": article.analysis.primary_sector,
            "secondary_sector": article.analysis.secondary_sector,
            "reasoning": article.analysis.reasoning,
            "analyzed_at": article.analysis.analyzed_at
        })
    return data


@router.get("/news", response_model=NewsListResponse)
async def get_news(
    sentiment: str = Query("All", description="Positive, Negative, Neutral, or All"),
    date: str | None = Query(None, description="YYYY-MM-DD"),
    sector: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return a paginated, filtered list of analysed news articles."""
    
    query = db.query(Article).outerjoin(AIAnalysis)
    
    # Filter by date only when explicitly provided
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            # Articles are stored as naive UTC. The user selects a date in IST
            # (UTC+05:30), so we shift the range back by the IST offset to get
            # the correct UTC window stored in the database.
            # e.g. IST 2026-07-14 00:00 → UTC 2026-07-13 18:30
            #      IST 2026-07-14 23:59 → UTC 2026-07-14 18:29
            start_ist = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
            end_ist   = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, 999999)
            start_utc = start_ist - IST_OFFSET
            end_utc   = end_ist   - IST_OFFSET
            query = query.filter(
                Article.published_at >= start_utc,
                Article.published_at <= end_utc
            )
        except ValueError:
            pass  # Invalid date string — ignore filter

    # Filter by sentiment
    if sentiment.lower() != "all":
        query = query.filter(AIAnalysis.sentiment.ilike(sentiment))
        
    # Filter by sector (matches primary or secondary)
    if sector:
        query = query.filter(
            or_(
                AIAnalysis.primary_sector.ilike(f"%{sector}%"),
                AIAnalysis.secondary_sector.ilike(f"%{sector}%")
            )
        )
        
    # Total count
    total = query.count()
    
    # Order and paginate
    query = query.order_by(Article.published_at.desc())
    articles_result = query.offset((page - 1) * limit).limit(limit).all()
    
    # Flatten data
    flattened_data = [_flatten_article(a) for a in articles_result]

    return {
        "data": flattened_data,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.get("/news/sectors", response_model=list[str])
async def get_sectors(db: Session = Depends(get_db)):
    """Return a list of all unique sector values present in the database."""
    primary = db.query(AIAnalysis.primary_sector).filter(AIAnalysis.primary_sector.isnot(None)).distinct()
    secondary = db.query(AIAnalysis.secondary_sector).filter(AIAnalysis.secondary_sector.isnot(None)).distinct()
    
    sectors = set()
    for row in primary:
        if row[0]:
            sectors.add(row[0].strip())
    for row in secondary:
        if row[0]:
            sectors.add(row[0].strip())
            
    return sorted(list(sectors))


@router.get("/daily-summary", response_model=DailySummarySchema)
async def get_daily_summary(
    date: str | None = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """Return the daily summary for a specific date, or the latest available if no date is provided."""
    query = db.query(DailySummary)
    
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(DailySummary.date_val == target_date)
        except ValueError:
            pass
            
    summary = query.order_by(DailySummary.date_val.desc()).first()
    
    if not summary:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Daily summary not found")
        
    return summary


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Return API health status and timestamp of the last pipeline run."""
    last_article = db.query(Article).order_by(Article.fetched_at.desc()).first()
    last_run = last_article.fetched_at.replace(tzinfo=timezone.utc) if last_article and last_article.fetched_at else None
    return {"status": "ok", "last_run": last_run}

import asyncio
from fastapi import BackgroundTasks
from backend.pipeline.run import main as run_pipeline

@router.post("/news/refresh")
async def refresh_news(background_tasks: BackgroundTasks):
    """Trigger the news pipeline to fetch, analyze, and store new articles in the background."""
    background_tasks.add_task(run_pipeline)
    return {"status": "success", "message": "Pipeline started in background"}
