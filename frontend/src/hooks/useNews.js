import { useState, useEffect, useCallback, useRef } from 'react';
import { newsApi } from '../api/newsApi';

// Auto-refresh interval: 5 minutes (matches problem statement's hourly pipeline;
// frontend checks every 5 min so it picks up new data shortly after the pipeline runs)
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// Default date is 'today' as requested
export const useNews = (initialFilters = { sentiment: 'All', date: 'today', sector: null, page: 1 }) => {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 20 });
  const [sectors, setSectors] = useState([]);
  const [health, setHealth] = useState({ status: 'unknown', last_run: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use a ref to always have access to latest filters in the interval callback
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchNews = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (currentFilters.sentiment && currentFilters.sentiment !== 'All') {
        params.sentiment = currentFilters.sentiment;
      }
      if (currentFilters.date) {
        params.date = currentFilters.date;
      }
      if (currentFilters.sector && currentFilters.sector !== 'All') {
        params.sector = currentFilters.sector;
      }
      params.page = currentFilters.page || 1;

      const newsData = await newsApi.getNews(params);
      setData(newsData);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const [sectorsData, healthData] = await Promise.all([
        newsApi.getSectors(),
        newsApi.getHealth(),
      ]);
      setSectors(sectorsData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Reload news when filters change
  useEffect(() => {
    fetchNews(filters);
  }, [filters, fetchNews]);

  // ── Auto-refresh every 5 minutes ──────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      fetchMetadata();
      fetchNews(filtersRef.current);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [fetchMetadata, fetchNews]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when any filter other than page changes
      page: key === 'page' ? value : 1,
    }));
  };

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const minSpinTime = new Promise(resolve => setTimeout(resolve, 1000));
      await Promise.all([
        newsApi.triggerRefresh(),
        minSpinTime
      ]);
      await fetchMetadata();
      await fetchNews(filtersRef.current);
    } catch (err) {
      console.error('Failed to trigger refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMetadata, fetchNews]);

  return {
    ...data,
    sectors,
    health,
    loading: loading || isRefreshing,
    error,
    filters,
    lastRefreshed,
    updateFilter,
    refresh,
  };
};
