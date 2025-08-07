// src/api/axiosConfig.js

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
});

// --- NEW: Request Interceptor ---
// This runs BEFORE every single request is sent.
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('access_token');
    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // For request errors, just reject the promise
    return Promise.reject(error);
  }
);

// --- Response Interceptor (for handling expired tokens) ---
// This runs AFTER a response is received.
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // This part handles automatic logout if the token is bad
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete apiClient.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;