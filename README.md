# AI-Powered Indian Stock Market News Intelligence Platform

> **Status:** Phase 0 complete — project structure scaffolded.

---

## Architecture Overview

```
GitHub Actions (cron hourly)
        │
        ▼
  pipeline/run.py
        │
  ┌─────┴──────┐
  │  fetcher   │ ← RSS feeds (9 sources)
  └─────┬──────┘
        │
  ┌─────┴──────┐
  │   filter   │ ← keyword blocklist
  └─────┬──────┘
        │
  ┌─────┴──────────┐
  │ deduplicator   │ ← URL + fuzzy + semantic
  └─────┬──────────┘
        │
  ┌─────┴──────┐
  │  analyzer  │ ← Groq LLM (llama-3.1-8b-instant)
  └─────┬──────┘
        │
  PostgreSQL (Supabase)
        │
  FastAPI (/api/news)
        │
  React + Vite Dashboard
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Scheduler | GitHub Actions (cron) |
| RSS Fetcher | `feedparser` (Python) |
| Content Filter | Keyword-based (Python) |
| Deduplication | RapidFuzz + SentenceTransformers |
| LLM | Groq (`llama-3.1-8b-instant`) |
| Backend | FastAPI + SQLAlchemy + Alembic |
| Database | PostgreSQL via Supabase |
| Frontend | React + Vite |

**Total cost: ₹0 / $0** (all free tiers)

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (local) **or** a free [Supabase](https://supabase.com) project

### 1. Clone & enter the repo
```bash
git clone <repo-url>
cd news-intelligence
```

### 2. Backend

```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Copy env template and fill in your values
cp backend/.env.example backend/.env
# Edit backend/.env:
#   GROQ_API_KEY=gsk_...
#   DATABASE_URL=postgresql://...

# Initialise the database (dev only — use alembic in production)
python - <<'EOF'
from backend.db.database import init_db
init_db()
print("Database tables created.")
EOF

# Start the API server
uvicorn backend.api.main:app --reload
# → Swagger UI: http://localhost:8000/docs
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local: VITE_API_BASE_URL=http://localhost:8000
npm run dev
# → http://localhost:5173
```

### 4. Run the pipeline manually

```bash
python -m backend.pipeline.run
```

---

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | backend | Free API key from [console.groq.com](https://console.groq.com) |
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `VITE_API_BASE_URL` | frontend | Base URL of the FastAPI backend |

---

## Project Structure

```
news-intelligence/
├── .github/workflows/fetch_news.yml   # Hourly GitHub Actions pipeline
├── backend/
│   ├── pipeline/
│   │   ├── run.py          # Pipeline orchestrator
│   │   ├── fetcher.py      # RSS fetcher
│   │   ├── filter.py       # Content filter
│   │   ├── deduplicator.py # Three-step deduplication
│   │   └── analyzer.py     # Groq LLM analysis
│   ├── api/
│   │   ├── main.py         # FastAPI app
│   │   ├── schemas.py      # Pydantic response models
│   │   └── routes/news.py  # /api/news, /api/health
│   ├── db/
│   │   ├── models.py       # SQLAlchemy ORM models
│   │   └── database.py     # Engine + session management
│   ├── config.py           # Central config (env vars + constants)
│   └── requirements.txt
├── frontend/               # React + Vite dashboard (Phase 6)
├── .env.example
└── README.md
```

---

## Deployment (Phase 9)

| Component | Platform | Free Tier |
|---|---|---|
| Database | [Supabase](https://supabase.com) | 500 MB |
| Backend API | [Render](https://render.com) | 500 hrs/month |
| Frontend | [Vercel](https://vercel.com) | Unlimited static |
| Scheduler | GitHub Actions | 2,000 min/month |

---

## Implementation Progress

- [x] **Phase 0** — Project Setup & Repository Structure
- [x] **Phase 1** — Data Ingestion Layer (RSS Fetcher)
- [x] **Phase 2** — Processing Layer (Filter + Deduplication)
- [x] **Phase 3** — AI Analysis Layer (Groq LLM)
- [ ] **Phase 4** — Storage Layer (PostgreSQL + SQLAlchemy)
- [ ] **Phase 5** — Backend API (FastAPI)
- [ ] **Phase 6** — Frontend Dashboard (React + Vite)
- [ ] **Phase 7** — GitHub Actions Scheduler
- [ ] **Phase 8** — Integration & Testing
- [ ] **Phase 9** — Deployment & Polish
