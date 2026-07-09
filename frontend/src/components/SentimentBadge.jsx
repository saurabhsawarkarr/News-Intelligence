import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SentimentBadge = ({ sentiment }) => {
  if (!sentiment) return null;

  const normalizedSentiment = sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();

  const getBadgeStyle = () => {
    switch (normalizedSentiment) {
      case 'Positive':
        return {
          bg: 'var(--color-positive-bg)',
          color: 'var(--color-positive)',
          icon: <TrendingUp size={14} className="mr-1" />
        };
      case 'Negative':
        return {
          bg: 'var(--color-negative-bg)',
          color: 'var(--color-negative)',
          icon: <TrendingDown size={14} className="mr-1" />
        };
      default:
        return {
          bg: 'var(--color-neutral-bg)',
          color: 'var(--color-neutral)',
          icon: <Minus size={14} className="mr-1" />
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div 
      className="sentiment-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.color}30`
      }}
    >
      {style.icon}
      {normalizedSentiment}
    </div>
  );
};

export default SentimentBadge;
