# Edge Cases & Corner Scenarios: AI-Powered Indian Stock Market News Intelligence Platform

> This document catalogues every identified corner case across all layers of the system —
> ingestion, processing, AI analysis, storage, API, frontend, and scheduler.
> Each entry includes the scenario, expected behavior, and recommended handling strategy.

---

## Layer 1 — RSS Fetcher Edge Cases

### 1.1 RSS Feed is Completely Down
- **Scenario:** A news source (e.g., Moneycontrol) returns a connection timeout or HTTP 5xx error.
- **Risk:** Pipeline crashes, other sources are skipped.
- **Expected Behavior:** Log the failure, skip that source, continue fetching from remaining 8 feeds.
- **Handling:**
  ```python
  try:
      parsed = feedparser.parse(feed["url"])
  except Exception as e:
      log.error(f"Feed {feed['name']} failed: {e}")
      continue  # Don't crash the whole pipeline
  ```

---

### 1.2 RSS Feed Returns Empty (0 Articles)
- **Scenario:** Feed parses successfully but `parsed.entries` is empty — could be a server hiccup or maintenance window.
- **Risk:** Missed articles assumed to not exist.
- **Expected Behavior:** Log a warning, treat as 0 new articles from that source, do not raise error.
- **Handling:** Check `len(parsed.entries) == 0` and log `"Feed returned 0 entries"`.

---

