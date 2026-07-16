import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import FilterBar from '../components/FilterBar';
import NewsCard from '../components/NewsCard';
import ArticleDetail from '../components/ArticleDetail';
import BottomNav from '../components/BottomNav';

import { useNews } from '../hooks/useNews';
import { Inbox, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { data: articles, total, page, limit, sectors, health, loading, error, filters, updateFilter, lastRefreshed, refresh } = useNews();
  const [selectedArticle, setSelectedArticle] = useState(null);

  // If an article is selected, show the detail view
  if (selectedArticle) {
    return (
      <div className="app-container">
        <ArticleDetail 
          article={selectedArticle} 
          onBack={() => setSelectedArticle(null)} 
        />
        <BottomNav />
      </div>
    );
  }

  // Otherwise, show the main feed
  return (
    <div className="app-container">
      <Navbar health={health} lastRefreshed={lastRefreshed} onRefresh={refresh} loading={loading} />
      
      <div className="content-container">
        
        {/* We keep the FilterBar for functionality, even if not explicitly in the mobile mockups, it's essential */}
        <div style={{ margin: '16px 0' }}>
          <FilterBar filters={filters} updateFilter={updateFilter} sectors={sectors} />
        </div>
        
        {error && (
          <div style={{ padding: '16px', backgroundColor: 'var(--color-negative-bg)', color: 'var(--color-negative)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
            Error: {error}
          </div>
        )}



        {loading && articles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="spin" style={{ marginBottom: '16px' }} />
            <span>Loading intelligence…</span>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>
              Showing {articles.length} of {total} stories
            </div>

            {articles.length === 0 ? (
              <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Inbox size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>No stories found</h3>
                <p style={{ fontSize: '14px', marginBottom: '16px' }}>
                  {filters.date === 'today' 
                    ? "No articles fetched for today yet. The pipeline may not have run yet today."
                    : "Try adjusting your filters."}
                </p>
                {filters.date === 'today' && (
                  <button
                    onClick={() => updateFilter('date', 'yesterday')}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '100px',
                      background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,204,106,0.1))',
                      border: '1px solid rgba(0,255,136,0.3)',
                      color: 'var(--color-primary)',
                      fontWeight: '700',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,136,0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    View Yesterday's News →
                  </button>
                )}
              </div>
            ) : (
              <div className="news-grid">
                {articles.map(article => (
                  <NewsCard 
                    key={article.id} 
                    article={article} 
                    onClick={(art) => setSelectedArticle(art)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {total > limit && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px', marginBottom: '24px' }}>
                <button 
                  disabled={page === 1}
                  onClick={() => updateFilter('page', page - 1)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '100px',
                    color: page === 1 ? 'rgba(255,255,255,0.2)' : 'white',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600' }}>
                  Page {page} of {Math.ceil(total / limit)}
                </div>
                <button 
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => updateFilter('page', page + 1)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '100px',
                    color: page >= Math.ceil(total / limit) ? 'rgba(255,255,255,0.2)' : 'white',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
