import React from 'react';
import Navbar from '../components/Navbar';
import FilterBar from '../components/FilterBar';
import NewsCard from '../components/NewsCard';
import { useNews } from '../hooks/useNews';
import { Inbox } from 'lucide-react';

const Dashboard = () => {
  const { data: articles, total, page, limit, sectors, health, loading, error, filters, updateFilter, refresh } = useNews();

  return (
    <>
      <Navbar health={health} refresh={refresh} loading={loading} />
      
      <main className="container">
        
        <FilterBar filters={filters} updateFilter={updateFilter} sectors={sectors} />
        
        {error && (
          <div style={{ padding: '16px', backgroundColor: 'var(--color-negative-bg)', color: 'var(--color-negative)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
            Error: {error}
          </div>
        )}

        {loading && articles.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0', color: 'var(--text-muted)' }}>
            Loading intelligence...
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Showing {articles.length} of {total} articles
            </div>

            {articles.length === 0 ? (
              <div className="glass-panel" style={{ padding: '64px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Inbox size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                <h3>No articles found</h3>
                <p>Try adjusting your filters to see more results.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {articles.map(article => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {total > limit && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px', marginBottom: '64px' }}>
                <button 
                  disabled={page === 1}
                  onClick={() => updateFilter('page', page - 1)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  Page {page} of {Math.ceil(total / limit)}
                </div>
                <button 
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => updateFilter('page', page + 1)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: page >= Math.ceil(total / limit) ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default Dashboard;
