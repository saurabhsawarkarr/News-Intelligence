import sqlite3
conn = sqlite3.connect('news_intelligence.db')
print(conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_summaries'").fetchone()[0])
