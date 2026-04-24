import axios from 'axios';

// For Vite, use import.meta.env instead of process.env
const API_BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_API_VERSION}` ||
  'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Home Service - All home page related API calls
class HomeService {
  // Get recent stores
  static async getRecentStores(limit = 6) {
    try {
      const response = await api.get(`/store/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent stores:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  }

  // Get single store by ID
  static async getSingleStore(id) {
    try {
      const response = await api.get(`/store/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching store:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  }

  // Get multiple stores by IDs (if needed)
  static async getStoresByIds(ids) {
    try {
      // Fetch stores in parallel
      const promises = ids.map((id) => api.get(`/store/${id}`));
      const responses = await Promise.all(promises);
      return responses.map((res) => res.data.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  }

  // Get recent products for new arrivals
  static async getRecentProducts(limit = 6) {
    try {
      const response = await api.get(`/product?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent products:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  }

  // Get featured products (you can add this later)
  static async getFeaturedProducts(limit = 6) {
    try {
      const response = await api.get(`/product/featured?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error.response?.data || { success: false, message: error.message };
    }
  }

  // Get announcements
  static async getLatestAnnouncements(limit = 1) {
    try {
      // Use the public endpoint instead
      const response = await api.get(`/announcements/public?limit=${limit}`);
      if (response.data.success && response.data.announcements) {
        // Transform to match frontend expected format
        const formattedData = response.data.announcements.map(
          (announcement) => ({
            _id: announcement._id,
            title: announcement.title,
            content: announcement.description,
            type: announcement.type,
            createdAt: announcement.publishDate || announcement.createdAt,
            views: 0,
            icon: this.getIconForAnnouncementType(announcement.type),
          }),
        );
        return {
          success: true,
          data: formattedData,
        };
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Return empty data instead of throwing error for announcements
      return { success: true, data: [] };
    }
  }

  static getIconForAnnouncementType(type) {
    const icons = {
      'Offer / Promotion': '🎉',
      'Feature Update': '✨',
      Maintenance: '🔧',
      'General Info': '📢',
    };
    return icons[type] || '📢';
  }
}

export default HomeService;
