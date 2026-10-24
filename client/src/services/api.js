// src/services/api.js
// Axios instance with base URL and credential support
// Demonstrates: Axios configuration, interceptors (Lecture 35-36)

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Send HTTP-only cookies with every request
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on an auth page
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
