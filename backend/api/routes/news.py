"""
News API routes — Phase 5 stub.

GET /api/news           → paginated + filtered list of articles
GET /api/news/sectors   → list of unique sectors in the DB
GET /api/health         → pipeline health check
"""

from __future__ import annotations

from datetime import datetime, date as date_type
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Any

from backend.db.database import get_db
from backend.db.models import Article, AIAnalysis
from backend.api.schemas import NewsListResponse, ArticleSchema, HealthResponse

router = APIRouter(prefix="/api")

def _flatten_article(article: Article) -> dict[str, Any]:
    """Helper to flatten Article and AIAnalysis for response."""
    data = {
        "id": article.id,
        "title": article.canonical_title,
        "published_at": article.published_at,
        "fetched_at": article.fetched_at,
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
    
    # Filter by date (default to today if not provided)
    target_date = datetime.utcnow().date()
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            pass
            
    # Assuming published_at is stored as datetime, we filter by the date part
    # SQLite compatibility for date extraction:
    # Instead of func.date, we can just do a range filter between start of day and end of day
    start_of_day = datetime(target_date.year, target_date.month, target_date.day)
    end_of_day = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, 999999)
    query = query.filter(Article.published_at >= start_of_day, Article.published_at <= end_of_day)

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
    articles = query.offset((page - 1) * limit).limit(limit).all()
    
    # Flatten data
    flattened_data = [_flatten_article(a) for a in articles]

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


@router.get("/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Return API health status and timestamp of the last pipeline run."""
    last_article = db.query(Article).order_by(Article.fetched_at.desc()).first()
    last_run = last_article.fetched_at if last_article else None
    return {"status": "ok", "last_run": last_run}
