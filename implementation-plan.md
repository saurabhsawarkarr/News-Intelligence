  # Implementation Plan: AI-Powered Indian Stock Market News Intelligence Platform

> **Stack:** Python (FastAPI) · Groq LLM · Free RSS Feeds · PostgreSQL · React + Vite · GitHub Actions
> **Total Cost:** ₹0 / $0 (all free tiers)
> **Source documents:** `context.md` · `architecture.md`

---

## Phase Overview

| Phase | Name | Focus | Est. Effort |
|---|---|---|---|
| **0** | Project Setup | Repo structure, env, DB init | 0.5–1 day |
| **1** | RSS Ingestion | Fetch + parse all 9 free feeds | 1–2 days |
| **2** | Processing Pipeline | Content filter + deduplication | 2–3 days |
| **3** | Groq AI Analysis | LLM integration + prompt engineering | 2–3 days |
| **4** | Storage Layer | PostgreSQL schema + ORM | 1–2 days |
| **5** | Backend API | FastAPI endpoints + filtering | 1–2 days |
| **6** | Frontend Dashboard | React UI + news cards + filters | 3–4 days |
| **7** | GitHub Actions Scheduler | Automated hourly pipeline | 0.5–1 day |
| **8** | Integration & Testing | End-to-end validation | 1–2 days |
| **9** | Deployment & Polish | Hosting, secrets, final QA | 1 day |
| **10** | Firebase Deployment | Deploy Frontend and API on Firebase | 1 day |

**Total Estimated Effort: 14–22 days**

---

## Phase 0 — Project Setup & Repository Structure

### Goals
- Set up the monorepo structure
- Configure environment variables and dependencies
- Initialize the database

### Directory Structure
```
news-intelligence/
├── .github/
│   └── workflows/
│       └── fetch_news.yml          # GitHub Actions scheduler
├── backend/
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── run.py                  # Entry point for GitHub Actions
│   │   ├── fetcher.py              # RSS feed fetcher
│   │   ├── filter.py               # Content filter
│   │   ├── deduplicator.py         # Duplicate detector + merger
│   │   └── analyzer.py             # Groq LLM analysis
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app
│   │   ├── routes/
│   │   │   └── news.py             # /api/news endpoint
│   │   └── schemas.py              # Pydantic response models
│   ├── db/
│   │   ├── __init__.py
│   │   ├── models.py               # SQLAlchemy ORM models
│   │   ├── database.py             # DB connection + session
│   │   └── migrations/             # Alembic migrations
│   ├── config.py                   # Central config (env vars)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── .env.example
└── README.md
```

### Tasks
- [ ] Create GitHub repository
- [ ] Set up directory structure as above
- [ ] Create `requirements.txt` with initial dependencies
- [ ] Create `.env.example` with required environment variable names
- [ ] Initialize PostgreSQL database (local for dev)
- [ ] Set up virtual environment (`venv`)

### Key Files to Create

**`backend/requirements.txt`**
```txt
fastapi==0.111.0
uvicorn==0.29.0
feedparser==6.0.11
rapidfuzz==3.9.0
sentence-transformers==3.0.1
groq==0.9.0
sqlalchemy==2.0.30
alembic==1.13.1
psycopg2-binary==2.9.9
python-dotenv==1.0.1
httpx==0.27.0
pydantic==2.7.0
```

**`backend/.env.example`**
```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/news_intelligence
```

### Deliverable
- Working local environment
- All imports resolve without error
- DB connection established

---

## Phase 1 — Data Ingestion Layer (RSS Fetcher)

### Goals
- Fetch articles from all 9 free RSS feeds
- Normalize raw feed data into a consistent internal schema

### RSS Feed Configuration (`backend/config.py`)
```python
RSS_FEEDS = [
    {"name": "Moneycontrol",               "url": "https://www.moneycontrol.com/rss/latestnews.xml"},
    {"name": "Moneycontrol Markets",       "url": "https://www.moneycontrol.com/rss/marketreports.xml"},
    {"name": "Economic Times Markets",     "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"},
    {"name": "Economic Times Economy",     "url": "https://economictimes.indiatimes.com/economy/rssfeeds/1373380680.cms"},
    {"name": "LiveMint Markets",           "url": "https://www.livemint.com/rss/markets"},
    {"name": "Business Standard Markets", "url": "https://www.business-standard.com/rss/markets-106.rss"},
    {"name": "Business Standard Economy", "url": "https://www.business-standard.com/rss/economy-policy-102.rss"},
    {"name": "Financial Express Markets", "url": "https://www.financialexpress.com/market/feed/"},
    {"name": "NDTV Profit",               "url": "https://feeds.feedburner.com/ndtvprofit-latest"},
]
```

