import api from './api';

export async function getSummary(params = {}) {
  const { data } = await api.get('/api/reports/summary', { params });
  return data;
}

export async function getByCategory(params = {}) {
  const { data } = await api.get('/api/reports/by-category', { params });
  return data.categories;
}

export async function getTimeline(params = {}) {
  const { data } = await api.get('/api/reports/timeline', { params });
  return data.series;
}

