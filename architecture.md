# Architecture: AI-Powered Indian Stock Market News Intelligence Platform

---

## 1. High-Level Architecture Overview

The system follows a **pipeline architecture** with five distinct layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA INGESTION LAYER                        │
│   RSS Feed Fetcher (Scheduler: every 1 hour)                        │
│   Sources: Moneycontrol | ET Markets | LiveMint | Business Standard  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        PROCESSING LAYER                              │
│   1. Content Filter (exclude irrelevant categories)                  │
│   2. Duplicate Detector (semantic similarity / hash-based)           │
│   3. Article Deduplicator + Source Merger                           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          AI ANALYSIS LAYER                           │
│   LLM Engine: Analyze NEW articles only                             │
│   Output: Summary | Sentiment | Sector Impact | Reasoning           │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          STORAGE LAYER                               │
│   Database: Article metadata + AI analysis + Sources + Timestamps   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                           │
│   Dashboard: News Cards | Filters | Archive | Source Links          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Scheduler (Trigger Layer)

- **Type:** GitHub Actions Cron Workflow (free, no infrastructure required)
- **Frequency:** Every 1 hour
- **Responsibility:** Triggers the news ingestion pipeline automatically by running the Python backend script on schedule
- **Why GitHub Actions:** Free for public repos (2,000 min/month for private too), no separate server needed, version-controlled workflow config

#### GitHub Actions Workflow (`.github/workflows/fetch_news.yml`)
```yaml
name: Fetch & Analyze News

on:
  schedule:
    - cron: '0 * * * *'   # Every hour at :00
  workflow_dispatch:       # Manual trigger anytime from GitHub UI

jobs:
  run-pipeline:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run news pipeline
        env:
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          DATABASE_URL:  ${{ secrets.DATABASE_URL }}
        run: python pipeline/run.py
```

> **Note:** Secrets (`GROQ_API_KEY`, `DATABASE_URL`) are stored safely in GitHub repo Settings → Secrets — never in code.

```
[GitHub Actions Cron]
      |
      |-- every 60 minutes --> triggers --> [RSS Fetcher]
```

---

### 2.2 Data Ingestion Layer (RSS Fetcher)

- **Responsibility:** Fetch latest articles from RSS feeds of all configured news sources
- **Technology Options:** `feedparser` (Python), `rss-parser` (Node.js)

#### Free Public RSS Feed Sources

> All feeds below are **100% free** — no API key, no subscription required.

| Source | RSS Feed URL | Section |
|---|---|---|
| Moneycontrol | `https://www.moneycontrol.com/rss/latestnews.xml` | Latest News |
| Moneycontrol Markets | `https://www.moneycontrol.com/rss/marketreports.xml` | Market Reports |
| Economic Times Markets | `https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms` | Markets |
| Economic Times Economy | `https://economictimes.indiatimes.com/economy/rssfeeds/1373380680.cms` | Economy |
| LiveMint | `https://www.livemint.com/rss/markets` | Markets |
| Business Standard | `https://www.business-standard.com/rss/markets-106.rss` | Markets |
| Business Standard Economy | `https://www.business-standard.com/rss/economy-policy-102.rss` | Economy |
| Financial Express | `https://www.financialexpress.com/market/feed/` | Markets |
| NDTV Profit | `https://feeds.feedburner.com/ndtvprofit-latest` | Business |

> **Upgrade path:** Premium APIs (Bloomberg, Refinitiv) can be added later as pluggable source adapters — zero refactoring required.

#### Data Extracted per Article
```json
{
  "title":        "Article headline",
  "url":          "https://...",
  "published_at": "ISO 8601 timestamp",
  "source":       "Moneycontrol",
  "description":  "Short preview text from feed",
  "content":      "Full article body (if available)"
}
```

---

### 2.3 Processing Layer

#### 2.3.1 Content Filter

- **Purpose:** Exclude irrelevant articles before any expensive processing
- **Method:** Keyword-based filtering + optional LLM-assisted classification
- **Excluded Categories:**

| Category | Example Keywords to Detect |
|---|---|
| Cryptocurrency | bitcoin, crypto, ethereum, NFT, blockchain |
| Entertainment | bollywood, movie, film, celebrity, award |
| Sports | cricket, IPL, football, tennis, Olympics |
| Lifestyle | travel, food, fashion, health, wellness |
| General news | no mention of listed companies / sectors |

