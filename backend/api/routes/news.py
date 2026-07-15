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
        now_ist = datetime.now(timezone.utc) + IST_OFFSET
        if date == "today":
            target_date = now_ist.date()
            start_ist = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
            end_ist   = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, 999999)
            start_utc = start_ist - IST_OFFSET
            end_utc   = end_ist   - IST_OFFSET
            query = query.filter(Article.published_at >= start_utc, Article.published_at <= end_utc)
        elif date == "yesterday":
            target_date = now_ist.date() - timedelta(days=1)
            start_ist = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
            end_ist   = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, 999999)
            start_utc = start_ist - IST_OFFSET
            end_utc   = end_ist   - IST_OFFSET
            query = query.filter(Article.published_at >= start_utc, Article.published_at <= end_utc)
        elif date == "7days":
            start_utc = datetime.now(timezone.utc) - timedelta(days=7)
            query = query.filter(Article.published_at >= start_utc)
        elif date == "1month":
            start_utc = datetime.now(timezone.utc) - timedelta(days=30)
            query = query.filter(Article.published_at >= start_utc)
        else:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
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
    # Known garbage/meta values the AI analyzer sometimes outputs instead of real sectors
    SECTOR_BLACKLIST = {
        "", "all", "all sectors", "neutral", "positive", "negative",
        "null", "none", "n/a", "na", "market", "market/equities",
        "equities", "multicap", "midcaps, smallcaps", "midcap stocks",
    }
    
    primary = db.query(AIAnalysis.primary_sector).filter(AIAnalysis.primary_sector.isnot(None)).distinct()
    secondary = db.query(AIAnalysis.secondary_sector).filter(AIAnalysis.secondary_sector.isnot(None)).distinct()
    
    sectors = set()
    for row in primary:
        if row[0]:
            val = row[0].strip()
            if val.lower() not in SECTOR_BLACKLIST:
                sectors.add(val)
    for row in secondary:
        if row[0]:
            val = row[0].strip()
            if val.lower() not in SECTOR_BLACKLIST:
                sectors.add(val)
            
    return sorted(list(sectors))


@router.get("/daily-summary", response_model=DailySummarySchema)
async def get_daily_summary(
    date: str | None = Query(None, description="YYYY-MM-DD"),
    sector: str | None = Query(None, description="Sector Name"),
    db: Session = Depends(get_db)
):
    """Return the daily summary for a specific date, or the latest available if no date is provided."""
    query = db.query(DailySummary)
    
    if date:
        now_ist = datetime.now(timezone.utc) + IST_OFFSET
        if date == "today":
            query = query.filter(DailySummary.date_val == now_ist.date())
        elif date == "yesterday":
            query = query.filter(DailySummary.date_val == (now_ist.date() - timedelta(days=1)))
        else:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
                query = query.filter(DailySummary.date_val == target_date)
            except ValueError:
                pass
            
    if sector:
        query = query.filter(DailySummary.sector_val == sector)
    else:
        query = query.filter(DailySummary.sector_val.is_(None))
            
    summary = query.order_by(DailySummary.date_val.desc()).first()
    
    if not summary:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Daily summary not found")
        
    return summary


@router.get("/daily-summaries", response_model=list[DailySummarySchema])
async def get_daily_summaries_list(
    date: str | None = Query(None, description="7days or 1month"),
    sector: str | None = Query(None, description="Sector Name"),
    db: Session = Depends(get_db)
):
    """Return a list of daily summaries for a date range."""
    query = db.query(DailySummary)
    
    now_ist = datetime.now(timezone.utc) + IST_OFFSET
    if date == "7days":
        query = query.filter(DailySummary.date_val >= (now_ist.date() - timedelta(days=7)))
    elif date == "1month":
        query = query.filter(DailySummary.date_val >= (now_ist.date() - timedelta(days=30)))
    else:
        # Default to just the last 7 days if something else is passed to this list endpoint
        query = query.filter(DailySummary.date_val >= (now_ist.date() - timedelta(days=7)))
            
    if sector:
        query = query.filter(DailySummary.sector_val == sector)
    else:
        query = query.filter(DailySummary.sector_val.is_(None))
            
    summaries = query.order_by(DailySummary.date_val.desc()).all()
    return summaries


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
