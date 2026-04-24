import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const headers = config.headers || {};

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  } else if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  config.headers = headers;

  if (typeof window !== 'undefined') {
    let token = '';
    try {
      token = window.sessionStorage.getItem('kothabhada_token') || '';
    } catch {
      token = '';
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
  }

  return config;
});

export default api;