- **Approach:** Title + description keyword scan first (fast path); if ambiguous → LLM classification (slow path)

#### 2.3.2 Duplicate Detector

- **Purpose:** Identify articles reporting the same news event across multiple publishers
- **Method:**

```
Step 1: URL-based exact duplicate check (fastest — O(1) hash lookup)
         ↓
Step 2: Title-based fuzzy match using RapidFuzz (Levenshtein distance > 85%)
         ↓
Step 3: Semantic similarity using free local SentenceTransformers
         Model: all-MiniLM-L6-v2 (runs locally, no API cost)
         Threshold: cosine similarity > 0.92
```

> **Cost:** Steps 1 & 2 are free. Step 3 uses a local model — **no API calls, no cost**.

#### 2.3.3 Article Merger

- **Purpose:** Combine duplicate articles into a single canonical news item
- **Output:** One article record with a `sources[]` array containing all publishers that reported the event
- **Canonical source selection:** Earliest published article is the base; others are appended as additional sources

```json
{
  "canonical_title": "RBI cuts repo rate by 25bps",
  "sources": [
    { "name": "Moneycontrol", "url": "...", "published_at": "..." },
    { "name": "Economic Times", "url": "...", "published_at": "..." },
    { "name": "LiveMint", "url": "...", "published_at": "..." }
  ]
}
```

---

### 2.4 AI Analysis Layer (LLM Engine)

- **Trigger:** Runs only on **NEW, deduplicated** articles (never re-analyzes already stored items)
- **LLM Provider:** **Groq** (free tier) — extremely fast inference, no upfront cost
- **Model:** `llama-3.1-8b-instant` or `llama-3.3-70b-versatile` (both free on Groq)

#### Why Groq?
| Feature | Detail |
|---|---|
| **Cost** | Free tier — no credit card required for moderate usage |
| **Speed** | Industry-leading inference speed (up to 750 tokens/sec) |
| **Models** | Llama 3.1 8B / 70B, Gemma 2, Mixtral — all free |
| **API** | OpenAI-compatible — easy Python SDK integration |
| **Rate Limits** | Free: ~14,400 requests/day, 30 req/min — sufficient for hourly RSS runs |

#### Groq API Integration
```python
from groq import Groq

client = Groq(api_key=os.environ["GROQ_API_KEY"])

response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": f"Title: {title}\n\nDescription: {description}"}
    ],
    response_format={"type": "json_object"}  # Forces structured JSON output
)
```

#### Prompt Design (Structured Output)

The LLM is given the article title + description and asked to return a structured JSON response:

```json
{
  "summary":            "2-3 line summary of the news",
  "sentiment":          "Positive | Negative | Neutral",
  "primary_sector":     "Banking",
  "secondary_sector":   "Real Estate",
  "reasoning":          "RBI rate cut reduces borrowing costs, benefiting banks..."
}
```

#### Sentiment Evaluation Rules
- Evaluated strictly from the **Indian stock market perspective**
- NOT emotional sentiment of the news itself
- Examples:
  - RBI repo rate cut → **Positive** (Banking, Auto, Real Estate)
  - Crude oil price rise → **Negative** (Aviation, Paints, Tyres)
  - Strong GDP data → **Positive** (Broad market)
  - IT layoffs abroad → **Negative** (IT sector)

#### Indian Market Sectors Taxonomy

| Sector | Sub-areas |
|---|---|
| Banking & Finance | PSU Banks, Private Banks, NBFCs |
| Information Technology | IT Services, SaaS, BPO |
| Energy | Oil & Gas, Power, Renewables |
| Automobiles | Passenger Vehicles, EVs, Auto Components |
| Real Estate | Residential, Commercial, REITs |
| FMCG | Consumer Goods, Food & Beverages |
| Pharma & Healthcare | Generics, APIs, Hospitals |
| Infrastructure | Roads, Ports, Railways |
| Metals & Mining | Steel, Aluminium, Copper |
| Aviation | Airlines, Airport operators |
| Telecom | Wireless, Broadband |
| Agriculture | Fertilizers, Agri inputs |

---

