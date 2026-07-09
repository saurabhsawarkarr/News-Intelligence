# Project Context: AI-Powered Indian Stock Market News Intelligence Platform

---

## Project Title
**AI-Powered Indian Stock Market News Intelligence Platform**

---

## Background

Indian stock market traders and researchers rely on multiple financial news platforms such as:
- Moneycontrol
- Economic Times
- LiveMint
- Business Standard
- Reuters India

**Key problems:**
- Important news is scattered across different sources.
- Multiple articles often report the same event, causing repetitive reading.
- Traders spend significant time before understanding how news may impact different market sectors.
- For active traders, **speed is critical** — delays lead to missed trading opportunities or delayed decision-making.

**Need:** A centralized platform that:
- Continuously monitors trusted Indian financial news sources.
- Removes duplicate stories.
- Uses AI to summarize news and explain its potential impact on the Indian stock market.

---

## Objective

Design and build an **AI-powered news intelligence platform** that:
1. Automatically collects financial news from multiple trusted Indian news sources.
2. Analyzes each article using a **Large Language Model (LLM)**.
3. Presents **concise, actionable insights** for traders and market researchers.

### The platform should help users understand:
- What happened?
- Which sector is likely to be affected?
- Whether the news is **positive or negative** from an Indian stock market perspective.
- Why that sector may be impacted.

> **Note:** The platform is **not** intended to predict stock prices or provide investment advice. Its purpose is to organize and explain market-relevant news in a structured and time-efficient manner.

---

## News Sources

### Included Sources
- Moneycontrol
- Economic Times Markets
- LiveMint
- Business Standard
- Reuters India *(where available)*

### Focus
The system should focus **only** on news relevant to the **Indian stock market**.

### Excluded Categories
- Cryptocurrency
- Entertainment
- Celebrity News
- Sports
- General lifestyle content
- Any article with no meaningful impact on listed Indian companies or market sectors

> *(Note: The filtering criteria for "no meaningful impact" requires further discussion)*

---

## System Workflow

### Step 1 — News Collection
- Automatically fetch the latest financial news **every one hour** using multiple RSS feeds.

### Step 2 — Duplicate Detection
- Identify duplicate stories (since multiple publishers often report the same event).
- Merge them into a **single consolidated news item** with multiple source references.
- Instead of showing five nearly identical articles → show **one item with all sources listed**.

### Step 3 — AI Analysis
Each unique news article is analyzed by an LLM, which generates:

| Output Field | Description |
|---|---|
| **Short Summary** | 2-3 line summary of the article |
| **Market Sentiment** | Positive / Negative / Neutral |
| **Primary Affected Sector** | The main sector impacted |
| **Secondary Affected Sector** | If applicable |
| **Reasoning** | Why this sector may be affected |

> **Important:** Sentiment must be evaluated **from the perspective of the Indian stock market**, not from emotional sentiment.
>
> **Examples:**
> - RBI repo rate cut → Positive for Banking, Auto, and Real Estate
> - Increase in crude oil prices → Negative for Aviation and Paint companies

The system should focus on **sector-level impact**, not individual stock movements.

### Step 4 — Data Storage
The platform should store:
- Original news article metadata
- AI-generated analysis
- Source information
- Timestamp

Historical data should be preserved to allow users to browse previous news.

> *(Note: Retention/archival policy requires further discussion)*

### Step 5 — Dashboard
The frontend presents news in a **clean dashboard**.

**Each news card displays:**
- Headline
- AI-generated summary
- Positive / Negative sentiment badge
- Primary affected sector
- Secondary affected sector *(if available)*
- AI reasoning
- Published time
- News source(s)
- Link to the original article

**Filters available:**
- Filter by Sentiment: Positive / Negative
- Filter by Date
- Archive support for historical news

---

## System Architecture (Workflow Diagram)

```
Scheduler
    |
    v
Fetch RSS Feeds
    |
    v
Remove Duplicates
    |
    v
Analyze only NEW articles (via LLM)
    |
    v
Store Results
    |
    v
Update Dashboard
```

**Refresh Frequency:** Every **1 hour** (automatic)

---

## Functional Requirements

The application must:
- Fetch news automatically every hour
- Aggregate multiple RSS feeds
- Remove duplicate news articles
- Analyze news using an LLM
- Generate concise AI summaries
- Identify affected market sectors (primary and secondary)
- Classify news as Positive / Negative / Neutral from a market perspective
- Store historical news
- Display structured results through a dashboard

---

## Non-Functional Requirements

The platform must:
- Avoid duplicate news entries
- Minimize unnecessary LLM API calls (only analyze NEW articles)
- Store AI-generated analysis for future viewing without re-calling the LLM
- Support future addition of premium news APIs
- Be **modular and scalable** in architecture

---

## Out of Scope (MVP — Version 1)

The first version will **not** include:
- Stock price prediction
- Buy/Sell recommendations
- Company-level stock recommendations
- Real-time alerts
- Push notifications
- Portfolio tracking
- Watchlists
- Cryptocurrency news
- Global market analysis *(unless directly impacting Indian markets)*

---

## Expected Outcome

Within **two minutes** of opening the dashboard, a trader should be able to:
1. Understand what important market news occurred recently.
2. Know which sectors are likely to be affected.
3. Determine whether the impact is positive or negative from a market perspective.
4. Understand why those sectors may be affected.
5. See which original news sources reported the event.

---

## Open Discussion Points

- **Relevance filtering:** How to determine if an article has "no meaningful impact" on listed Indian companies — needs a defined ruleset or LLM-assisted filtering.
- **Historical data retention:** How far back should historical news be stored? What is the archival/purge policy?

---

*Context generated from: Problemstatement.txt (287 lines, 11,032 bytes)*