### 1.3 RSS Feed Returns Malformed XML
- **Scenario:** The RSS XML is partially corrupted (e.g., unclosed tags). `feedparser` handles many cases but not all.
- **Risk:** Silent data loss — partial article list.
- **Expected Behavior:** `feedparser` returns what it can; log a warning if `parsed.bozo == True` (feedparser's malformed feed flag).
- **Handling:**
  ```python
  if parsed.bozo:
      log.warning(f"Malformed feed from {feed['name']}: {parsed.bozo_exception}")
  ```

---

### 1.4 Article Has No Title
- **Scenario:** An RSS entry is missing the `<title>` tag.
- **Risk:** Empty string passed to deduplicator and LLM — meaningless output.
- **Expected Behavior:** Skip the article entirely.
- **Handling:** `if not entry.get("title", "").strip(): continue`

---

### 1.5 Article Has No URL / Link
- **Scenario:** An RSS entry is missing the `<link>` tag.
- **Risk:** Cannot deduplicate by URL, cannot display "Read Original" link.
- **Expected Behavior:** Skip the article — a URL-less article cannot be traced back to its source.
- **Handling:** `if not entry.get("link", "").strip(): continue`

---

### 1.6 Article Has No Description / Summary
- **Scenario:** RSS entry has a title but no `<description>` or `<summary>`.
- **Risk:** LLM only gets the title — very short context, potentially poor analysis quality.
- **Expected Behavior:** Pass only the title to the LLM; include a note in the prompt to work with limited context.
- **Handling:** Use `description = entry.get("summary", "") or ""` — pass title alone if empty.

---

### 1.7 Article Published Date is Missing or Unparseable
- **Scenario:** The `<pubDate>` field is absent or in an unexpected format.
- **Risk:** Articles appear out of order; date filter on dashboard breaks.
- **Expected Behavior:** Fall back to `fetched_at` (the time the pipeline ran) as the published date.
- **Handling:**
  ```python
  published_at = parse_date(entry.get("published", "")) or datetime.utcnow()
  ```

---

### 1.8 Article Published Date is in the Future
- **Scenario:** A source publishes an article with a future timestamp (scheduling error on their end).
- **Risk:** Article appears at top of dashboard with a wrong date.
- **Expected Behavior:** Cap `published_at` to `datetime.utcnow()` if it exceeds current time by more than 1 hour.
- **Handling:** `if published_at > datetime.utcnow() + timedelta(hours=1): published_at = datetime.utcnow()`

---

### 1.9 Article Published Date is Very Old (> 7 Days)
- **Scenario:** An RSS feed occasionally resurfaces very old articles.
- **Risk:** Stale news appears on the dashboard as if it's fresh.
- **Expected Behavior:** Discard articles older than 48 hours (configurable threshold).
- **Handling:** `if (datetime.utcnow() - published_at).days > 2: skip`

---

### 1.10 Duplicate URLs Across Different Sources
- **Scenario:** Two sources (e.g., ET Markets and NDTV Profit) link to the exact same external article URL (e.g., a syndicated Reuters piece).
- **Risk:** Treated as one article from one source — second source attribution is lost.
- **Expected Behavior:** URL match → merge sources → single article with both source names listed.
- **Handling:** URL deduplication step merges sources[] before returning.

---

### 1.11 RSS Feed URL Permanently Changes (301/302 Redirect)
- **Scenario:** A source changes its RSS feed URL and the old one now redirects.
- **Risk:** feedparser may or may not follow redirects depending on config.
- **Expected Behavior:** `feedparser` follows redirects by default; log the new URL as a warning so it can be updated in config.

---

### 1.12 Same Article Re-Published by the Same Source
- **Scenario:** A source updates an article and re-publishes it with the same URL but a newer `pubDate`.
- **Risk:** Treated as already-seen (URL exists in DB) so the updated content is ignored.
- **Expected Behavior (MVP):** Skip — URL already exists. Log that an update was detected.
- **Future Enhancement:** Store `updated_at` and optionally re-analyze if content changed significantly.

---

## Layer 2 — Content Filter Edge Cases

### 2.1 Mixed-Topic Article (Partially Relevant)
- **Scenario:** An article covers both a market event and an unrelated topic (e.g., "RBI rate cut celebrated by celebrities at award show").
- **Risk:** Keyword filter may exclude it due to "celebrity" keyword even though it's market-relevant.
- **Expected Behavior:** Title takes priority — if the title contains market terms, allow it through regardless of description keywords.
- **Handling:** Apply exclusion keywords only to description; apply allow-list (sector keywords) to title.

---

### 2.2 Cricket-Finance Crossover Articles
- **Scenario:** "BCCI signs ₹5000 Cr media rights deal — impact on media stocks" — cricket keyword "BCCI" but highly market-relevant.
- **Risk:** Filtered out by "Sports" keyword category.
- **Expected Behavior:** Override filter if title explicitly mentions "stocks", "shares", "market impact", "NSE", "BSE", etc.
- **Handling:** Add a market-relevance override allow-list that bypasses exclusion keywords.

---

### 2.3 Crypto Article Mentioning Indian Companies
- **Scenario:** "Infosys subsidiary launches blockchain platform" — contains "blockchain" (crypto keyword) but is about an IT company.
- **Risk:** Filtered out incorrectly.
- **Expected Behavior:** "blockchain" alone should not exclude — require at least 2 crypto-specific keywords (e.g., "blockchain" + "bitcoin/crypto/token") to trigger exclusion.
- **Handling:** Use keyword count threshold, not single-keyword exclusion for ambiguous terms.

---

### 2.4 Article in Hindi / Regional Languages
- **Scenario:** Some RSS feeds (especially NDTV) occasionally include Hindi articles.
- **Risk:** Keyword filter fails (keywords are English). LLM may produce lower-quality analysis.
- **Expected Behavior (MVP):** Detect non-English content using `langdetect` library and skip it.
- **Handling:** `from langdetect import detect; if detect(title) != 'en': skip`

---

### 2.5 Extremely Short Article Description (< 20 Words)
- **Scenario:** Breaking news alerts with just a headline and a 5-word description like "Markets rally. Sensex up 500 points."
- **Risk:** LLM produces very generic analysis with low confidence.
- **Expected Behavior:** Still analyze — short context is acceptable. Mark `low_context = true` in DB for future quality filtering.

---

### 2.6 Article Is a Listicle / Newsletter Digest
- **Scenario:** "Top 10 stocks to watch today" — covers many topics at once.
- **Risk:** LLM is asked to identify one primary sector but the article covers 10 different sectors.
- **Expected Behavior:** LLM should return the most prominently mentioned sector. Set sentiment to `Neutral` if no clear directional call is possible.

---

## Layer 3 — Deduplication Edge Cases

### 3.1 Same Story, Wildly Different Headlines
- **Scenario:**
  - "RBI slashes repo rate by quarter percent" (Moneycontrol)
  - "Central bank eases monetary policy in surprise move" (Business Standard)
  - Both report the same RBI rate cut event.
- **Risk:** Fuzzy title match fails (low string similarity). Semantic match needed.
- **Expected Behavior:** Semantic similarity (SentenceTransformers step) catches this — cosine similarity > 0.92.
- **Handling:** Ensure Step 3 (semantic) always runs after Step 2 (fuzzy) misses.

---

### 3.2 Similar Headlines, Different Events
- **Scenario:**
  - "Sensex rises 300 points on RBI rate cut" (Monday)
  - "Sensex rises 280 points on positive global cues" (Tuesday)
- **Risk:** Fuzzy match flags these as duplicates — they are NOT the same event.
- **Expected Behavior:** Date comparison as a deduplication gate — if `published_at` differs by > 6 hours, treat as separate events regardless of title similarity.
- **Handling:** Add `time_window_hours=6` as a deduplication constraint.

---

### 3.3 Two Completely Different Articles with the Same Headline
- **Scenario:** Both ET Markets and Moneycontrol publish "Nifty closes above 25,000" on the same day — but these are separate articles written independently with different content.
- **Risk:** Merged as one article, losing one source's unique perspective.
- **Expected Behavior (MVP):** Same title + same date window → treat as duplicate, merge sources. (Unique perspectives are a "nice to have" for v2.)

---

### 3.4 Embeddings Model Not Downloaded (First Run)
- **Scenario:** GitHub Actions environment is fresh; `all-MiniLM-L6-v2` hasn't been cached yet.
- **Risk:** Pipeline delays significantly on first run; may timeout on slow connections.
- **Expected Behavior:** Pre-download the model in a dedicated GitHub Actions step before the pipeline runs. Cache using `actions/cache`.
- **Handling:** Add a `Download model` step in `fetch_news.yml` (already in implementation plan).

---

### 3.5 Deduplication When DB is Empty (First-Ever Run)
- **Scenario:** No articles exist in DB yet — no URLs to check against, no existing embeddings.
- **Risk:** All 3 deduplication steps run correctly but only against each other (within the current batch), not against DB.
- **Expected Behavior:** Within-batch deduplication still runs correctly. After save, subsequent runs check against DB.
- **Handling:** Load existing URLs from DB before deduplication. On first run, `existing_urls = set()` — this is valid.

---

### 3.6 Very Large Batch of Articles (> 200 in One Run)
- **Scenario:** After a downtime, the pipeline runs and fetches 200+ articles at once.
- **Risk:** SentenceTransformer encoding + cosine similarity comparisons become slow (O(n²) in naive implementation).
- **Expected Behavior:** Process in batches of 50; use vectorized cosine similarity (not nested loops).
- **Handling:** Use `util.cos_sim(batch_embeddings, existing_embeddings)` matrix operation for efficiency.

---

## Layer 4 — Groq LLM Analysis Edge Cases

### 4.1 Groq API Key is Invalid / Expired
- **Scenario:** The `GROQ_API_KEY` secret in GitHub Actions is wrong or has been rotated.
- **Risk:** All LLM calls fail silently; articles are stored but never analyzed.
- **Expected Behavior:** Detect `401 Unauthorized` from Groq → log a critical error → fail the GitHub Actions workflow loudly (exit code 1).
- **Handling:** Check API key validity at pipeline startup before processing articles.

---

### 4.2 Groq Returns Rate Limit Error (429)
- **Scenario:** The pipeline sends too many requests too quickly, hitting the 30 req/min free tier limit.
- **Risk:** Articles after the 30th in a batch are never analyzed.
- **Expected Behavior:** Catch `429 Too Many Requests` → wait 60 seconds → retry the same article.
- **Handling:**
  ```python
  if response.status_code == 429:
      time.sleep(60)
      retry()
  ```

---

### 4.3 Groq Returns Invalid JSON (Malformed Response)
- **Scenario:** Even with `response_format={"type": "json_object"}`, the LLM occasionally returns trailing text or malformed JSON.
- **Risk:** `json.loads()` raises an exception; article remains unanalyzed.
- **Expected Behavior:** Catch `json.JSONDecodeError` → attempt to extract JSON from response using regex → if still invalid, mark article for retry.
- **Handling:**
  ```python
  import re
  match = re.search(r'\{.*\}', response_text, re.DOTALL)
  if match:
      return json.loads(match.group())
  ```

---

### 4.4 LLM Returns Wrong Sentiment Label
- **Scenario:** LLM returns `"sentiment": "positive"` (lowercase) or `"sentiment": "Bullish"` instead of the expected `"Positive"`.
- **Risk:** DB stores an invalid value; frontend badge breaks.
- **Expected Behavior:** Normalize sentiment to title case; map synonyms to valid labels.
- **Handling:**
  ```python
  SENTIMENT_MAP = {
      "positive": "Positive", "bullish": "Positive", "good": "Positive",
      "negative": "Negative", "bearish": "Negative", "bad": "Negative",
      "neutral":  "Neutral",  "mixed": "Neutral",    "unclear": "Neutral"
  }
  sentiment = SENTIMENT_MAP.get(raw.lower(), "Neutral")
  ```

---

### 4.5 LLM Returns Unknown / Hallucinated Sector Name
- **Scenario:** LLM returns `"primary_sector": "Edtech"` or `"primary_sector": "Space Industry"` — not in our taxonomy.
- **Risk:** Frontend sector filter breaks; inconsistent data in DB.
- **Expected Behavior:** Validate against the 12-sector taxonomy; if unknown, map to `"Other"` and log.
- **Handling:** Maintain a `VALID_SECTORS` set; `if sector not in VALID_SECTORS: sector = "Other"`

---

### 4.6 LLM Response Missing Required Fields
- **Scenario:** LLM returns JSON but omits `"reasoning"` or `"secondary_sector"`.
- **Risk:** DB insert fails due to missing non-nullable fields.
- **Expected Behavior:** Apply default values for optional fields; retry if required fields are missing.
- **Handling:**
  ```python
  analysis.setdefault("secondary_sector", None)
  analysis.setdefault("reasoning", "No reasoning provided.")
  if not analysis.get("summary") or not analysis.get("sentiment"):
      retry()
  ```

---

### 4.7 LLM Refuses to Analyze (Content Policy)
- **Scenario:** LLM refuses to process an article it deems sensitive (e.g., about sanctions, political controversy).
- **Risk:** Returns a refusal message instead of JSON.
- **Expected Behavior:** Catch non-JSON response → mark article `is_analyzed = false` → log article title for manual review.

---

### 4.8 Groq Service is Completely Down
- **Scenario:** Groq has an outage (it happens — all cloud services do).
- **Risk:** All articles in this run are unanalyzed.
- **Expected Behavior:** Articles are stored with `is_analyzed = false`. Next pipeline run retries them automatically.
- **Handling:** The `get_unanalyzed()` DB query fetches unanalyzed articles at the start of every run.

---

### 4.9 Article Content is in a Language Groq Cannot Handle Well
- **Scenario:** A Hindi or mixed-language article makes it past the content filter.
- **Risk:** LLM produces garbled or irrelevant analysis.
- **Expected Behavior:** Language detection before LLM call; skip non-English articles.
- **Handling:** Pre-filter with `langdetect` (see Filter Layer 2.4).

---

### 4.10 The Same Article is Submitted Twice to Groq
- **Scenario:** A race condition or bug causes the same `article_id` to be sent to Groq twice.
- **Risk:** Double LLM cost (minor on free tier) and potential DB constraint violation on `ai_analysis.article_id` (UNIQUE).
- **Expected Behavior:** `UNIQUE` constraint on `ai_analysis.article_id` prevents duplicate rows. Handle `IntegrityError` gracefully.
- **Handling:** `ON CONFLICT DO NOTHING` or catch `sqlalchemy.exc.IntegrityError`.

---

## Layer 5 — Database / Storage Edge Cases

### 5.1 Database Connection Failure
- **Scenario:** PostgreSQL/Supabase is unreachable when the pipeline runs.
- **Risk:** Pipeline crashes after fetching and analyzing articles — all work is lost.
- **Expected Behavior:** Implement a DB connection check at pipeline startup. If DB is down → abort early with a clear error message.
- **Handling:** Connection health check before processing; articles are re-fetched on next run (idempotent pipeline).

---

### 5.2 Database Disk Full (Supabase 500MB Free Tier Limit)
- **Scenario:** After months of operation, Supabase's 500MB free tier is exhausted.
- **Risk:** New inserts fail; pipeline crashes.
- **Expected Behavior:** Monitor DB size. When approaching 400MB, trigger an alert. Implement automatic deletion of articles older than 90 days.
- **Handling:**
  ```sql
  DELETE FROM articles WHERE published_at < NOW() - INTERVAL '90 days';
  ```

---

### 5.3 Concurrent Pipeline Runs (Race Condition)
- **Scenario:** A delayed GitHub Actions run from hour N is still running when hour N+1 trigger fires.
- **Risk:** Two pipeline instances run simultaneously → race condition on duplicate detection → duplicate articles in DB.
- **Expected Behavior:** Use a DB-level advisory lock or a `pipeline_running` flag in a `config` table to prevent concurrent runs.
- **Handling:**
  ```sql
  SELECT pg_try_advisory_lock(12345);  -- Returns false if another run holds the lock
  ```

---

### 5.4 Partial Pipeline Failure (Articles Saved, Analysis Not)
- **Scenario:** Articles are written to DB, but the pipeline crashes before writing `ai_analysis`.
- **Risk:** Articles are marked as existing (deduplication skips them next run) but have no analysis — they never show on dashboard.
- **Expected Behavior:** At the start of each run, query for `is_analyzed = false` articles and re-analyze them before fetching new ones.
- **Handling:** `unanalyzed = db.query(Article).filter_by(is_analyzed=False).all()`

---

### 5.5 UUID Collision (Theoretical)
- **Scenario:** Two UUIDs generated by `uuid.uuid4()` collide.
- **Risk:** DB PRIMARY KEY constraint violation.
- **Expected Behavior:** UUID4 collision probability is astronomically low (~1 in 10³⁸). Catch `IntegrityError` as a safety net; regenerate UUID.

---

### 5.6 DB Migration Fails Mid-Way (Alembic)
- **Scenario:** An Alembic migration script errors out halfway, leaving the schema in a partially migrated state.
- **Risk:** Some tables exist, others don't; pipeline fails on next run.
- **Expected Behavior:** Alembic runs migrations inside transactions. If it fails, it rolls back to the previous state automatically.
- **Handling:** Always test migrations on a staging DB before running on production.

---

## Layer 6 — FastAPI Backend Edge Cases

### 6.1 No Articles in Database (Fresh Deployment)
- **Scenario:** Dashboard loads before the first pipeline run completes.
- **Risk:** API returns `{ "data": [], "total": 0 }` — dashboard appears broken.
- **Expected Behavior:** API returns empty array gracefully with `200 OK`. Frontend shows a friendly "No articles yet — check back in an hour" message.

---

### 6.2 Invalid Query Parameters
- **Scenario:** Frontend sends `?sentiment=Bullish` (invalid) or `?date=yesterday` (unparseable).
- **Risk:** 500 Internal Server Error if not validated.
- **Expected Behavior:** FastAPI Pydantic validation returns `422 Unprocessable Entity` with a descriptive error message.
- **Handling:** Use `Literal["Positive", "Negative", "Neutral", "All"]` type annotation on the query param.

---

### 6.3 Very Large `limit` Parameter
- **Scenario:** Frontend or a bot sends `?limit=10000`.
- **Risk:** DB query returns thousands of rows; API response is huge; server memory spikes.
- **Expected Behavior:** Cap `limit` at 100 regardless of what was requested.
- **Handling:** `limit = min(limit, 100)`

---

### 6.4 CORS Rejection on Frontend
- **Scenario:** React frontend (on Vercel domain) tries to call the FastAPI backend (on Render domain).
- **Risk:** Browser blocks the request with a CORS error.
- **Expected Behavior:** FastAPI has `CORSMiddleware` configured with the Vercel domain as an allowed origin.
- **Handling:** In production, set `allow_origins=["https://your-app.vercel.app"]` (not `"*"`).

---

### 6.5 Backend Goes to Sleep (Render Free Tier Spin-Down)
- **Scenario:** Render's free tier spins down the backend after 15 minutes of inactivity.
- **Risk:** First API request from the frontend takes 30–60 seconds to respond ("cold start").
- **Expected Behavior:** Frontend shows a loading spinner and handles slow responses gracefully (set timeout to 30s, not 5s).
- **Future Fix:** Use a free uptime monitor (UptimeRobot) to ping the API every 14 minutes to keep it warm.

---

## Layer 7 — Frontend Dashboard Edge Cases

### 7.1 API Request Fails / Times Out
- **Scenario:** FastAPI is unreachable when the user loads the dashboard.
- **Risk:** Blank page or uncaught error.
- **Expected Behavior:** Show a clear error state: "Unable to load news. Please try again."
- **Handling:** Catch `fetch` errors in `useNews.js`; display error component.

---

### 7.2 No Articles Match the Active Filter
- **Scenario:** User filters by "Negative" on a very good market day — no negative articles exist.
- **Risk:** Empty list looks like a bug.
- **Expected Behavior:** Show empty state: "No negative news today! Markets look good 📈"

---

### 7.3 Article Has No Secondary Sector
- **Scenario:** LLM returns `"secondary_sector": null`.
- **Risk:** Frontend tries to render a null chip and crashes.
- **Expected Behavior:** Conditionally render secondary sector chip only if value is non-null.
- **Handling:** `{article.secondary_sector && <SectorTag sector={article.secondary_sector} />}`

---

### 7.4 Very Long Article Headline
- **Scenario:** A headline is 200+ characters long.
- **Risk:** Overflows the card layout; breaks the UI.
- **Expected Behavior:** Truncate headline to 120 characters with ellipsis in the card view; show full title on hover (tooltip).
- **Handling:** CSS `text-overflow: ellipsis` + `overflow: hidden` + `white-space: nowrap`

---

### 7.5 Very Long AI Reasoning Text
- **Scenario:** LLM generates 10+ sentences of reasoning.
- **Risk:** Card becomes very tall; dashboard looks cluttered.
- **Expected Behavior:** Show first 3 lines of reasoning; add "Show more" toggle to expand.

---

### 7.6 User Opens Dashboard at Midnight (Day Boundary)
- **Scenario:** User views dashboard at 11:59 PM. Page auto-refreshes at 12:00 AM — now "today" changes.
- **Risk:** Date filter switches from today's articles to next day's (empty).
- **Expected Behavior:** Default date filter shows last 24 hours of articles (not calendar day). Reset the date reference on refresh.

---

### 7.7 Multiple Sources for One Article — One URL is Broken
- **Scenario:** An article shows 3 sources. One of the source URLs returns 404 (article was deleted by publisher).
- **Risk:** Clicking that source link shows a 404 page — confusing.
- **Expected Behavior (MVP):** Links are shown as-is; broken links are the publisher's responsibility.
- **Future Enhancement:** Periodically check source URLs and mark dead ones.

---

### 7.8 Dashboard on Mobile (Small Screen)
- **Scenario:** User opens the dashboard on a phone.
- **Risk:** News cards overflow horizontally; filter bar is unusable.
- **Expected Behavior:** Fully responsive layout — cards stack vertically, filter bar collapses into a dropdown/modal.

---

## Layer 8 — GitHub Actions Scheduler Edge Cases

### 8.1 GitHub Actions Cron Delay
- **Scenario:** GitHub's cron scheduler can delay up to 15–20 minutes during peak load.
- **Risk:** News is stale for longer than expected.
- **Expected Behavior:** This is a known GitHub limitation. Accept it for MVP. Document in README.
- **Future Fix:** Add a `workflow_dispatch` button on the dashboard for manual refresh.

---

### 8.2 GitHub Actions Run Exceeds 15-Minute Timeout
- **Scenario:** A very large batch of articles + slow Groq responses causes the pipeline to run for > 15 minutes.
- **Risk:** GitHub kills the workflow job mid-run.
- **Expected Behavior:** Set `timeout-minutes: 15` in the workflow. Design the pipeline to be resumable — next run picks up unanalyzed articles.
- **Handling:** `timeout-minutes: 15` + `is_analyzed = false` retry mechanism.

---

### 8.3 GitHub Actions Secret Not Set
- **Scenario:** `GROQ_API_KEY` or `DATABASE_URL` secret is missing or empty.
- **Risk:** Pipeline crashes with `KeyError` or `AuthenticationError`.
- **Expected Behavior:** Validate required environment variables at pipeline startup; fail immediately with a descriptive error.
- **Handling:**
  ```python
  import os
  if not os.environ.get("GROQ_API_KEY"):
      raise EnvironmentError("GROQ_API_KEY is not set. Add it to GitHub Secrets.")
  ```

---

### 8.4 GitHub Actions Free Tier Minutes Exhausted
- **Scenario:** 2,000 free minutes/month for private repos are used up (24 runs/day × 5 min avg = ~3,600 min/month).
- **Risk:** Pipeline stops running for the rest of the month.
- **Expected Behavior:** Switch to a public repo (unlimited minutes) OR reduce pipeline frequency to every 2 hours (halving usage to ~1,800 min/month).
- **Prevention:** Make the repo public (already planned) — public repos get unlimited GitHub Actions minutes.

---

### 8.5 SentenceTransformer Model Cache Invalidated
- **Scenario:** The pip cache or model cache is cleared between runs (GitHub Actions caches expire after 7 days of non-use).
- **Risk:** `all-MiniLM-L6-v2` re-downloads on every run — adds 2–3 minutes to each run.
- **Expected Behavior:** Pipeline still runs correctly but is slower. Cache is rebuilt automatically.
- **Handling:** Use `actions/cache` for both pip and the model directory (`~/.cache/huggingface`).

---

## Layer 9 — Cross-Cutting / System-Wide Edge Cases

### 9.1 First-Ever Pipeline Run — DB is Empty
- **Scenario:** Fresh deployment, no articles in DB.
- **Risk:** `existing_urls = set()` is empty → all deduplication checks pass → all 9 feeds' articles go through the full pipeline at once → large Groq API burst.
- **Expected Behavior:** Process in rate-limited batches of 25 articles with 2-second delays between requests.
- **Handling:** `analyze_batch()` already implements this (see Phase 3 implementation plan).

---

### 9.2 Breaking News Flood (Market Crash / Major Event)
- **Scenario:** A major event (budget, election result, global crash) triggers 50+ articles in a single hour across all feeds.
- **Risk:** Groq rate limit hit; many articles queued; dashboard overwhelmed.
- **Expected Behavior:** All articles are stored (ingestion is fast). LLM analysis processes them sequentially within rate limits. Dashboard shows all of them once analyzed.

---

### 9.3 Pipeline Runs Twice in the Same Hour (Manual Trigger + Cron)
- **Scenario:** Someone manually triggers the workflow just before the scheduled cron fires.
- **Risk:** Two concurrent runs; race condition on deduplication.
- **Expected Behavior:** DB advisory lock (Phase 4, scenario 5.3) prevents the second run from processing. It exits cleanly with a log message.

---

### 9.4 Environment Variable Accidentally Exposed in Logs
- **Scenario:** A print statement like `print(f"Connecting to {DATABASE_URL}")` logs the connection string.
- **Risk:** Secrets visible in GitHub Actions logs (which can be public for public repos).
- **Expected Behavior:** Never log full URLs or API keys. Use `log.debug("DB connected")` without the actual value.
- **Rule:** Add a secrets scanning check or use GitHub's secret masking (values are automatically masked in logs if added as Secrets).

---

### 9.5 Supabase Free Tier Project Paused (After 1 Week of Inactivity)
- **Scenario:** Supabase pauses free projects that haven't been accessed for 7 days.
- **Risk:** Pipeline fails to connect to DB; all runs fail silently.
- **Expected Behavior:** The hourly pipeline itself counts as activity — as long as it runs, Supabase won't pause the project.
- **Mitigation:** Ensure GitHub Actions runs every hour to keep the project active.

---

### 9.6 Sector Taxonomy is Outdated (New Sector Emerges)
- **Scenario:** A new market sector becomes prominent (e.g., "Semiconductor" or "Defence") that isn't in our 12-sector taxonomy.
- **Risk:** LLM maps it to `"Other"` or the closest wrong sector.
- **Expected Behavior:** Monitor for `"Other"` classifications; update the sector taxonomy periodically.
- **Handling:** Make `VALID_SECTORS` a configurable list in `config.py` — easy to extend without code changes.

---

### 9.7 LLM Model Deprecated by Groq
- **Scenario:** Groq deprecates `llama-3.1-8b-instant` and removes it from their API.
- **Risk:** All LLM calls fail with `model not found`.
- **Expected Behavior:** Abstract the model name into a config variable so it can be changed without modifying code.
- **Handling:** `GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")` — override via env var.

---

### 9.8 Duplicate Article Appears After Manual DB Cleanup
- **Scenario:** Admin deletes old articles from DB directly. Those URLs are no longer in `existing_urls`. Pipeline re-fetches and re-inserts them.
- **Risk:** Articles that were already shown reappear on the dashboard.
- **Expected Behavior (MVP):** Acceptable — this is an edge case of manual admin intervention. Document it.
- **Future Fix:** Maintain a separate `seen_urls` tombstone table that persists URLs even after article deletion.

---

## Edge Case Priority Matrix

| Priority | Scenario | Phase to Fix |
|---|---|---|
| 🔴 Critical | Groq API key missing | Phase 3 startup validation |
| 🔴 Critical | DB connection failure | Phase 4 startup health check |
| 🔴 Critical | Concurrent pipeline runs | Phase 4 DB advisory lock |
| 🟠 High | RSS feed down | Phase 1 per-feed try/except |
| 🟠 High | Groq rate limit 429 | Phase 3 retry with backoff |
| 🟠 High | Groq returns invalid JSON | Phase 3 JSON extraction fallback |
| 🟠 High | Partial pipeline failure | Phase 4 `is_analyzed = false` retry |
| 🟠 High | Article with no title/URL | Phase 1 validation before processing |
| 🟡 Medium | Very old articles in feeds | Phase 1 48-hour age filter |
| 🟡 Medium | Same story, different headlines | Phase 2 semantic deduplication |
| 🟡 Medium | LLM returns wrong sector name | Phase 3 taxonomy validation |
| 🟡 Medium | LLM returns wrong sentiment label | Phase 3 sentiment normalization |
| 🟡 Medium | API CORS error | Phase 5 CORS config |
| 🟡 Medium | Render cold start | Phase 6 frontend timeout handling |
| 🟢 Low | UUID collision | Phase 4 IntegrityError catch |
| 🟢 Low | Very long headline in UI | Phase 6 CSS truncation |
| 🟢 Low | Groq model deprecated | Phase 3 model name as config var |
| 🟢 Low | Sector taxonomy outdated | Ongoing config update |

---

*Edge case document for: AI-Powered Indian Stock Market News Intelligence Platform*
*Derived from: `architecture.md` + `context.md` + `implementation-plan.md`*
