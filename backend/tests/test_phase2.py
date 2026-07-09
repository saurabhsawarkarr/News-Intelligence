"""
Unit tests for Phase 2: Filter and Deduplicator.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.pipeline.filter import filter_articles
from backend.pipeline.deduplicator import deduplicate

def test_filter():
    print("Running test_filter...")
    articles = [
        {"title": "RBI cuts rate by 25bps", "description": "Good news for banking.", "url": "url1"},
        {"title": "Bitcoin reaches new all-time high", "description": "Crypto market rallies.", "url": "url2"},
        {"title": "TCS posts strong Q2 results", "description": "IT sector jumps.", "url": "url3"},
        {"title": "Virat Kohli scores a century", "description": "India wins the cricket match.", "url": "url4"},
    ]
    
    filtered = filter_articles(articles)
    
    assert len(filtered) == 2, f"Expected 2 articles, got {len(filtered)}"
    assert filtered[0]["title"] == "RBI cuts rate by 25bps"
    assert filtered[1]["title"] == "TCS posts strong Q2 results"
    
    print("[OK] Content filter correctly removed crypto and sports articles.")


def test_deduplicator():
    print("Running test_deduplicator...")
    
    # We create 10 duplicates of the same semantic article
    base_title = "RBI slashes repo rate by 25 basis points"
    articles = []
    
    # Generate 10 duplicates with slight variations in title/url
    for i in range(10):
        articles.append({
            "title": f"RBI cuts repo rate by 25 bps!" if i % 2 == 0 else f"RBI cuts repo rate by 25 bps",
            "url": f"http://example.com/news/{i}",
            "source_name": f"Source {i}"
        })
        
    unique = deduplicate(articles, existing_urls=set())
    
    assert len(unique) == 1, f"Expected 1 unique article, got {len(unique)}"
    
    sources = unique[0]["sources"]
    assert len(sources) == 10, f"Expected 10 merged sources, got {len(sources)}"
    
    print("[OK] Deduplicator successfully merged 10 duplicate articles into 1.")


if __name__ == "__main__":
    test_filter()
    test_deduplicator()
    print("\nPhase 2 tests completed successfully!")
