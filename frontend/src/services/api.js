import axios from 'axios';

const api = axios.create({
  baseURL: '', // Empty because Vite proxy handles /api and /auth
  withCredentials: true // Important for sending/receiving HttpOnly cookies
});

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Could redirect to login here if needed
      console.warn("Unauthorized access");
    }
    return Promise.reject(error);
  }
);

export default api;
