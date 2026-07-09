import React from 'react';
import { Dot, LineChart, Wallet, Bell } from 'lucide-react';

const BottomNav = () => {
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
      {/* Active Tab: News */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--accent-primary)', cursor: 'pointer' }}>
        <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Dot size={24} strokeWidth={4} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>News</span>
      </div>

      {/* Inactive Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LineChart size={20} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: '500', marginTop: '4px' }}>Markets</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={20} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: '500', marginTop: '4px' }}>Portfolio</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={20} />
        </div>
        <span style={{ fontSize: '11px', fontWeight: '500', marginTop: '4px' }}>Alerts</span>
      </div>
    </div>
  );
};

export default BottomNav;