### 2.5 Storage Layer (Database)

#### Database Schema

**Articles Table**
```sql
CREATE TABLE articles (
  id              UUID PRIMARY KEY,
  canonical_title TEXT NOT NULL,
  published_at    TIMESTAMP NOT NULL,
  fetched_at      TIMESTAMP DEFAULT NOW(),
  is_analyzed     BOOLEAN DEFAULT FALSE,
  is_duplicate    BOOLEAN DEFAULT FALSE
);
```

**Sources Table**
```sql
CREATE TABLE sources (
  id          UUID PRIMARY KEY,
  article_id  UUID REFERENCES articles(id),
  source_name TEXT NOT NULL,         -- e.g. "Moneycontrol"
  url         TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMP
);
```

**AI Analysis Table**
```sql
CREATE TABLE ai_analysis (
  id                UUID PRIMARY KEY,
  article_id        UUID REFERENCES articles(id) UNIQUE,
  summary           TEXT,
  sentiment         TEXT CHECK (sentiment IN ('Positive','Negative','Neutral')),
  primary_sector    TEXT,
  secondary_sector  TEXT,
  reasoning         TEXT,
  analyzed_at       TIMESTAMP DEFAULT NOW()
);
```

#### Database Technology Options

| Option | Best For |
|---|---|
| **PostgreSQL** | Recommended — relational, reliable, supports full-text search |
| SQLite | Dev/local only — zero-config, file-based |
| MongoDB | If schema flexibility is preferred |
| Supabase | PostgreSQL with built-in REST API + Auth |

---

### 2.6 Presentation Layer (Frontend Dashboard)

#### Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]    News Intelligence Platform         [🔄 Refresh]│
├──────────────────────────────────────────────────────────┤
│  Filters: [All] [Positive] [Negative] [Date: ▼]         │
├──────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────┐                  │
│  │ 🟢 POSITIVE  |  Banking, Real Estate                 │
│  │ Headline: RBI cuts repo rate by 25bps                │
│  │ Summary: The Reserve Bank of India...                │
│  │ Reasoning: Lower rates reduce borrowing costs...     │
│  │ Sources: Moneycontrol · ET Markets · LiveMint        │
│  │ Published: 2 hours ago  [Read Original ↗]            │
│  └────────────────────────────────────┘                  │
│  ┌────────────────────────────────────┐                  │
│  │ 🔴 NEGATIVE  |  Aviation, Paints                     │
│  │ Headline: Crude oil surges to $95/barrel             │
│  │ ...                                                   │
│  └────────────────────────────────────┘                  │
└──────────────────────────────────────────────────────────┘
```

#### Frontend Technology Options

| Option | Notes |
|---|---|
| **React + Vite** | Recommended — fast, component-based |
| Next.js | If SSR / SEO matters |
| Plain HTML + JS | Minimal option for MVP |

#### API Contract (Backend → Frontend)

```
GET /api/news
  ?sentiment=Positive|Negative|Neutral
  ?date=YYYY-MM-DD
  ?page=1&limit=20

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
      "sources": [ { "name": "...", "url": "..." } ],
      "published_at": "2026-07-08T12:00:00Z"
    }
  ],
  "total": 48,
  "page": 1
}
```

---

## 3. Technology Stack (Recommended)

| Layer | Technology | Cost | Reason |
|---|---|---|---|
| **Scheduler** | **GitHub Actions** (cron) | ✅ Free | No server needed, version-controlled, easy secrets management |
| **RSS Fetcher** | `feedparser` (Python) | ✅ Free | Mature library, handles all major RSS/Atom formats |
| **Duplicate Detection** | RapidFuzz + SentenceTransformers (`all-MiniLM-L6-v2`) | ✅ Free | Local model, no API cost |
| **LLM Engine** | **Groq API** (`llama-3.1-8b-instant`) | ✅ Free tier | Ultra-fast, OpenAI-compatible, generous free limits |
| **Backend API** | FastAPI (Python) | ✅ Free | Async, auto-docs, fast |
| **Database** | PostgreSQL (local) / Supabase (hosted free tier) | ✅ Free | Reliable, relational, Supabase free tier = 500MB |
| **ORM** | SQLAlchemy / Alembic | ✅ Free | Migrations + type safety |
| **Frontend** | React + Vite | ✅ Free | Component-based, fast dev |
| **Hosting (Frontend)** | Vercel / GitHub Pages | ✅ Free | Zero-cost static hosting |

> **Total infrastructure cost for MVP: ₹0 / $0**

---

## 4. Data Flow Diagram (End-to-End)

```
[Free Public RSS Feeds]
        |
        | (every 1 hour via GitHub Actions cron)
        ▼
