"""
Deduplicator — Phase 2B stub.

Three-step deduplication pipeline:
    Step 1: URL hash check        → O(1), exact same links
    Step 2: RapidFuzz title match → near-duplicate titles  (threshold: 85)
    Step 3: SentenceTransformer   → semantic similarity    (threshold: 0.92)

Implementation will be completed in Phase 2.
"""

from __future__ import annotations

import logging
from rapidfuzz import fuzz
from backend.config import SENTENCE_TRANSFORMER_MODEL, FUZZY_TITLE_THRESHOLD, SEMANTIC_SIM_THRESHOLD

logger = logging.getLogger("pipeline.deduplicator")

# Load model globally so it's only loaded once per worker/process
# Wrapping import as well because PyTorch can fail to load DLLs on some Windows machines
try:
    from sentence_transformers import SentenceTransformer, util
    model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
except Exception as e:
    logger.error("Failed to load SentenceTransformer (falling back to fuzzy match only): %s", e)
    model = None
    util = None

def deduplicate(
    articles: list[dict],
    existing_urls: set[str],
) -> list[dict]:
    """Return only unique, previously-unseen articles.

    When a duplicate is detected, the source information from the duplicate
    is merged into the ``sources`` list of the surviving article.
    """
    unique = []
    seen_titles = []
    seen_embeddings = []
    
    # Initialize "sources" list for each article if it doesn't exist
    for article in articles:
        if "sources" not in article:
            article["sources"] = [{
                "name": article["source_name"],
                "url": article["url"]
            }]

    for article in articles:
        # Step 1: URL check
        if article["url"] in existing_urls:
            continue

        title = article["title"]
        is_dup = False
        
        # Step 2: Fuzzy title match
        for i, existing_title in enumerate(seen_titles):
            if fuzz.token_sort_ratio(title, existing_title) > FUZZY_TITLE_THRESHOLD:
                is_dup = True
                unique[i]["sources"].extend(article["sources"])
                break
                
        if is_dup:
            continue
            
        # Step 3: Semantic similarity
        if model is not None:
            emb = model.encode(title, convert_to_tensor=True)
            for i, existing_emb in enumerate(seen_embeddings):
                if util.cos_sim(emb, existing_emb).item() > SEMANTIC_SIM_THRESHOLD:
                    is_dup = True
                    unique[i]["sources"].extend(article["sources"])
                    break
                    
            if not is_dup:
                unique.append(article)
                seen_titles.append(title)
                seen_embeddings.append(emb)
        else:
            # Fallback if model failed to load
            unique.append(article)
            seen_titles.append(title)
            
    logger.info("Deduplication complete: %d unique articles from %d raw", len(unique), len(articles))
    return unique
