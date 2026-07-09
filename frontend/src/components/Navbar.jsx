import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const Navbar = ({ health }) => {
  const lastUpdated = health?.last_run 
    ? formatDistanceToNow(parseISO(health.last_run), { addSuffix: true })
    : 'Never';

  return (
    <nav style={{ padding: '24px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
          <span style={{ color: 'var(--accent-primary)' }}>News</span>
          <span style={{ color: 'white' }}>Intelligence</span>
        </h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500', marginTop: '2px' }}>
          Last Updated: {lastUpdated}
        </span>
      </div>

      <div style={{
        padding: '4px 12px',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '2px'
      }}>
        <span style={{ color: 'var(--accent-primary)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>
          LIVE
        </span>
      </div>
    </nav>
  );
};

export default Navbar;
