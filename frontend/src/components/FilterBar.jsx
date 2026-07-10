import React from 'react';
import { Filter, Calendar, BarChart2 } from 'lucide-react';

const FilterBar = ({ filters, updateFilter, sectors }) => {
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
            <option value="All">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Neutral">Neutral</option>
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
              cursor: 'pointer',
              maxWidth: '150px'
            }}
          >
            <option value="All">All Sectors</option>
            {sectors && sectors.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '4px 8px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <Calendar size={14} color="var(--text-muted)" style={{ marginRight: '2px' }} />
          <input
            type="date"
            value={filters.date || ''}
            onChange={(e) => updateFilter('date', e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: filters.date ? 'var(--text-primary)' : 'var(--text-muted)',
              outline: 'none',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              colorScheme: 'dark',
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
