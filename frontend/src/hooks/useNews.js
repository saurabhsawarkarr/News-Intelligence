import { useState, useEffect, useCallback } from 'react';
import { newsApi } from '../api/newsApi';

export const useNews = (initialFilters = { sentiment: 'All', date: null, sector: null, page: 1 }) => {
  const [data, setData] = useState({ data: [], total: 0, page: 1, limit: 20 });
  const [sectors, setSectors] = useState([]);
  const [health, setHealth] = useState({ status: 'unknown', last_run: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

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
    } catch (err) {
      setError(err.message || 'Failed to fetch news');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [sectorsData, healthData] = await Promise.all([
        newsApi.getSectors(),
        newsApi.getHealth()
      ]);
      setSectors(sectorsData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
    }
  }, []);

  // Initial load of metadata
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Load news when filters change
  useEffect(() => {
    fetchNews(filters);
  }, [filters, fetchNews]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page when other filters change
      page: key === 'page' ? value : 1
    }));
  };

  return {
    ...data,
    sectors,
    health,
    loading,
    error,
    filters,
    updateFilter,
    refresh: () => {
      fetchInitialData();
      fetchNews(filters);
    }
  };
};
