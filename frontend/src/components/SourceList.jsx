import React from 'react';
import { ExternalLink } from 'lucide-react';

const SourceList = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sources:</span>
      {sources.map((source, idx) => (
        <a 
          key={idx}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '4px 10px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            textDecoration: 'none',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {source.name}
          <ExternalLink size={12} style={{ marginLeft: '6px', opacity: 0.7 }} />
        </a>
      ))}
    </div>
  );
};

export default SourceList;
