"""
Database connection and session management — Phase 4 stub.

Provides:
    engine       — SQLAlchemy engine (configured from DATABASE_URL)
    SessionLocal — session factory for use in the pipeline and API
    get_db()     — FastAPI dependency that yields and closes a session

Implementation of utility functions (url_exists, save_article, etc.)
will be completed in Phase 4.
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.config import DATABASE_URL
from backend.db.models import Base

# ── Engine & session factory ──────────────────────────────────────────────────

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine_kwargs = {"connect_args": connect_args}
if not DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({"pool_pre_ping": True, "pool_size": 5, "max_overflow": 10})

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Table initialisation (dev only — use Alembic in production) ───────────────

def init_db() -> None:
    """Create all tables that do not yet exist.

    Safe to call on every startup during development.
    In production, use ``alembic upgrade head`` instead.
    """
    Base.metadata.create_all(bind=engine)


# ── Session helpers ───────────────────────────────────────────────────────────

@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Context-manager that yields a database session and handles cleanup."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── DB utility functions (stubs — implemented in Phase 4) ────────────────────

def url_exists(db: Session, url: str) -> bool:
    """Return True if *url* is already stored in the sources table."""
    from backend.db.models import Source
    return db.query(Source.id).filter(Source.url == url).first() is not None


def save_article(db: Session, article_data: dict) -> None:
    """Atomically persist an article together with its sources.
    Uses the canonical title from the article_data.
    """
    from backend.db.models import Article, Source
    import logging
    logger = logging.getLogger("db.database")
    
    try:
        # Create canonical article
        article = Article(
            canonical_title=article_data["title"],
            published_at=article_data["published_at"],
            is_analyzed=article_data.get("is_analyzed", False)
        )
        db.add(article)
        db.flush() # flush to get the article.id
        
        # Add sources
        sources = article_data.get("sources", [])
        for src in sources:
            # Check if this specific source URL somehow already exists to avoid UniqueConstraint error
            if url_exists(db, src["url"]):
                logger.warning(f"Source URL already exists, skipping insert for: {src['url']}")
                continue
                
            db_source = Source(
                article_id=article.id,
                source_name=src["source_name"],
                url=src["url"],
                description=src.get("description", ""),
                published_at=src["published_at"]
            )
            db.add(db_source)
            
        # Add analysis if it was analyzed
        if article_data.get("is_analyzed") and "sentiment" in article_data:
            from backend.db.models import AIAnalysis
            analysis = AIAnalysis(
                article_id=article.id,
                summary=article_data.get("summary", ""),
                sentiment=article_data.get("sentiment", "Neutral"),
                primary_sector=article_data.get("primary_sector", ""),
                secondary_sector=article_data.get("secondary_sector"),
                reasoning=article_data.get("reasoning", "")
            )
            db.add(analysis)
            
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save article {article_data['title']}: {e}")
        raise


def save_analysis(db: Session, article_id: str, analysis_data: dict) -> None:
    """Persist the Groq AI analysis result for a given article."""
    from backend.db.models import AIAnalysis, Article
    import uuid
    
    # Convert string to UUID if necessary
    if isinstance(article_id, str):
        article_id_obj = uuid.UUID(article_id)
    else:
        article_id_obj = article_id
        
    try:
        analysis = AIAnalysis(
            article_id=article_id_obj,
            summary=analysis_data.get("summary", ""),
            sentiment=analysis_data.get("sentiment", "Neutral"),
            primary_sector=analysis_data.get("primary_sector", ""),
            secondary_sector=analysis_data.get("secondary_sector"),
            reasoning=analysis_data.get("reasoning", "")
        )
        db.add(analysis)
        
        # Mark article as analyzed
        article = db.query(Article).filter(Article.id == article_id_obj).first()
        if article:
            article.is_analyzed = True
            
        db.commit()
    except Exception as e:
        db.rollback()
        raise e


def get_unanalyzed(db: Session) -> list:
    """Fetch all Article rows where is_analyzed=False (for retry logic)."""
    from backend.db.models import Article
    return db.query(Article).filter(Article.is_analyzed == False).all()
