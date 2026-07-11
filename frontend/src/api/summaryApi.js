const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const fetchDailySummary = async (date) => {
  let url = `${API_BASE_URL}/daily-summary`;
  if (date) {
    url += `?date=${date}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch daily summary');
  }

  return await response.json();
};
