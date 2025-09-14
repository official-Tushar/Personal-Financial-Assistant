import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optionally redirect on 401
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

