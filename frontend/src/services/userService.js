import axios from 'axios';

// API configuration for Vite - use import.meta.env
const API_URL =
  `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_VERSION}` ||
  'http://localhost:5000/api/v1';

// Configure axios defaults
axios.defaults.withCredentials = true;

const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User service functions
export const userService = {
  // Fetch all users
  getUsers: async () => {
    try {
      const response = await api.get('/user/users');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/user/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await api.post('/user/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/user/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/user/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle user suspension
  toggleSuspend: async (userId, currentStatus) => {
    try {
      // Determine which endpoint to call based on current status
      const endpoint = currentStatus
        ? `/user/unsuspend/${userId}` // If currently suspended, restore
        : `/user/suspend/${userId}`; // If active, suspend

      const response = await api.put(endpoint);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/user/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get user stats
  getUserStats: async () => {
    try {
      const response = await api.get('/user/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default api;