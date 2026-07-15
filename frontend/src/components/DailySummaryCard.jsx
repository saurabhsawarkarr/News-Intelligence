import React, { useState, useEffect } from 'react';
import { fetchDailySummary, fetchDailySummariesList } from '../api/summaryApi';
import SentimentBadge from './SentimentBadge';
import SectorTag from './SectorTag';
import { Loader2, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DailySummaryCard = ({ date, sector, lastRefreshed }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      setSummary(null);
      try {
        const isMultiDay = date === '7days' || date === '1month';
        const data = isMultiDay
          ? await fetchDailySummariesList(date, sector)
          : await fetchDailySummary(date, sector);
        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [date, sector, lastRefreshed]); // Reload when date, sector changes or manual refresh

  const dateLabel = !date || date === 'today'
    ? 'Today'
    : date === 'yesterday'
    ? 'Yesterday'
    : date === '7days'
    ? 'Last 7 Days'
    : date === '1month'
    ? 'Last Month'
    : date;

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <Loader2 size={24} style={styles.spinner} />
          <span style={styles.loadingText}>
            Generating AI Market Summary{sector ? ` for ${sector}` : ''}…
          </span>
        </div>
      </div>
    );
  }

  if (error || !summary || (Array.isArray(summary) && summary.length === 0)) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <Calendar size={18} style={styles.icon} />
            <h2 style={styles.title}>Market Summary — {dateLabel}</h2>
          </div>
        </div>
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <p style={styles.emptyTitle}>No Summary Available</p>
          <p style={styles.emptyMessage}>
            {sector
              ? `No AI summary was generated for "${sector}" on ${dateLabel}. Try selecting a different sector or date.`
              : `No AI summary is available for ${dateLabel}. The pipeline may not have run yet for this period.`}
          </p>
        </div>
      </div>
    );
  }

  const summariesToRender = Array.isArray(summary) ? summary : [summary];

  return (
    <>
      {summariesToRender.map((s, index) => {
        const sectorsList = s.sectors ? s.sectors.split(',').map(sec => sec.trim()) : [];
        return (
          <div key={s.id || index} style={styles.container}>
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                <Calendar size={18} style={styles.icon} />
                <h2 style={styles.title}>
                  Market Summary {s.date_val && `(${s.date_val})`}
                </h2>
              </div>
              <SentimentBadge sentiment={s.sentiment} />
            </div>

            <div style={styles.content}>
              <p style={styles.summaryText}>{s.summary}</p>
              
              {s.events && (
                <div style={styles.eventsContainer}>
                  <h4 style={styles.sectionTitle}>Key Events</h4>
                  <div style={styles.markdownWrapper}>
                    <ReactMarkdown>{s.events}</ReactMarkdown>
                  </div>
                </div>
              )}

              {s.reasoning && (
                <div style={styles.reasoningContainer}>
                  <h4 style={styles.sectionTitle}>Why it matters</h4>
                  <p style={styles.reasoningText}>{s.reasoning}</p>
                </div>
              )}
            </div>

            {sectorsList.length > 0 && (
              <div style={styles.footer}>
                <span style={styles.impactedLabel}>Impacted:</span>
                <div style={styles.sectorsWrapper}>
                  {sectorsList.map((sec, idx) => (
                    <SectorTag key={idx} sector={sec} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

const styles = {
  container: {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid rgba(255,255,255,0.05)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.03), rgba(0,0,0,0))',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    color: 'var(--text-muted)',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  icon: {
    color: 'var(--color-primary)',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: 'var(--text-primary)',
    margin: 0,
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    marginTop: 0,
  },
  eventsContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
  },
  markdownWrapper: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    paddingLeft: '8px', // To indent bullets
  },
  reasoningContainer: {
    borderLeft: '3px solid rgba(255,255,255,0.1)',
    paddingLeft: '12px',
  },
  reasoningText: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: 'var(--text-muted)',
    margin: 0,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px dashed rgba(255,255,255,0.1)',
  },
  impactedLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)',
  },
  sectorsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
    gap: '12px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '4px',
  },
  emptyTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  emptyMessage: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--text-muted)',
    margin: 0,
    maxWidth: '420px',
  },
};

export default DailySummaryCard;
