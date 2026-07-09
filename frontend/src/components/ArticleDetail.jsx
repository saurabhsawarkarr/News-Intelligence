import React from 'react';
import { ArrowLeft, Share2, TrendingUp, TrendingDown, Minus, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

// Reuse the pseudo-random generator to ensure consistent percentages
const getPseudoRandom = (str, min, max) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const random = Math.abs(Math.sin(hash)) * 10000;
  return Math.floor((random - Math.floor(random)) * (max - min + 1)) + min;
};

const ArticleDetail = ({ article, onBack }) => {
  const { title, reasoning, published_at, sources, sentiment, primary_sector, secondary_sector, id } = article;
  
  const timeAgo = formatDistanceToNow(parseISO(published_at), { addSuffix: true }).replace('about ', '');
  const sourceName = sources && sources.length > 0 ? sources[0].name : 'Unknown';
  
  // Calculate consistent percentage
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
  if (primary_sector) tags.push(primary_sector);
  if (secondary_sector) tags.push(secondary_sector);

  // Split reasoning into bullet points
  const bullets = reasoning 
    ? reasoning.split(/(?<=\.)\s+/).filter(b => b.trim().length > 10)
    : ["No detailed analysis available for this article."];

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
        <button onClick={onBack} style={{ color: 'white', padding: '8px' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: '20px', letterSpacing: '-0.02em', color: 'white' }}>
          News<span style={{ fontWeight: '400' }}>Intelligence</span>
        </h1>
        <button style={{ color: 'var(--text-muted)', padding: '8px' }}>
          <Share2 size={20} />
        </button>
      </div>

      <div style={{ padding: '24px 20px' }}>
        
        {/* Meta row: Sentiment + Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            backgroundColor: isPositive ? 'var(--color-positive-bg)' : isNegative ? 'var(--color-negative-bg)' : 'var(--color-neutral-bg)',
            color: isPositive ? 'var(--color-positive)' : isNegative ? '#ff6b6b' : 'var(--color-neutral)',
            border: `1px solid ${isPositive ? 'var(--color-positive)' : isNegative ? '#ff6b6b' : 'var(--color-neutral)'}`,
          }}>
            {isPositive ? <TrendingUp size={14} strokeWidth={3} /> : isNegative ? <TrendingDown size={14} strokeWidth={3} /> : <Minus size={14} strokeWidth={3} />}
            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.05em' }}>
              {isPositive ? '+' : isNegative ? '-' : ''}{percentage}% {sentiment.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600' }}>
            <Clock size={14} />
            {timeAgo}
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '28px', lineHeight: '1.2', marginBottom: '24px', color: 'white' }}>
          {title}
        </h2>

        {/* Sector and Source Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {tags.map((tag, i) => (
            <div key={i} style={{
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              {tag}
            </div>
          ))}
          <div style={{ 
            color: 'var(--text-primary)', 
            fontSize: '12px', 
            fontWeight: '600',
            border: '1px solid rgba(255,255,255,0.05)',
            backgroundColor: 'rgba(255,255,255,0.02)',
            padding: '6px 14px',
            borderRadius: '20px'
          }}>
            Source: {sourceName}
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="key-takeaways-glow" style={{
          backgroundColor: '#161619',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Sparkles size={20} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '20px', color: 'white' }}>Key Takeaways</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {bullets.map((bullet, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="var(--accent-primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <p style={{ margin: 0, color: '#e5e7eb', fontSize: '15px', lineHeight: '1.5' }}>
                  {bullet}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ArticleDetail;
