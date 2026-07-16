import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import DailySummaryCard from '../components/DailySummaryCard';
import { useNews } from '../hooks/useNews';
import { Calendar, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';

const DATE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: '7 Days', value: '7days' },
  { label: '1 Month', value: '1month' },
];

const Summaries = () => {
  const { sectors, health, lastRefreshed, refresh, loading, filters, updateFilter } = useNews();
  
  const selectedSector = filters.sector || '';
  const date = filters.date || 'today';
  const [showCustomDate, setShowCustomDate] = useState(false);
  const dateInputRef = useRef(null);
  const pillsRef = useRef(null);

  const isCustomDate = date && !['today', 'yesterday', '7days', '1month'].includes(date);

  const allSectors = ['', ...(sectors || [])];
  const sectorScrollRef = useRef(null);

  const scrollSectors = (dir) => {
    if (sectorScrollRef.current) {
      sectorScrollRef.current.scrollBy({ left: dir * 140, behavior: 'smooth' });
    }
  };

  const handleDateSelect = (val) => {
    if (val === 'custom') {
      if (dateInputRef.current) {
        try { dateInputRef.current.showPicker(); } catch (e) { /* ignore */ }
      }
    } else {
      updateFilter('date', val);
      setShowCustomDate(false);
    }
  };

  const handleCustomDateChange = (e) => {
    updateFilter('date', e.target.value);
    setShowCustomDate(true);
  };

  const displayDate = isCustomDate
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : DATE_OPTIONS.find(o => o.value === date)?.label || 'Today';

  return (
    <div className="app-container">
      <Navbar health={health} lastRefreshed={lastRefreshed} onRefresh={refresh} loading={loading} />

      <div className="content-container" style={{ paddingBottom: '100px' }}>

        {/* Page Header */}
        <div style={{ padding: '20px 0 8px' }}>
          <h1 style={{
            fontSize: '26px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            margin: 0,
          }}>
            Market Summaries
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            AI-generated daily market intelligence
          </p>
        </div>

        {/* Filter Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'flex-start'
        }}>

          {/* ── Date Filter ── */}
          <div style={{ flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <Calendar size={14} color="var(--color-primary)" />
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Date
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {DATE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleDateSelect(opt.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: '1px solid',
                    transition: 'all 0.18s ease',
                    ...(date === opt.value && !isCustomDate
                      ? {
                          background: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          color: '#000',
                          boxShadow: '0 0 12px rgba(0,255,136,0.25)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          color: 'var(--text-secondary)',
                        }),
                  }}
                >
                  {opt.label}
                </button>
              ))}

              {/* Custom date pill */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  onClick={() => {
                    if (dateInputRef.current) {
                      try { dateInputRef.current.showPicker(); } catch (e) { /* ignore */ }
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: '1px solid',
                    transition: 'all 0.18s ease',
                    ...(isCustomDate
                      ? {
                          background: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          color: '#000',
                          boxShadow: '0 0 12px rgba(0,255,136,0.25)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          color: 'var(--text-muted)',
                        }),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <Calendar size={12} />
                  {isCustomDate ? displayDate : 'Pick date…'}
                </button>

                {/* Hidden native date input */}
                <input
                  ref={dateInputRef}
                  type="date"
                  value={isCustomDate ? date : ''}
                  onChange={handleCustomDateChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Sector Filter ── */}
          <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <BarChart2 size={14} color="var(--color-primary)" />
              <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Sector
              </span>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <select
                value={selectedSector}
                onChange={(e) => updateFilter('sector', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: selectedSector === '' ? 'var(--color-primary)' : 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,255,136,0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="" style={{ background: '#111', color: '#fff' }}>🌐 All Sectors</option>
                {(sectors || []).map(sector => (
                  <option key={sector} value={sector} style={{ background: '#111', color: '#fff' }}>
                    {sector}
                  </option>
                ))}
              </select>
              <div style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'var(--text-muted)'
              }}>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Active filter summary */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Showing:</span>
          <span style={{
            padding: '3px 10px',
            borderRadius: '100px',
            background: 'rgba(0,255,136,0.08)',
            border: '1px solid rgba(0,255,136,0.2)',
            color: 'var(--color-primary)',
            fontSize: '12px',
            fontWeight: '700',
          }}>
            {displayDate}
          </span>
          <span style={{
            padding: '3px 10px',
            borderRadius: '100px',
            background: 'rgba(0,255,136,0.08)',
            border: '1px solid rgba(0,255,136,0.2)',
            color: 'var(--color-primary)',
            fontSize: '12px',
            fontWeight: '700',
          }}>
            {selectedSector || 'All Sectors'}
          </span>
        </div>

        {/* Summary Card */}
        <DailySummaryCard date={date} sector={selectedSector} lastRefreshed={lastRefreshed} />
      </div>

      <BottomNav />
    </div>
  );
};

export default Summaries;
