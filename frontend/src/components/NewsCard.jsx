import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

const NewsCard = ({ article, onClick }) => {
  const { title, summary, published_at, sources, sentiment, primary_sector, secondary_sector } = article;

  let timeAgo = 'Unknown time';
  try {
    if (published_at) {
      timeAgo = formatDistanceToNow(parseISO(published_at), { addSuffix: true }).replace('about ', '');
    }
  } catch (e) {
    // Invalid date string — use fallback
  }

  const isPositive = sentiment === 'Positive';
  const isNegative = sentiment === 'Negative';

  const sentimentColor = isPositive
    ? 'var(--color-positive)'
    : isNegative
    ? 'var(--color-negative)'
    : 'var(--color-neutral)';

  const sentimentBg = isPositive
    ? 'var(--color-positive-bg)'
    : isNegative
    ? 'var(--color-negative-bg)'
    : 'var(--color-neutral-bg)';

  const sentimentBorder = isPositive
    ? 'rgba(0,255,136,0.2)'
    : isNegative
    ? 'rgba(255,68,68,0.2)'
    : 'rgba(156,163,175,0.15)';

  const SentimentIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const sentimentLabel = sentiment || 'Neutral';

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
        borderRadius: '20px',
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
      }}
    >
      {/* Top row: Sentiment badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <h2 style={{
          fontSize: '17px',
          lineHeight: '1.35',
          margin: 0,
          color: 'var(--text-primary)',
          flex: 1,
          fontWeight: '700',
        }}>
          {title}
        </h2>

        {/* Correct Sentiment Badge — text only, no fake % */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '5px 10px',
          borderRadius: '10px',
          backgroundColor: sentimentBg,
          color: sentimentColor,
          border: `1px solid ${sentimentBorder}`,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          <SentimentIcon size={12} strokeWidth={3} />
          <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {sentimentLabel}
          </span>
        </div>
      </div>

      {/* Summary — 2 line clamp */}
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '13.5px',
        lineHeight: '1.55',
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {summary || 'No AI summary available yet.'}
      </p>

      {/* Bottom row: sectors + time + sources */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px' }}>
        {/* Sector tags and Time */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {tags.map((tag, i) => (
            <span key={i} style={{
              backgroundColor: '#1a1a22',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '700',
              color: '#8ba1bd',
              letterSpacing: '0.05em',
            }}>
              {tag}
            </span>
          ))}
          {/* Time */}
          <span style={{
            backgroundColor: '#1a1a22',
            padding: '3px 9px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '700',
            color: '#8ba1bd',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            flexShrink: 0
          }}>
            {timeAgo}
          </span>
        </div>
      </div>

      {/* Sources — ALL sources listed */}
      {sources && sources.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          {sources.map((src, i) => (
            src.url ? (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <ExternalLink size={10} />
                {src.name}
              </a>
            ) : (
              <span key={i} style={{
                color: '#94a3b8',
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(255,255,255,0.02)',
              }}>
                {src.name}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsCard;
