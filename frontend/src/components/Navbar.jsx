import React from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const Navbar = ({ health, refresh, loading }) => {
  const lastUpdated = health?.last_run 
    ? formatDistanceToNow(parseISO(health.last_run), { addSuffix: true })
    : 'Never';

  return (
    <nav 
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(10, 10, 14, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '16px 0',
        marginBottom: '32px'
      }}
    >
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'var(--accent-gradient)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Activity color="white" size={20} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>
            News<span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>Intelligence</span>
          </h1>
        </div>

        {/* Status / Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ 
              display: 'inline-block', 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: health?.status === 'ok' ? 'var(--color-positive)' : 'var(--color-negative)',
              boxShadow: health?.status === 'ok' ? '0 0 8px var(--color-positive)' : 'none'
            }}></span>
            Pipeline: {lastUpdated}
          </div>
          
          <button 
            onClick={refresh}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: '500',
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </nav>
  );
};

export default Navbar;