### Core Logic (`backend/pipeline/fetcher.py`)
```python
import feedparser
from datetime import datetime

def fetch_all_feeds(feed_list: list) -> list[dict]:
    articles = []
    for feed in feed_list:
        try:
            parsed = feedparser.parse(feed["url"])
            for entry in parsed.entries:
                articles.append({
                    "title":        entry.get("title", "").strip(),
                    "url":          entry.get("link", ""),
                    "description":  entry.get("summary", ""),
                    "published_at": parse_date(entry.get("published", "")),
                    "source_name":  feed["name"],
                })
        except Exception as e:
            print(f"[ERROR] Failed to fetch {feed['name']}: {e}")
    return articles

def parse_date(date_str: str) -> datetime:
    # Handle multiple date formats from different RSS sources
    ...
```

### Tasks
- [ ] Implement `fetcher.py` with error handling and retry logic
- [ ] Handle different date formats from each RSS source
- [ ] Add exponential backoff for failed feed fetches
- [ ] Write unit test: assert each feed returns ≥ 1 article
- [ ] Log fetch summary (articles per source, failures)

### Deliverable
- Running `python pipeline/fetcher.py` prints a list of raw articles from all 9 sources

---

## Phase 2 — Processing Layer (Filter + Deduplication)

### Goals
- Remove irrelevant articles (crypto, entertainment, sports, etc.)
- Detect and merge duplicate articles from different sources

### 2A — Content Filter (`backend/pipeline/filter.py`)

```python
EXCLUDED_KEYWORDS = {
    "crypto":        ["bitcoin", "crypto", "ethereum", "nft", "blockchain", "binance", "defi", "altcoin"],
    "entertainment": ["bollywood", "movie", "film", "celebrity", "award", "actor", "actress", "music"],
    "sports":        ["cricket", "ipl", "football", "tennis", "olympics", "icc", "fifa", "bcci"],
    "lifestyle":     ["travel", "fashion", "food", "recipe", "wellness", "yoga", "beauty"],
}

def is_relevant(article: dict) -> bool:
    text = (article["title"] + " " + article["description"]).lower()
    for category, keywords in EXCLUDED_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return False
    return True

def filter_articles(articles: list[dict]) -> list[dict]:
    return [a for a in articles if is_relevant(a)]
```

### 2B — Duplicate Detection (`backend/pipeline/deduplicator.py`)

**Three-step deduplication pipeline:**

```
Step 1: URL hash check        → O(1), catches exact same links
        ↓
Step 2: RapidFuzz title match → catches "RBI cuts rate" vs "RBI slashes rate by 25bps"
        (threshold: 85%)
        ↓
Step 3: SentenceTransformer   → catches semantically identical articles with different titles
        cosine similarity     (threshold: 0.92)
        Model: all-MiniLM-L6-v2 (local, free, fast)
```

```python
from rapidfuzz import fuzz
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")

def deduplicate(articles: list[dict], existing_urls: set) -> list[dict]:
    unique = []
    seen_titles = []
    seen_embeddings = []

    for article in articles:
        # Step 1: URL check
        if article["url"] in existing_urls:
            continue

        # Step 2: Fuzzy title match
        is_dup = any(
            fuzz.token_sort_ratio(article["title"], t) > 85
            for t in seen_titles
        )
        if is_dup:
            # merge source into existing article
            continue

        # Step 3: Semantic similarity
        emb = model.encode(article["title"], convert_to_tensor=True)
        for existing_emb in seen_embeddings:
            if util.cos_sim(emb, existing_emb).item() > 0.92:
                is_dup = True
                break

        if not is_dup:
            unique.append(article)
            seen_titles.append(article["title"])
            seen_embeddings.append(emb)

    return unique
```

### Tasks
- [ ] Implement `filter.py` with keyword exclusion lists
- [ ] Implement `deduplicator.py` — all 3 steps
- [ ] Implement source merging: when duplicate found, append to `sources[]` of existing record
- [ ] Unit test: feed 10 known duplicates → assert output = 1 merged article with 10 sources
- [ ] Unit test: feed crypto article → assert it gets filtered out

### Deliverable
- Pipeline runs: fetch → filter → deduplicate → prints unique, relevant articles with merged sources

---

