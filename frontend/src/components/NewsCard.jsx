import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import SentimentBadge from './SentimentBadge';
import SectorTag from './SectorTag';
import SourceList from './SourceList';
import { Clock } from 'lucide-react';

const NewsCard = ({ article }) => {
  const {
    title,
    summary,
    reasoning,
    sentiment,
    primary_sector,
    secondary_sector,
    published_at,
    sources
  } = article;

  const timeAgo = published_at 
    ? formatDistanceToNow(parseISO(published_at), { addSuffix: true })
    : '';

  return (
    <article 
      className="glass-panel animate-fade-in"
      style={{
        padding: '24px',
        marginBottom: '20px',
        transition: 'var(--transition)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.backgroundColor = 'var(--bg-card)';
      }}
    >
      {/* Top Meta Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <SentimentBadge sentiment={sentiment} />
          {primary_sector && <SectorTag sector={primary_sector} />}
          {secondary_sector && <SectorTag sector={secondary_sector} />}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Clock size={14} style={{ marginRight: '4px' }} />
          {timeAgo}
        </div>
      </div>

      {/* Headline */}
      <h2 style={{ 
        fontSize: '1.4rem', 
        lineHeight: '1.3', 
        marginBottom: '16px',
        color: 'var(--text-primary)'
      }}>
        {title}
      </h2>

      {/* Summary */}
      {summary && (
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Summary: </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{summary}</span>
        </div>
      )}

      {/* Reasoning (Why it matters) */}
      {reasoning && (
        <div style={{ 
          backgroundColor: 'rgba(99, 102, 241, 0.05)', 
          borderLeft: '3px solid var(--accent-primary)',
          padding: '12px 16px',
          borderRadius: '0 8px 8px 0',
          marginBottom: '16px'
        }}>
          <span style={{ fontWeight: '600', color: 'var(--accent-primary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
            Why it matters
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{reasoning}</span>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '20px 0 0 0' }} />

      {/* Sources */}
      <SourceList sources={sources} />
      
    </article>
  );
};

export default NewsCard;
