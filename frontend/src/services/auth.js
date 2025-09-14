import api from './api';

export async function register({ name, email, password }) {
  const { data } = await api.post('/api/auth/register', { name, email, password });
  return data.user;
}

export async function login({ email, password }) {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data.user;
}

export async function logout() {
  await api.post('/api/auth/logout');
}

export async function me() {
  const { data } = await api.get('/api/auth/me');
  return data.user;
}

