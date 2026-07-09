"""
Unit tests for Phase 4: Database Storage Layer.
"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.db.database import engine, get_session, init_db, url_exists, save_article, save_analysis, get_unanalyzed
from backend.db.models import Article, Source, AIAnalysis

def test_database():
    print("Running test_database...")
    
    # Initialize schema
    init_db()
    
    # Create test article data
    article_data = {
        "title": "Sensex crosses new milestone",
        "published_at": datetime.utcnow(),
        "is_analyzed": False,
        "sources": [
            {
                "source_name": "MoneyControl",
                "url": "http://example.com/mc/1",
                "description": "Market rallies.",
                "published_at": datetime.utcnow()
            },
            {
                "source_name": "Economic Times",
                "url": "http://example.com/et/1",
                "description": "Sensex hits new high.",
                "published_at": datetime.utcnow()
            }
        ]
    }
    
    print("Saving article...")
    with get_session() as db:
        print("Got session. Clearing old data...")
        # Clear existing for clean test
        db.query(AIAnalysis).delete()
        print("Cleared AIAnalysis")
        db.query(Source).delete()
        print("Cleared Source")
        db.query(Article).delete()
        print("Cleared Article")
        
        print("Calling save_article...")
        save_article(db, article_data)
        print("save_article returned")
        
    print("Verifying save...")
    with get_session() as db:
        # Check url_exists
        assert url_exists(db, "http://example.com/mc/1") == True, "url_exists failed"
        assert url_exists(db, "http://example.com/fake") == False, "url_exists fake failed"
        
        # Check article count
        articles = db.query(Article).all()
        assert len(articles) == 1
        article = articles[0]
        
        # Check source count
        sources = db.query(Source).all()
        assert len(sources) == 2
        
        # Test get_unanalyzed
        unanalyzed = get_unanalyzed(db)
        assert len(unanalyzed) == 1
        assert unanalyzed[0].id == article.id
        
        print("Saving analysis...")
        analysis_data = {
            "summary": "The market is doing great.",
            "sentiment": "Positive",
            "primary_sector": "Finance",
            "secondary_sector": None,
            "reasoning": "High liquidity."
        }
        save_analysis(db, str(article.id), analysis_data)
        
    print("Verifying analysis...")
    with get_session() as db:
        # Check analysis was saved
        analyses = db.query(AIAnalysis).all()
        assert len(analyses) == 1
        assert analyses[0].sentiment == "Positive"
        
        # Check is_analyzed is True
        article = db.query(Article).first()
        assert article.is_analyzed == True
        
        # Check get_unanalyzed is empty
        unanalyzed = get_unanalyzed(db)
        assert len(unanalyzed) == 0
        
    print("\nPhase 4 tests completed successfully!")

if __name__ == "__main__":
    test_database()
