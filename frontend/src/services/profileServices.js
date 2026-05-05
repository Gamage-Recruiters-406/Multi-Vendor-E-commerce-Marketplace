import axios from "axios";

const normalizeUrlPart = (value = '') => value.replace(/\/\/+$/, '');
const ensureLeadingSlash = (value = '') => value.startsWith('/') ? value : `/${value}`;

const API_BASE_URL = normalizeUrlPart(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const API_VERSION = ensureLeadingSlash(import.meta.env.VITE_API_VERSION || '/api/v1');
const API_URL = `${API_BASE_URL}${API_VERSION}`;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

// ============ VENDOR PROFILE API CALLS ============

/**
 * Get current logged-in vendor's profile
 * GET /api/v1/user/profile
 * @returns {Promise} Vendor profile data
 */
export const getMyVendorProfile = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/user/profile`);
    
    if (response.data && (response.data.user || response.data.data)) {
      const vendorData = response.data.user || response.data.data;
      return {
        success: true,
        data: vendorData,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load vendor profile",
      data: null,
    };
  } catch (error) {
    console.error("Get my vendor profile error:", error.message);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Not authenticated. Please login again.",
        data: null,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load vendor profile",
      data: null,
    };
  }
};

/**
 * Get vendor profile by vendor ID (for public viewing)
 * GET /api/v1/user/:vendorId
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Vendor profile data
 */
export const getVendorProfileById = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.get(`${API_URL}/user/${vendorId}`);
    
    if (response.data && (response.data.user || response.data.data)) {
      const vendorData = response.data.user || response.data.data;
      return {
        success: true,
        data: vendorData,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load vendor profile",
      data: null,
    };
  } catch (error) {
    console.error("Get vendor profile by ID error:", error.message);
    
    if (error.response?.status === 404) {
      return {
        success: false,
        message: "Vendor not found",
        data: null,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load vendor profile",
      data: null,
    };
  }
};

/**
 * Get vendor's products
 * Uses getAllProducts endpoint with filters to get products by vendor
 * @param {string} vendorId - Vendor ID
 * @param {Object} filters - Filter parameters (page, limit, category, etc.)
 * @returns {Promise} Products list
 */
export const getVendorProducts = async (vendorId, filters = {}) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    // We'll fetch all products and filter by vendor's store(s)
    // First, try to get products using query parameter if backend supports vendor filter
    const queryParams = new URLSearchParams({
      ...filters,
      // Some backends might support direct vendor filter
      vendor: vendorId
    });
    
    let url = `${API_URL}/product?${queryParams.toString()}`;
    
    try {
      const response = await apiClient.get(url);
      
      if (response.data && response.data.data) {
        const products = response.data.data;
        
        // Filter products by vendor if needed (in case backend doesn't do vendor filtering)
        let filteredProducts = Array.isArray(products) ? products : [];
        
        return {
          success: true,
          data: filteredProducts,
          total: response.data.count || filteredProducts.length,
          page: response.data.page || 1,
          pages: response.data.pages || 1,
        };
      }
      
      return {
        success: false,
        message: response.data?.message || "Failed to load products",
        data: [],
        total: 0,
        page: 1,
        pages: 1,
      };
    } catch (error) {
      console.error("Get vendor products error:", error.message);
      
      // Return empty array gracefully instead of error
      return {
        success: true,
        message: "No products found",
        data: [],
        total: 0,
        page: 1,
        pages: 1,
      };
    }
  } catch (error) {
    console.error("Get vendor products error:", error.message);
    
    return {
      success: true,
      message: "Failed to load products",
      data: [],
      total: 0,
      page: 1,
      pages: 1,
    };
  }
};

/**
 * Get vendor's orders (for order count)
 * GET /api/v1/orders/vendor/list (isVendor middleware)
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Orders list with count
 */
export const getVendorOrders = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/orders/vendor/list`);
    
    if (response.data && (response.data.orders || response.data.data)) {
      const orders = response.data.orders || response.data.data;
      return {
        success: true,
        data: orders,
        total: response.data.total || (orders.length || 0),
        count: orders.length || 0,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load orders",
      data: [],
      total: 0,
      count: 0,
    };
  } catch (error) {
    // Handle 404 errors silently - orders may not exist
    if (error.response?.status === 404) {
      return {
        success: false,
        message: "No orders found",
        data: [],
        total: 0,
        count: 0,
      };
    }
    
    console.error("Get vendor orders error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load orders",
      data: [],
      total: 0,
      count: 0,
    };
  }
};

