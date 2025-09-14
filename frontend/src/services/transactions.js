import api from './api';

export async function createTransaction(payload) {
  const { data } = await api.post('/api/transactions', payload);
  return data.transaction;
}

export async function listTransactions(params = {}) {
  const { data } = await api.get('/api/transactions', { params });
  // returns: { transactions, page, limit, total, totalPages, hasNext, hasPrev }
  return data;
}

export async function updateTransaction(id, payload) {
  const { data } = await api.patch(`/api/transactions/${id}`, payload);
  return data.transaction;
}

export async function deleteTransaction(id) {
  await api.delete(`/api/transactions/${id}`);
}

export async function createTransactionsBulk(items) {
  const { data } = await api.post('/api/transactions/bulk', { transactions: items });
  // Be defensive in case backend returns no body for some reason
  return data || { createdCount: 0, failedCount: 0, created: [], failed: [] };
}
