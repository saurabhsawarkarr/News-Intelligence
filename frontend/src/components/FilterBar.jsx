import React, { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Filter, Calendar, BarChart2 } from 'lucide-react';

const FilterBar = ({ filters, updateFilter, sectors }) => {
  const dateInputRef = useRef(null);
  
  return (
    <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>
        <Filter size={18} className="text-gradient" />
        <span style={{ fontSize: '1.1rem' }}>Filters</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {/* Sentiment Filter */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px 8px', border: '1px solid var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginRight: '8px' }}>
            Sentiment
          </label>
          <select 
            value={filters.sentiment} 
            onChange={(e) => updateFilter('sentiment', e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="All">All Sentiments</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="Positive">Positive</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="Negative">Negative</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="Neutral">Neutral</option>
          </select>
        </div>

        {/* Sector Filter */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px 8px', border: '1px solid var(--border-color)' }}>
          <BarChart2 size={14} color="var(--text-muted)" style={{ marginRight: '6px' }} />
          <select 
            value={filters.sector || 'All'} 
            onChange={(e) => updateFilter('sector', e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="All">All Sectors</option>
            {sectors && sectors.map(sec => (
              <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px 8px', border: '1px solid var(--border-color)', gap: '4px', position: 'relative' }}>
          <Calendar size={14} color="var(--text-muted)" style={{ marginRight: '2px' }} />
          
          <select
            value={filters.date && !['today', 'yesterday', '7days', '1month'].includes(filters.date) ? 'custom' : (filters.date || 'today')}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                updateFilter('date', e.target.value);
              } else {
                if (dateInputRef.current) {
                  try {
                    dateInputRef.current.showPicker();
                  } catch (err) {
                    console.error('Failed to show date picker', err);
                  }
                }
                // Initialize to today's date so it has a valid value if they just dismiss the picker
                if (!filters.date || ['today', 'yesterday', '7days', '1month'].includes(filters.date)) {
                   updateFilter('date', new Date().toISOString().split('T')[0]);
                }
              }
            }}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="today">Today</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="yesterday">Yesterday</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="7days">7 Days</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="1month">1 Month</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="custom">
              {filters.date && !['today', 'yesterday', '7days', '1month'].includes(filters.date) 
                ? `Custom: ${filters.date}` 
                : 'Custom Option'}
            </option>
          </select>

          <input
            ref={dateInputRef}
            type="date"
            value={filters.date && !['today', 'yesterday', '7days', '1month'].includes(filters.date) ? filters.date : ''}
            onChange={(e) => updateFilter('date', e.target.value)}
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              opacity: 0,
              pointerEvents: 'none',
              border: 'none',
              padding: 0
            }}
          />

          {filters.date && (
            <button
              onClick={() => updateFilter('date', null)}
              title="Clear date filter"
              style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                lineHeight: '1',
                padding: '0 2px',
                borderRadius: '4px',
                marginLeft: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default FilterBar;
