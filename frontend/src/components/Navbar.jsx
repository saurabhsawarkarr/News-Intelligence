import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { RefreshCw } from 'lucide-react';

const Navbar = ({ health, lastRefreshed, onRefresh, loading }) => {
  // Show when the backend pipeline last ran (from /api/health)
  let lastPipelineRun = 'Checking…';
  try {
    if (health?.last_run) {
      lastPipelineRun = formatDistanceToNow(parseISO(health.last_run), { addSuffix: true });
    } else if (health?.status === 'ok') {
      lastPipelineRun = 'No data yet';
    }
  } catch (e) {
    lastPipelineRun = 'Unknown';
  }

  return (
    <nav style={{
      padding: '20px 20px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: 0, fontSize: '22px', letterSpacing: '-0.03em', lineHeight: '1.2', fontFamily: 'Outfit, sans-serif' }}>
          <span style={{ color: 'var(--accent-primary)', fontWeight: '800' }}>News</span>
          <span style={{ color: 'white', fontWeight: '700' }}>Intelligence</span>
        </h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '11.5px', fontWeight: '500', marginTop: '3px' }}>
          Pipeline last run: <span style={{ color: 'var(--text-secondary)' }}>{lastPipelineRun}</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Manual refresh button */}
        <button
          onClick={onRefresh}
          title="Refresh now"
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            color: loading ? 'var(--accent-primary)' : 'var(--text-muted)',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'rgba(0,255,136,0.3)'; }}
          onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>

        {/* LIVE badge */}
        <div style={{
          padding: '4px 12px',
          borderRadius: '16px',
          border: '1px solid rgba(0,255,136,0.3)',
          backgroundColor: 'rgba(0,255,136,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'inline-block', boxShadow: '0 0 6px var(--accent-primary)' }} />
          <span style={{ color: 'var(--accent-primary)', fontSize: '10px', fontWeight: '800', letterSpacing: '0.08em' }}>
            LIVE
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </nav>
  );
};

export default Navbar;
