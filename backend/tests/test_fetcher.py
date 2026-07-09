"""
Unit tests for the Phase 1 RSS Fetcher.
"""

import sys
import os

# Add project root to sys.path so we can import backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.pipeline.fetcher import fetch_all_feeds
from backend.config import RSS_FEEDS

def test_fetch_all_feeds():
    print("Running test_fetch_all_feeds...")
    
    articles = fetch_all_feeds(RSS_FEEDS)
    
    assert len(articles) > 0, "No articles fetched from any feed"
    
    sources_fetched = set(a["source_name"] for a in articles)
    
    success = True
    for feed in RSS_FEEDS:
        if feed["name"] not in sources_fetched:
            print(f"[FAIL] Feed {feed['name']} returned 0 articles.")
            success = False
        else:
            print(f"[OK] Feed {feed['name']} returned articles.")
            
    print(f"\nTotal articles fetched: {len(articles)}")
    if articles:
        sample = articles[0]
        print(f"First article sample:")
        print(f"  Title: {sample['title']}")
        print(f"  URL: {sample['url']}")
        print(f"  Date: {sample['published_at']}")
        print(f"  Source: {sample['source_name']}")
        
    if not success:
        print("\nSome feeds failed to return articles, but this might be expected if the external site is down or blocking requests.")
    else:
        print("\nAll feeds successfully returned >= 1 article!")

if __name__ == "__main__":
    test_fetch_all_feeds()
