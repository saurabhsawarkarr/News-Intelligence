"""
Unit tests for Phase 5: FastAPI Backend.
"""

import sys
import os
import json
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_api():
    print("Testing /api/health...")
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    print(f"Health response: {response.json()}")
    
    print("\nTesting /api/news...")
    response = client.get("/api/news")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    print(f"News response data count: {len(data['data'])}, total: {data['total']}")
    if len(data['data']) > 0:
        print(f"First news item: {json.dumps(data['data'][0], indent=2)}")
        
    print("\nTesting /api/news/sectors...")
    response = client.get("/api/news/sectors")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    print(f"Sectors response: {response.json()}")
    
    print("\nPhase 5 API tests completed successfully!")

if __name__ == "__main__":
    test_api()
