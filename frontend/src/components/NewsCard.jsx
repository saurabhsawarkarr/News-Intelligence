import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Deterministic pseudo-random number generator based on string
const getPseudoRandom = (str, min, max) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const random = Math.abs(Math.sin(hash)) * 10000;
  return Math.floor((random - Math.floor(random)) * (max - min + 1)) + min;
};

const NewsCard = ({ article, onClick }) => {
  const { title, summary, published_at, sources, sentiment, primary_sector, secondary_sector, id } = article;
  
  const timeAgo = formatDistanceToNow(parseISO(published_at), { addSuffix: true }).replace('about ', '');
  const sourceName = sources && sources.length > 0 ? sources[0].name : 'Unknown';
  
  // Generate dummy percentages for the vibe design
  let percentage = 0;
  let isPositive = false;
  let isNegative = false;
  
  if (sentiment === 'Positive') {
    percentage = getPseudoRandom(id, 75, 98);
    isPositive = true;
  } else if (sentiment === 'Negative') {
    percentage = getPseudoRandom(id, 65, 95);
    isNegative = true;
  } else {
    percentage = getPseudoRandom(id, 5, 25);
  }

  // Tags
  const tags = [];
  if (primary_sector) tags.push(primary_sector.toUpperCase());
  if (secondary_sector) tags.push(secondary_sector.toUpperCase());

  return (
    <div 
      onClick={() => onClick(article)}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          lineHeight: '1.3', 
          margin: 0,
          color: 'var(--text-primary)',
          flex: 1
        }}>
          {title}
        </h2>
        
        {/* Sentiment Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '12px',
          backgroundColor: isPositive ? 'var(--color-positive-bg)' : isNegative ? 'var(--color-negative-bg)' : 'var(--color-neutral-bg)',
          color: isPositive ? 'var(--color-positive)' : isNegative ? '#ff6b6b' : 'var(--color-neutral)',
          border: `1px solid ${isPositive ? 'rgba(0,255,136,0.1)' : isNegative ? 'rgba(255,68,68,0.1)' : 'rgba(255,255,255,0.05)'}`,
          flexShrink: 0
        }}>
          {isPositive ? <TrendingUp size={12} strokeWidth={3} /> : isNegative ? <TrendingDown size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
          <span style={{ fontSize: '11px', fontWeight: '700' }}>
            {isPositive ? '+' : isNegative ? '-' : ''}{percentage}%
          </span>
        </div>
      </div>

      <p style={{ 
        color: 'var(--text-secondary)', 
        fontSize: '14px', 
        lineHeight: '1.5',
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {summary || 'No summary available.'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tags.map((tag, i) => (
            <span key={i} style={{
              backgroundColor: '#1a1a1f',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '700',
              color: '#8ba1bd',
              letterSpacing: '0.05em'
            }}>
              {tag}
            </span>
          ))}
        </div>
        
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
          {timeAgo} <span style={{ margin: '0 4px' }}>•</span> <span style={{ color: '#d1d5db' }}>{sourceName}</span>
        </div>
      </div>

    </div>
  );
};

export default NewsCard;