## Phase 3 — AI Analysis Layer (Groq LLM)

### Goals
- Analyze each unique article using Groq's free LLM
- Generate summary, sentiment, sector impact, and reasoning

### System Prompt Design
```
You are a financial analyst specializing in the Indian stock market (NSE/BSE).

Given a news article title and description, analyze the news and return a JSON object with:
- "summary": A 2-3 sentence factual summary of what happened.
- "sentiment": One of "Positive", "Negative", or "Neutral" — evaluated strictly from the perspective of
  Indian stock market investors (NOT emotional sentiment of the article).
- "primary_sector": The main Indian market sector affected (e.g., Banking, IT, Energy, Pharma, FMCG,
  Automobiles, Real Estate, Infrastructure, Metals, Aviation, Telecom, Agriculture).
- "secondary_sector": A second affected sector, or null if not applicable.
- "reasoning": 2-3 sentences explaining WHY this sector may be affected from a market perspective.

Rules:
- Evaluate sentiment from the investor's perspective (e.g., rate cuts = Positive for Banking).
- Focus on sector-level impact, NOT individual stock predictions.
- If the article has no clear market impact, set sentiment to "Neutral".
- Always return valid JSON only. No extra text.
```

### Groq Integration (`backend/pipeline/analyzer.py`)
```python
import os
import json
from groq import Groq

client = Groq(api_key=os.environ["GROQ_API_KEY"])

def analyze_article(title: str, description: str) -> dict | None:
    prompt = f"Title: {title}\n\nDescription: {description}"
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,       # Low temp for consistent structured output
            max_tokens=512,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"[ERROR] Groq analysis failed: {e}")
        return None
```

### Rate Limit Handling
```python
import time

def analyze_batch(articles: list[dict]) -> list[dict]:
    results = []
    for i, article in enumerate(articles):
        analysis = analyze_article(article["title"], article["description"])
        if analysis:
            results.append({**article, **analysis})
        if (i + 1) % 25 == 0:
            time.sleep(2)  # Stay within 30 req/min free limit
    return results
```

### Tasks
- [ ] Register for free Groq API key at [console.groq.com](https://console.groq.com)
- [ ] Implement `analyzer.py` with system prompt and structured JSON output
- [ ] Implement rate limiting (stay within 30 req/min)
- [ ] Implement retry on failure (max 3 retries with backoff)
- [ ] Mark articles `is_analyzed = false` if LLM call fails; retry in next cycle
- [ ] Unit test: assert response contains all 5 required fields
- [ ] Validate sentiment is one of: `Positive`, `Negative`, `Neutral`
- [ ] Test with sample articles and manually verify sector classification accuracy

### Deliverable
- Given any article title + description → Groq returns valid structured JSON with all fields filled

---

## Phase 4 — Storage Layer (PostgreSQL + SQLAlchemy)

### Goals
- Persist all article data, sources, and AI analysis
- Prevent re-analysis of already-stored articles

### Database Schema (`backend/db/models.py`)

```python
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

class Article(Base):
    __tablename__ = "articles"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_title = Column(Text, nullable=False)
    published_at    = Column(DateTime, nullable=False)
    fetched_at      = Column(DateTime, server_default="now()")
    is_analyzed     = Column(Boolean, default=False)
    sources         = relationship("Source", back_populates="article")
    analysis        = relationship("AIAnalysis", back_populates="article", uselist=False)

class Source(Base):
    __tablename__ = "sources"
    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id   = Column(UUID(as_uuid=True), ForeignKey("articles.id"))
    source_name  = Column(String(100), nullable=False)
    url          = Column(Text, nullable=False, unique=True)
    description  = Column(Text)
    published_at = Column(DateTime)
    article      = relationship("Article", back_populates="sources")

class AIAnalysis(Base):
    __tablename__ = "ai_analysis"
    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id       = Column(UUID(as_uuid=True), ForeignKey("articles.id"), unique=True)
    summary          = Column(Text)
    sentiment        = Column(String(10))   # Positive / Negative / Neutral
    primary_sector   = Column(String(100))
    secondary_sector = Column(String(100))
    reasoning        = Column(Text)
    analyzed_at      = Column(DateTime, server_default="now()")
    article          = relationship("Article", back_populates="analysis")
```

### Key DB Operations
```python
# Check if article already exists (by URL)
def url_exists(db, url: str) -> bool: ...

# Save new article + sources atomically
def save_article(db, article: dict, sources: list[dict]): ...

# Save AI analysis result
def save_analysis(db, article_id: UUID, analysis: dict): ...

# Fetch unanalyzed articles for retry
def get_unanalyzed(db) -> list[Article]: ...
```

### Tasks
- [ ] Define all 3 ORM models in `models.py`
- [ ] Set up Alembic for migrations (`alembic init`, create initial migration)
- [ ] Implement DB utility functions in `db/database.py`
- [ ] Implement atomic transaction: write article + sources + analysis together (rollback on fail)
- [ ] Test: insert article → check it appears in DB → run pipeline again → confirm no duplicate inserted

### Deliverable
- Articles, sources, and AI analysis are persisted correctly after each pipeline run
- Re-running the pipeline does not duplicate already-stored articles

---

## Phase 5 — Backend API (FastAPI)

### Goals
- Expose news data via a REST API consumed by the React frontend
- Support filtering by sentiment and date

### API Endpoints (`backend/api/routes/news.py`)

```
GET /api/news
  Query params:
    ?sentiment=Positive|Negative|Neutral|All  (default: All)
    ?date=YYYY-MM-DD                           (default: today)
    ?page=1                                    (default: 1)
    ?limit=20                                  (default: 20)

Response:
{
  "data": [
    {
      "id": "uuid",
      "title": "...",
      "summary": "...",
      "sentiment": "Positive",
      "primary_sector": "Banking",
      "secondary_sector": "Real Estate",
      "reasoning": "...",
      "published_at": "2026-07-08T08:30:00Z",
      "sources": [
        { "name": "Moneycontrol", "url": "https://..." },
        { "name": "ET Markets",   "url": "https://..." }
      ]
    }
  ],
  "total": 48,
  "page": 1,
  "limit": 20
}

GET /api/news/sectors
  Returns list of all unique sectors present in DB

GET /api/health
  Returns { "status": "ok", "last_run": "2026-07-09T00:00:00Z" }
```

### FastAPI App (`backend/api/main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="News Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict in production
    allow_methods=["GET"],
)

