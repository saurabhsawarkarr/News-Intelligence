"""
Unit tests for Phase 3: Groq LLM Analyzer.
"""

import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.pipeline.analyzer import analyze_batch, analyze_article
from backend.pipeline.analyzer import get_groq_client

def test_analyzer():
    print("Running test_analyzer...")
    
    # Check if API key is provided
    if not get_groq_client():
        print("[SKIP] GROQ_API_KEY is not set. Skipping real API call test.")
        print("Please set your GROQ_API_KEY in the .env file to run this test.")
        return
        
    articles = [
        {
            "title": "RBI cuts repo rate by 50 basis points",
            "description": "The Reserve Bank of India has slashed the repo rate to boost economic growth, bringing cheer to the banking and real estate sectors.",
            "url": "http://example.com/1"
        }
    ]
    
    print("Sending article to Groq LLM for analysis...")
    results = analyze_batch(articles)
    
    assert len(results) == 1
    result = results[0]
    
    # Assert it was analyzed successfully
    assert result.get("is_analyzed") is True, "Analysis failed (is_analyzed is False)"
    
    # Assert all 5 required fields are present
    required_fields = ["summary", "sentiment", "primary_sector", "secondary_sector", "reasoning"]
    for field in required_fields:
        assert field in result, f"Missing field: {field}"
        
    # Validate sentiment
    assert result["sentiment"] in ["Positive", "Negative", "Neutral"], f"Invalid sentiment: {result['sentiment']}"
    
    print("\n[OK] Analysis successful! Here is the JSON output:")
    print(json.dumps({k: result[k] for k in required_fields}, indent=2))
    
    print("\nPhase 3 tests completed successfully!")

if __name__ == "__main__":
    test_analyzer()
