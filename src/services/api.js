import axios from 'axios';

// Create axios instance with base URL from env
const API = axios.create({
  baseURL: import.meta.env.VITE_ECHOMAP_API_URL || 'http://localhost:8080',
  timeout: 10000,
  withCredentials: true,
});

// Add request interceptor to include auth token if available
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Redirect to login or clear tokens
      localStorage.removeItem('token');
      // Could dispatch an action to update auth state if using Redux/Context
    }
    
    // Handle server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default API;