@app.get("/api/news")
async def get_news(sentiment: str = "All", date: str = None, page: int = 1, limit: int = 20):
    ...
```

### Tasks
- [ ] Set up FastAPI app with CORS enabled
- [ ] Implement `GET /api/news` with sentiment + date + pagination filters
- [ ] Implement `GET /api/news/sectors` (for frontend sector filter dropdown)
- [ ] Implement `GET /api/health` (returns last pipeline run timestamp)
- [ ] Add Pydantic response models for type safety
- [ ] Test all endpoints using FastAPI's auto-generated `/docs` (Swagger UI)

### Deliverable
- API returns filtered, paginated news data correctly
- Swagger docs available at `http://localhost:8000/docs`

---

## Phase 6 — Frontend Dashboard (React + Vite)

### Goals
- Build a clean, functional news dashboard
- Display news cards with all required fields
- Support filtering by sentiment and date

### Component Structure
```
src/
├── components/
│   ├── NewsCard.jsx         # Individual news card
│   ├── SentimentBadge.jsx  # Green/Red/Grey badge
│   ├── SectorTag.jsx       # Sector chip/tag
│   ├── FilterBar.jsx       # Sentiment + date filter controls
│   ├── SourceList.jsx      # Clickable source links
│   └── Navbar.jsx          # App header
├── pages/
│   └── Dashboard.jsx       # Main page
├── hooks/
│   └── useNews.js          # Custom hook for API calls
├── api/
│   └── newsApi.js          # Axios/fetch API client
└── App.jsx
```

### News Card Layout
Each card shows:
```
┌──────────────────────────────────────────────────────────┐
│  🟢 POSITIVE          Banking · Real Estate              │
├──────────────────────────────────────────────────────────┤
│  RBI cuts repo rate by 25 basis points                   │  ← Headline
│                                                          │
│  Summary: The Reserve Bank of India reduced the repo    │
│  rate by 25bps to 6.25%, the first cut in 4 years...   │
│                                                          │
│  Why it matters: Lower rates reduce borrowing costs     │
│  for banks, making loans cheaper for home buyers and    │
│  auto buyers, boosting Banking, Real Estate and Auto.   │
├──────────────────────────────────────────────────────────┤
│  Sources: Moneycontrol · ET Markets · LiveMint           │
│  📅 2 hours ago    [Read Original ↗]                    │
└──────────────────────────────────────────────────────────┘
```

