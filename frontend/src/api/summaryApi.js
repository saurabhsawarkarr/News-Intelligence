const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const fetchDailySummary = async (date, sector) => {
  let url = `${API_BASE_URL}/daily-summary`;
  const params = new URLSearchParams();
  
  if (date) {
    params.append('date', date);
  }
  if (sector) {
    params.append('sector', sector);
  }
  
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
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
