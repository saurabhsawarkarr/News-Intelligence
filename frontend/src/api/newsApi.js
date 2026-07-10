import axios from 'axios';

// Use '/api' to go through Vite's dev-server proxy (vite.config.js → localhost:8000).
// In production, set VITE_API_URL to the deployed backend base URL.
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const newsApi = {
  getNews: async (params = {}) => {
    try {
      const response = await api.get('/news', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  },
  
  getSectors: async () => {
    try {
      const response = await api.get('/news/sectors');
      return response.data;
    } catch (error) {
      console.error('Error fetching sectors:', error);
      throw error;
    }
  },
  
  getHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching health status:', error);
      throw error;
    }
  }
};
