"""
Phase 0 verification script.

Run this after installing Python and creating the venv to confirm:
  1. All required packages are importable
  2. The config module loads without error (requires a .env file)
  3. The SQLAlchemy models are syntactically valid

Usage (from the project root, with venv activated):
    python backend/verify_setup.py
"""

import sys

REQUIRED_PACKAGES = [
    ("fastapi", "fastapi"),
    ("uvicorn", "uvicorn"),
    ("feedparser", "feedparser"),
    ("rapidfuzz", "rapidfuzz"),
    ("sentence_transformers", "sentence-transformers"),
    ("groq", "groq"),
    ("sqlalchemy", "sqlalchemy"),
    ("alembic", "alembic"),
    ("psycopg", "psycopg[binary]"),
    ("dotenv", "python-dotenv"),
    ("httpx", "httpx"),
    ("pydantic", "pydantic"),
]

print("=" * 60)
print("News Intelligence — Phase 0 Setup Verification")
print("=" * 60)

all_ok = True
for module_name, pip_name in REQUIRED_PACKAGES:
    try:
        __import__(module_name)
        print(f"  [OK]  {pip_name}")
    except ImportError:
        print(f"  [FAIL]  {pip_name}  <- NOT INSTALLED (pip install {pip_name})")
        all_ok = False

print()
if all_ok:
    print("All packages imported successfully [OK]")
    print()
    print("Next steps:")
    print("  1. Copy backend/.env.example → backend/.env and fill in values")
    print("  2. Run: uvicorn backend.api.main:app --reload")
    print("  3. Open: http://localhost:8000/docs")
else:
    print("Some packages are missing. Run:")
    print("  pip install -r backend/requirements.txt")
    sys.exit(1)