### Tasks
- [ ] Initialize Vite + React project: `npm create vite@latest frontend -- --template react`
- [ ] Build `NewsCard.jsx` with all fields (headline, summary, reasoning, sources, time)
- [ ] Build `SentimentBadge.jsx` (green = Positive, red = Negative, grey = Neutral)
- [ ] Build `SectorTag.jsx` for primary + secondary sector chips
- [ ] Build `FilterBar.jsx` — Sentiment dropdown + Date picker
- [ ] Build `SourceList.jsx` — clickable source links that open original article
- [ ] Implement `useNews.js` hook with API call + loading/error states
- [ ] Implement auto-refresh indicator (shows "Last updated: X mins ago")
- [ ] Add empty state when no news matches filter
- [ ] Make layout responsive (mobile-friendly)

### Deliverable
- Dashboard loads news from API
- Filters work correctly (sentiment + date)
- Each card shows all required fields
- Source links open original articles in new tab

---

## Phase 7 — GitHub Actions Scheduler

### Goals
- Automate the full pipeline (fetch → filter → deduplicate → analyze → store) every hour
- Store API secrets securely

### Workflow File (`.github/workflows/fetch_news.yml`)
```yaml
name: Fetch & Analyze News

on:
  schedule:
    - cron: '0 * * * *'    # Every hour at :00 UTC
  workflow_dispatch:         # Manual trigger from GitHub UI

jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Cache pip dependencies
        uses: actions/cache@v4
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements.txt') }}

      - name: Install dependencies
        run: pip install -r backend/requirements.txt

      - name: Download SentenceTransformer model
        run: python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

      - name: Run news pipeline
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          DATABASE_URL:  ${{ secrets.DATABASE_URL }}
        run: python backend/pipeline/run.py

      - name: Report pipeline results
        run: echo "Pipeline completed successfully"
```

### GitHub Secrets to Configure
Go to: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|---|---|
| `GROQ_API_KEY` | Your Groq API key from console.groq.com |
| `DATABASE_URL` | PostgreSQL connection string (Supabase free tier recommended) |

### Tasks
- [ ] Create `.github/workflows/fetch_news.yml`
- [ ] Add `GROQ_API_KEY` and `DATABASE_URL` to GitHub repo secrets
- [ ] Test manual trigger from GitHub Actions tab → confirm pipeline runs end-to-end
- [ ] Verify cron trigger fires correctly after 1 hour
- [ ] Set up email/GitHub notifications on workflow failure
- [ ] Add SentenceTransformer model caching to avoid re-downloading on every run

### Deliverable
- GitHub Actions runs every hour automatically
- Pipeline output visible in Actions tab logs
- Failures trigger notifications

---

## Phase 8 — Integration & End-to-End Testing

### Goals
- Validate the complete pipeline works from RSS fetch → dashboard display
- Catch edge cases and error states

### Test Scenarios

| Scenario | Expected Behavior |
|---|---|
| RSS feed is down | Skip that source, log error, continue with others |
| Groq API returns error | Mark article `is_analyzed = false`, retry next cycle |
| All articles are duplicates | DB unchanged, no LLM calls made |
| Crypto article in feed | Filtered out by content filter, never reaches LLM |
| Same news from 5 sources | 1 article in DB with 5 sources in `sources[]` array |
| Filter by "Positive" on dashboard | Only positive sentiment articles shown |
| Filter by date | Only articles from selected date shown |
| DB is empty (first run) | All articles fetched, filtered, deduplicated, analyzed, stored |

### End-to-End Test Checklist
- [ ] Run `python backend/pipeline/run.py` locally → check DB has new articles
- [ ] Start FastAPI: `uvicorn backend.api.main:app --reload` → hit `/api/news` → valid JSON
- [ ] Start frontend: `npm run dev` → dashboard loads and displays cards
- [ ] Apply sentiment filter → cards update correctly
- [ ] Apply date filter → only that day's news shows
- [ ] Click source link → opens original article in new tab
- [ ] Run pipeline twice → confirm no duplicate articles in DB
- [ ] Feed a known crypto article URL → confirm it's filtered out

### Deliverable
- All test scenarios pass
- No duplicate articles after multiple pipeline runs
- Dashboard correctly reflects DB state

---

## Phase 9 — Deployment & Final Polish

### Goals
- Host backend and database for free
- Host frontend for free
- Ensure secrets are managed safely

### Free Hosting Stack

