"""
FastAPI application factory — Phase 5 stub.

Run locally:
    uvicorn backend.api.main:app --reload

The app is importable immediately; all endpoints are registered but
their implementations are completed in Phase 5.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.news import router as news_router

app = FastAPI(
    title="News Intelligence API",
    description="AI-powered Indian stock market news intelligence platform.",
    version="0.1.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Restrict origins to your frontend domain in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(news_router)
