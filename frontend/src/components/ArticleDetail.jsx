import React from 'react';
import { ArrowLeft, Share2, TrendingUp, TrendingDown, Minus, Sparkles, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const ArticleDetail = ({ article, onBack }) => {
  const { title, summary, reasoning, published_at, sources, sentiment, primary_sector, secondary_sector } = article;

  let timeAgo = 'Unknown time';
  let formattedDate = '';
  try {
    if (published_at) {
      const dt = parseISO(published_at);
      timeAgo = formatDistanceToNow(dt, { addSuffix: true }).replace('about ', '');
      formattedDate = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    // Invalid date — use fallback
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

  const SentimentIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const sentimentLabel = sentiment || 'Neutral';

  // Sector tags
  const tags = [];
  if (primary_sector) tags.push(primary_sector);
  if (secondary_sector) tags.push(secondary_sector);

  // Split reasoning into readable bullet points
  const bullets = reasoning
    ? reasoning.split(/(?<=\.)\s+/).filter(b => b.trim().length > 10)
    : ['No detailed analysis available for this article.'];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: summary || title, url: sources?.[0]?.url || window.location.href });
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(sources?.[0]?.url || window.location.href);
    }
  };

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={onBack} style={{ color: 'white', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '18px', letterSpacing: '-0.02em', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
          News<span style={{ fontWeight: '400' }}>Intelligence</span>
        </h1>
        <button onClick={handleShare} style={{ color: 'var(--text-muted)', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)' }}>
          <Share2 size={18} />
        </button>
      </div>

      <div style={{ padding: '24px 20px' }}>

        {/* Sentiment badge + time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>

          {/* Correct Sentiment Badge — no fake % */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 16px',
            borderRadius: '20px',
            backgroundColor: sentimentBg,
            color: sentimentColor,
            border: `1px solid ${sentimentColor}40`,
          }}>
            <SentimentIcon size={14} strokeWidth={3} />
            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {sentimentLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>
            <Clock size={13} />
            {timeAgo}{formattedDate ? ` · ${formattedDate}` : ''}
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '26px', lineHeight: '1.25', marginBottom: '20px', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
          {title}
        </h2>

        {/* Sector tags + ALL source links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {tags.map((tag, i) => (
            <div key={i} style={{
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
            }}>
              {tag}
            </div>
          ))}

          {/* All sources, not just first */}
          {sources && sources.map((src, i) => (
            src.url ? (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  padding: '5px 14px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
              >
                <ExternalLink size={10} />
                {src.name}
              </a>
            ) : (
              <div key={i} style={{
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '600',
                border: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: 'rgba(255,255,255,0.02)',
                padding: '5px 14px',
                borderRadius: '20px',
              }}>
                {src.name}
              </div>
            )
          ))}
        </div>

        {/* AI Summary */}
        {summary && (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '18px',
            marginBottom: '20px',
          }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.65' }}>
              {summary}
            </p>
          </div>
        )}

        {/* AI Reasoning — Key Takeaways */}
        <div className="key-takeaways-glow" style={{
          backgroundColor: '#161619',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
              Why It Matters
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {bullets.map((bullet, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={17} color="var(--accent-primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                <p style={{ margin: 0, color: '#d1d5db', fontSize: '14.5px', lineHeight: '1.6' }}>
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
