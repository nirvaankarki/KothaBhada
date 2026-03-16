import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';
const persistedToken = typeof window !== 'undefined' ? window.localStorage.getItem('kothabhada_token') : '';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    ...(persistedToken ? { Authorization: `Bearer ${persistedToken}` } : {}),
  },
});

export default api;