"""
Pydantic response models for the FastAPI endpoints — Phase 5 stub.

Defines the exact JSON shapes returned by /api/news and related routes.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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


class NewsListResponse(BaseModel):
    data: list[ArticleSchema]
    total: int
    page: int
    limit: int


class HealthResponse(BaseModel):
    status: str
    last_run: datetime | None
