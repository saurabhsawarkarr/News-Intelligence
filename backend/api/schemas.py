"""
Pydantic response models for the FastAPI endpoints — Phase 5 stub.

Defines the exact JSON shapes returned by /api/news and related routes.
"""

from __future__ import annotations

from datetime import datetime, timezone, date as date_type
from uuid import UUID

from pydantic import BaseModel, field_serializer


class SourceSchema(BaseModel):
    name: str
    url: str

    model_config = {"from_attributes": True}


class AIAnalysisSchema(BaseModel):
    summary: str | None
    sentiment: str | None          # Positive | Negative | Neutral
    primary_sector: str | None
    secondary_sector: str | None
    reasoning: str | None
    analyzed_at: datetime | None

    model_config = {"from_attributes": True}


class ArticleSchema(BaseModel):
    id: UUID
    title: str
    published_at: datetime
    fetched_at: datetime | None
    is_analyzed: bool
    
    # Flattened analysis fields
    summary: str | None = None
    sentiment: str | None = None
    primary_sector: str | None = None
    secondary_sector: str | None = None
    reasoning: str | None = None
    analyzed_at: datetime | None = None
    
    sources: list[SourceSchema]

    model_config = {"from_attributes": True}

    @field_serializer("published_at", "fetched_at", "analyzed_at")
    def serialize_dt_as_utc(self, dt: datetime | None) -> str | None:
        """Ensure all datetimes are serialized with a UTC 'Z' suffix.
        
        SQLite stores naive datetimes; we treat them as UTC so the
        frontend date-fns library correctly computes relative timestamps.
        """
        if dt is None:
            return None
        # If already timezone-aware, convert to UTC; otherwise assume UTC.
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


class DailySummarySchema(BaseModel):
    id: UUID
    date_val: date_type
    sentiment: str
    summary: str
    events: str | None
    sectors: str | None
    reasoning: str | None
    created_at: datetime
    
    model_config = {"from_attributes": True}
    
    @field_serializer("created_at")
    def serialize_dt_as_utc(self, dt: datetime | None) -> str | None:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        

class NewsListResponse(BaseModel):
    data: list[ArticleSchema]
    total: int
    page: int
    limit: int


class HealthResponse(BaseModel):
    status: str
    last_run: datetime | None
