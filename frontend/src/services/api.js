import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.29.104:5003';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    // Get the current user
    const user = auth.currentUser;
    if (user) {
      // Get the token
      const token = await user.getIdToken();
      // Add it to the headers
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response?.data?.retry_after || 60;
      console.warn(`Rate limited. Please wait ${retryAfter} seconds before trying again.`);
      
      // You could dispatch a toast notification here
      // or return a custom error object
      return Promise.reject({
        ...error,
        isRateLimit: true,
        retryAfter: retryAfter,
        message: error.response?.data?.error || 'Too many requests. Please wait before trying again.'
      });
    }
    
    return Promise.reject(error);
  }
);

export const nutritionAPI = {
  // Search for foods
  searchFoods: async (query) => {
    try {
      const response = await api.get(`/api/search/${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to search foods');
    }
  },

  // Get detailed food information
  getFoodDetails: async (fdcId) => {
    try {
      const response = await api.get(`/api/food/${fdcId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get food details');
    }
  },

  // Get search history
  getHistory: async () => {
    try {
      const response = await api.get('/api/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get history');
    }
  },

  // Add to search history
  addToHistory: async (foodData) => {
    try {
      const response = await api.post('/api/history', foodData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add to history');
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend service is not available');
    }
  },

  // === AUTHENTICATION ENDPOINTS ===
  
  // Verify Firebase token with backend
  verifyUser: async (idToken) => {
    try {
      const response = await api.post('/api/auth/verify', { idToken });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to verify user');
    }
  },

  // Get user profile (protected)
  getUserProfile: async (idToken) => {
    try {
      const response = await api.get('/api/profile', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get user profile');
    }
  },

  // Update user profile (protected)
  updateUserProfile: async (idToken, profileData) => {
    try {
      const response = await api.post('/api/profile/update', profileData, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update user profile');
    }
  },

  // === DIETARY GOALS ENDPOINTS ===
  
  // Set dietary goals (protected)
  setDietaryGoals: async (idToken, goalsData) => {
    try {
      const response = await api.post('/api/dietary-goals', goalsData, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to set dietary goals');
    }
  },

  // === MEAL LOGGING ENDPOINTS ===
  
  // Log a meal (protected)
  logMeal: async (idToken, mealData) => {
    try {
      const response = await api.post('/api/meals', mealData, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to log meal');
    }
  },

  // Get meals (protected)
  getMeals: async (idToken, params = {}) => {
    try {
      const response = await api.get('/api/meals', {
        headers: { Authorization: `Bearer ${idToken}` },
        params
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get meals');
    }
  },

  // Get nutrition summary (protected)
  getNutritionSummary: async (idToken, date = null) => {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/api/nutrition-summary', {
        headers: { Authorization: `Bearer ${idToken}` },
        params
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get nutrition summary');
    }
  },

  // === PDF EXPORT ENDPOINT ===
  
  // Export nutrition report as PDF (protected)
  exportPDFReport: async (idToken, days = 7) => {
    try {
      const response = await api.get('/api/export/pdf', {
        headers: { Authorization: `Bearer ${idToken}` },
        params: { days },
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nutrivault_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to export PDF report');
    }
  },

  // Edit a meal (protected)
  updateMeal: async (idToken, mealId, mealData) => {
    try {
      const response = await api.put(`/api/meals/${mealId}`, mealData, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update meal');
    }
  },

  // Delete a meal (protected)
  deleteMeal: async (idToken, mealId) => {
    try {
      const response = await api.delete(`/api/meals/${mealId}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete meal');
    }
  },
};

export default api;