| Component | Hosting Option | Free Tier Limits |
|---|---|---|
| **Database** | **Supabase** | 500MB storage, 2 projects |
| **Backend API** | **Railway** or **Render** | 500 hours/month free |
| **Frontend** | **Vercel** or **GitHub Pages** | Unlimited for static sites |
| **Scheduler** | **GitHub Actions** | 2,000 min/month free |

### Deployment Steps

#### Database (Supabase)
1. Create account at supabase.com
2. New project → copy `DATABASE_URL` connection string
3. Run Alembic migrations against Supabase: `alembic upgrade head`
4. Add Supabase `DATABASE_URL` to GitHub Secrets

#### Backend API (Render)
1. Connect GitHub repo to Render
2. Set `Start Command`: `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables: `DATABASE_URL`, `GROQ_API_KEY`
4. Note the deployed URL (e.g., `https://news-intel-api.onrender.com`)

#### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set `Root Directory`: `frontend`
3. Add environment variable: `VITE_API_BASE_URL=https://news-intel-api.onrender.com`
4. Deploy → get public URL

#### Scheduler (GitHub Actions — already configured in Phase 7)
- Update `DATABASE_URL` secret to point to Supabase
- Confirm hourly runs continue working against hosted DB

### Tasks
- [ ] Create Supabase project and run migrations
- [ ] Deploy backend to Render and verify `/api/news` responds
- [ ] Deploy frontend to Vercel and verify dashboard loads
- [ ] Update GitHub Secrets with production values (Supabase DB URL)
- [ ] Test full flow on production: GitHub Actions → Supabase DB → Render API → Vercel UI
- [ ] Add `README.md` with setup instructions and architecture diagram
- [ ] Create `.env.example` documenting all required environment variables

### Deliverable
- Live, publicly accessible dashboard
- Hourly pipeline running automatically via GitHub Actions
- Zero monthly cost

---

## Phase 10 — Firebase Deployment (Spark Free Plan)

### Goals
Deploy the frontend using Firebase Hosting while keeping the backend on Render, adhering strictly to the **Spark (Free)** plan without requiring a credit card.

*Note: Firebase Cloud Functions (required to host the Python/FastAPI backend on Firebase) strictly require upgrading to the Blaze pay-as-you-go plan and entering a credit card. Therefore, to remain 100% free with no card required, we will only migrate the frontend to Firebase.*

### Steps
1. **Initialize Firebase Project**
   - Create a project on the Firebase Console.
   - Keep the default "Spark" (Free) plan.
2. **Deploy Frontend (Firebase Hosting)**
   - Initialize Firebase Hosting in the `frontend` directory: `firebase init hosting`
   - Set build folder to `dist`
   - Configure Firebase to rewrite all routes to `index.html` (for React Router).
   - Run `npm run build`
   - Deploy: `firebase deploy --only hosting`
3. **Backend Deployment (Keep on Render)**
   - Since the Spark plan doesn't support Python Cloud Functions, the backend will remain hosted on Render as configured in Phase 9.
4. **Update Frontend Environment Variables**
   - Ensure the Firebase-hosted React app points to the Render backend URL (`VITE_API_URL`).

### Tasks
- [ ] Set up Firebase Project & Firebase CLI locally.
- [ ] Configure Firebase Hosting for the React/Vite dashboard.
- [ ] Connect Firebase frontend to the existing Render backend URL.

### Deliverable
- React Dashboard hosted on Firebase Hosting (Spark Plan).
- Python API remaining on Render (Free Tier).

---

## Summary — Full Tech Stack (Final, Zero-Cost)

| Layer | Technology | Why |
|---|---|---|
| **Scheduler** | GitHub Actions (cron) | Free, no server, version-controlled |
| **RSS Fetcher** | `feedparser` (Python) | Handles all 9 free feeds |
| **Content Filter** | Keyword-based (Python) | Zero cost, fast |
| **Deduplication** | RapidFuzz + SentenceTransformers (`all-MiniLM-L6-v2`) | Local model, no API cost |
| **LLM** | Groq (`llama-3.1-8b-instant`) | Free tier, ultra-fast |
| **Backend** | FastAPI + SQLAlchemy + Alembic | Async, typed, production-ready |
| **Database** | PostgreSQL via Supabase | Free 500MB hosted |
| **Frontend** | React + Vite | Fast, component-based |
| **Frontend Hosting** | Vercel | Free, auto-deploys on push |
| **Backend Hosting** | Render | Free 500 hrs/month |

---

*Implementation plan derived from: `architecture.md` + `context.md`*
*Project: AI-Powered Indian Stock Market News Intelligence Platform*
