import api from './api';

export async function analyzeReceipt(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/api/receipts/analyze', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.extracted;
}