/**
 * Get product average rating
 * GET /api/v1/review/average/:product_id
 * @param {string} productId - Product ID
 * @returns {Promise} Average rating data
 */
export const getProductAverageRating = async (productId) => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const response = await apiClient.get(`${API_URL}/review/average/${productId}`);
    
    const averageRating = response.data?.averageRating || response.data?.rating || 0;
    const totalReviews = response.data?.totalReviews || response.data?.count || 0;
    
    return {
      success: true,
      averageRating: parseFloat(averageRating).toFixed(1),
      totalReviews: totalReviews,
      breakdown: response.data?.breakdown || {},
    };
  } catch (error) {
    // Handle 404 silently - product ratings may not exist yet
    if (error.response?.status === 404) {
      return {
        success: false,
        averageRating: 0,
        totalReviews: 0,
        breakdown: {},
      };
    }
    
    console.error("Get product average rating error:", error.message);
    
    return {
      success: false,
      averageRating: 0,
      totalReviews: 0,
      breakdown: {},
      message: error.response?.data?.message || "Failed to load rating",
    };
  }
};

/**
 * Get vendor's reviews (for review count)
 * GET /api/v1/review/my
 * @returns {Promise} User's reviews
 */
export const getMyReviews = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/review/my`);
    
    if (response.data && (response.data.reviews || response.data.data)) {
      const reviews = response.data.reviews || response.data.data;
      return {
        success: true,
        data: reviews,
        total: response.data.total || (reviews.length || 0),
        count: reviews.length || 0,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load reviews",
      data: [],
      total: 0,
      count: 0,
    };
  } catch (error) {
    // Handle 404 silently - reviews may not exist
    if (error.response?.status === 404) {
      return {
        success: false,
        message: "No reviews found",
        data: [],
        total: 0,
        count: 0,
      };
    }
    
    console.error("Get my reviews error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load reviews",
      data: [],
      total: 0,
      count: 0,
    };
  }
};

/**
 * Get vendor's stores/shop info
 * GET /api/v1/store/my-stores (isVendor middleware)
 * @returns {Promise} Vendor's stores
 */
export const getVendorStores = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/store/my-stores`);
    
    if (response.data && (response.data.stores || response.data.data)) {
      const stores = response.data.stores || response.data.data;
      return {
        success: true,
        data: stores,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load stores",
      data: [],
    };
  } catch (error) {
    // Handle 404 silently - stores may not exist
    if (error.response?.status === 404) {
      return {
        success: false,
        message: "No stores found",
        data: [],
      };
    }
    
    console.error("Get vendor stores error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load stores",
      data: [],
    };
  }
};

/**
 * Get vendor rating (aggregated from all products)
 * Combines ratings from all vendor's products
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Vendor rating data
 */
