"""
SQLAlchemy ORM Models — Phase 4 stub.

Defines the three database tables:
    Article     — canonical deduplicated news item
    Source      — individual RSS source for an article (many → one Article)
    AIAnalysis  — Groq analysis result (one-to-one with Article)

Implementation will be completed in Phase 4.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Column, DateTime, Date, ForeignKey, String, Text, Uuid, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Article(Base):
    __tablename__ = "articles"

    id              = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_title = Column(Text, nullable=False)
    published_at    = Column(DateTime, nullable=False)
    fetched_at      = Column(DateTime, server_default=func.now())
    is_analyzed     = Column(Boolean, default=False)

    sources  = relationship("Source", back_populates="article", cascade="all, delete-orphan")
    analysis = relationship("AIAnalysis", back_populates="article", uselist=False,
                            cascade="all, delete-orphan")


class Source(Base):
    __tablename__ = "sources"

    id           = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id   = Column(Uuid(as_uuid=True), ForeignKey("articles.id"), nullable=False)
    source_name  = Column(String(100), nullable=False)
    url          = Column(Text, nullable=False, unique=True)
    description  = Column(Text)
    published_at = Column(DateTime)

    article = relationship("Article", back_populates="sources")


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id               = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id       = Column(Uuid(as_uuid=True), ForeignKey("articles.id"), unique=True, nullable=False)
    summary          = Column(Text)
    sentiment        = Column(String(10))   # Positive | Negative | Neutral
    primary_sector   = Column(String(100))
    secondary_sector = Column(String(100))
    reasoning        = Column(Text)
    analyzed_at      = Column(DateTime, server_default=func.now())

    article = relationship("Article", back_populates="analysis")


class DailySummary(Base):
    __tablename__ = "daily_summaries"
    __table_args__ = (UniqueConstraint('date_val', 'sector_val', name='uix_daily_summary_date_sector'),)

    id         = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date_val   = Column(Date, nullable=False)
    sector_val = Column(String(100), nullable=True)
    sentiment  = Column(String(10), nullable=False)
    summary    = Column(Text, nullable=False)
    events     = Column(Text)
    sectors    = Column(Text)
    reasoning  = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
