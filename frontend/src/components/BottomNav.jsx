import React from 'react';
import { Dot, LineChart, Wallet, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-height)',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTop: '1px solid var(--border-color)',
      zIndex: 100,
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Tab: News */}
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: currentPath === '/' ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>
          <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dot size={24} strokeWidth={4} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>News</span>
        </div>
      </Link>
      
      {/* Tab: Summaries */}
      <Link to="/summaries" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: currentPath === '/summaries' ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>
          <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LineChart size={20} strokeWidth={2} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>Summaries</span>
        </div>
      </Link>
    </div>
  );
};

export default BottomNav;