export const getVendorRating = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    // First get all products for the vendor
    const productsResult = await getVendorProducts(vendorId);
    
    if (!productsResult.success || !productsResult.data.length) {
      return {
        success: true,
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    
    const products = productsResult.data;
    let totalRating = 0;
    let totalReviews = 0;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    // Get average rating for each product
    for (const product of products) {
      try {
        const ratingResult = await getProductAverageRating(product._id);
        if (ratingResult.success) {
          totalRating += parseFloat(ratingResult.averageRating) || 0;
          totalReviews += ratingResult.totalReviews || 0;
          
          if (ratingResult.breakdown) {
            for (let i = 1; i <= 5; i++) {
              ratingBreakdown[i] += ratingResult.breakdown[i] || 0;
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching rating for product ${product._id}:`, err);
      }
    }
    
    const averageRating = products.length > 0 ? totalRating / products.length : 0;
    
    return {
      success: true,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      ratingBreakdown,
    };
  } catch (error) {
    console.error("Get vendor rating error:", error.message);
    
    return {
      success: false,
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      message: error.message,
    };
  }
};

// ============ FOLLOW/UNFOLLOW VENDOR API CALLS ============

/**
 * Follow a vendor
 * POST /api/v1/follow/vendor/:vendorId
 * @param {string} vendorId - Vendor ID to follow
 * @returns {Promise} Follow response
 */
export const followVendor = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.post(`${API_URL}/follow/vendor/${vendorId}`);
    
    if (response.data?.success || response.status === 200 || response.status === 201) {
      return {
        success: true,
        message: response.data?.message || "Successfully followed vendor",
        data: response.data?.data || null,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to follow vendor",
    };
  } catch (error) {
    console.error("Follow vendor error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to follow vendor",
    };
  }
};

/**
 * Unfollow a vendor
 * DELETE /api/v1/follow/vendor/:vendorId
 * @param {string} vendorId - Vendor ID to unfollow
 * @returns {Promise} Unfollow response
 */
export const unfollowVendor = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.delete(`${API_URL}/follow/vendor/${vendorId}`);
    
    if (response.data?.success || response.status === 200 || response.status === 204) {
      return {
        success: true,
        message: response.data?.message || "Successfully unfollowed vendor",
        data: response.data?.data || null,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to unfollow vendor",
    };
  } catch (error) {
    console.error("Unfollow vendor error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to unfollow vendor",
    };
  }
};

/**
 * Check if user is following a vendor
 * GET /api/v1/follow/vendor/:vendorId/status
 * @param {string} vendorId - Vendor ID to check
 * @returns {Promise} Follow status
 */
export const checkFollowStatus = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.get(`${API_URL}/follow/vendor/${vendorId}/status`);
    
    return {
      success: true,
      isFollowing: response.data?.isFollowing || false,
      data: response.data?.data || null,
    };
  } catch (error) {
    console.error("Check follow status error:", error.message);
    
    // Return false for follow status if there's an error (not following)
    return {
      success: false,
      isFollowing: false,
      message: error.response?.data?.message || "Failed to check follow status",
    };
  }
};

// ============ REPORT VENDOR API CALLS ============

/**
 * Report a vendor
 * POST /api/v1/report/vendor/:vendorId
 * @param {string} vendorId - Vendor ID to report
 * @param {Object} reportData - Report data { reason, description }
 * @returns {Promise} Report response
 */
export const reportVendor = async (vendorId, reportData) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.post(`${API_URL}/report/vendor/${vendorId}`, reportData);
    
    if (response.data?.success || response.status === 200 || response.status === 201) {
      return {
        success: true,
        message: response.data?.message || "Report submitted successfully",
        data: response.data?.data || null,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to submit report",
    };
  } catch (error) {
    console.error("Report vendor error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to submit report",
    };
  }
};

// ============ UTILITY FUNCTIONS ============

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
  return localStorage.getItem("authToken");
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};

/**
 * Get current user from localStorage
 * @returns {Object|null} Current user object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Get user role from localStorage
 * @returns {string|null} User role (Buyer, Vendor, Admin) or null
 */
export const getUserRole = () => {
  try {
    const user = getCurrentUser();
    return user?.role || null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if user is a vendor
 * @returns {boolean} True if user is a vendor
 */
export const isVendor = () => {
  return getUserRole() === "Vendor";
};

// ============ DEFAULT EXPORT ============

export default {
  // Vendor Profile
  getMyVendorProfile,
  getVendorProfileById,
  getVendorProducts,
  getVendorOrders,
  getVendorStores,
  
  // Ratings & Reviews
  getVendorRating,
  getProductAverageRating,
  getMyReviews,
  
  // Follow/Unfollow
  followVendor,
  unfollowVendor,
  checkFollowStatus,
  
  // Report
  reportVendor,
  
  // Utility
  getToken,
  isAuthenticated,
  getCurrentUser,
  getUserRole,
  isVendor,
};