[RSS Fetcher Service]
        |
        | raw article list
        ▼
[Content Filter]  ──(irrelevant)──► DISCARD
        |
        | relevant articles only
        ▼
[Duplicate Detector]
        |
        |── (duplicate found) ──► Merge into existing article + add source
        |
        | (new unique article)
        ▼
[Groq LLM Analysis Service]
        |
        | structured JSON response
        ▼
[Database]
   ├── articles table
   ├── sources table
   └── ai_analysis table
        |
        ▼
[FastAPI Backend]  ◄──── HTTP GET /api/news ────  [React Dashboard]
                                                          |
                                                   User views news cards
                                                   with filters by sentiment / date
```

---

## 5. Groq Free Tier — Usage & Optimization

Groq's free tier limits and how this system stays within them:

| Groq Free Limit | Our Usage | Status |
|---|---|---|
| 14,400 requests/day | ~24 runs/day × ~10–20 new articles = ~240–480 requests/day | ✅ Well within limits |
| 30 requests/minute | Articles processed sequentially with small delay | ✅ Safe |
| 6,000 tokens/minute | Short prompts (title + description ~200 tokens) | ✅ Safe |

#### Strategies to Minimize API Calls

| Strategy | Description |
|---|---|
| **New-only analysis** | Only analyze articles NOT yet in the database — skip already-stored ones |
| **Deduplication first** | Deduplicate before calling Groq — one LLM call per unique story, not per source |
| **Permanent caching** | Store analysis in DB; never re-call Groq for the same article |
| **Short context** | Send title + description only (~150–200 tokens) — not the full article body |
| **Keyword pre-filter** | Discard irrelevant articles before they ever reach the LLM |

> **Upgrade path:** If volume grows, switch to `llama-3.3-70b-versatile` for better quality, or move to Groq's paid tier — still significantly cheaper than OpenAI.

---

## 6. Scalability Considerations

| Concern | Approach |
|---|---|
| More news sources | Add new RSS feed URLs to config — no code changes required |
| Higher article volume | Horizontal scaling of fetcher + async processing queue (Celery + Redis) |
| LLM provider swap | Abstract LLM calls behind a service interface — swap provider by config |
| Premium API support | Pluggable source adapters — RSS adapter today, API adapter tomorrow |
| Historical archive growth | Implement date-based table partitioning in PostgreSQL |

---

## 7. Security & Reliability

- **Rate limiting:** Respect RSS source rate limits (implement exponential backoff on failure)
- **Error handling:** If LLM call fails, mark article as `is_analyzed = false` and retry in next cycle
- **Data integrity:** Use database transactions when writing article + sources + analysis atomically
- **API security:** Backend API protected with API key or JWT for future multi-user support

---

## 8. Open Architecture Decisions (To Discuss)

| Decision | Resolved? | Decision Made |
|---|---|---|
| **Scheduler** | ✅ Yes | GitHub Actions cron (free, no server) |
| **LLM provider** | ✅ Yes | Groq free tier — `llama-3.1-8b-instant` |
| **News sources** | ✅ Yes | Free public RSS feeds only (9 feeds configured) |
| **Duplicate detection** | ✅ Yes | RapidFuzz + local SentenceTransformers (free) |
| **Relevance filtering** | ⏳ Pending | Hybrid: keyword rules first, Groq for ambiguous |
| **Historical retention** | ⏳ Pending | Suggest 90 days for MVP; discuss archival policy |
| **Database hosting** | ⏳ Pending | Local PostgreSQL for dev; Supabase free tier for prod |
| **Frontend framework** | ⏳ Pending | React + Vite recommended |
| **Frontend hosting** | ⏳ Pending | Vercel or GitHub Pages (both free) |

---

*Architecture derived from: `context.md` — AI-Powered Indian Stock Market News Intelligence Platform*
