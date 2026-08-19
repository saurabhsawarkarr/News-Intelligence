const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

export const fetchDailySummariesList = async (dateRange, sector) => {
  let url = `${API_BASE_URL}/aggregated-summary`;
  const params = new URLSearchParams();
  
  if (dateRange) {
    params.append('date', dateRange);
  }
  
  if (sector && sector !== 'All') {
    params.append('sector', sector);
  }

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch aggregated summary');
  }

  // The endpoint returns a single aggregated object.
  // We return it in an array to remain compatible with existing mapping logic if needed,
  // or just return the object directly since DailySummaryCard already does `Array.isArray(summary) ? summary : [summary]`.
  return await response.json();
};
