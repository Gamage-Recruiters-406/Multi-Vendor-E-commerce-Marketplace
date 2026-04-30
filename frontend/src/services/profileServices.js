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
 * GET /api/v1/product/vendor/:vendorId
 * @param {string} vendorId - Vendor ID
 * @param {Object} filters - Filter parameters (page, limit, category, etc.)
 * @returns {Promise} Products list
 */
export const getVendorProducts = async (vendorId, filters = {}) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const queryParams = new URLSearchParams(filters);
    const url = `${API_URL}/product/vendor/${vendorId}${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await apiClient.get(url);
    
    if (response.data && (response.data.products || response.data.data)) {
      const products = response.data.products || response.data.data;
      return {
        success: true,
        data: products,
        total: response.data.total || (products.length || 0),
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
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load products",
      data: [],
      total: 0,
      page: 1,
      pages: 1,
    };
  }
};

/**
 * Get user profile (for vendor's own profile)
 * GET /api/v1/user/profile
 * @returns {Promise} User profile data
 */
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/user/profile`);
    
    if (response.data.success && response.data.user) {
      return {
        success: true,
        data: {
          fullName: response.data.user.fullname || response.data.user.fullName || "",
          email: response.data.user.email || "",
          phone: response.data.user.phone || "",
          role: response.data.user.role || "",
          profilePicture: response.data.user.profilePicture || null,
          createdAt: response.data.user.createdAt,
        },
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load profile",
      data: null,
    };
  } catch (error) {
    console.error("Get user profile error:", error.message);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Not authenticated. Please login again.",
        data: null,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load profile",
      data: null,
    };
  }
};

/**
 * Get profile picture
 * GET /api/v1/user/get-profile-picture
 * @returns {Promise} Profile picture data
 */
export const getProfilePicture = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/user/get-profile-picture`, {
      responseType: 'blob',
    });

    if (response.data) {
      const imageUrl = URL.createObjectURL(response.data);
      return {
        success: true,
        imageUrl: imageUrl,
      };
    }

    return {
      success: false,
      message: "No profile picture found",
      imageUrl: null,
    };
  } catch (error) {
    console.error("Get profile picture error:", error.message);
    
    if (error.response?.status === 404) {
      return {
        success: false,
        message: "No profile picture found",
        imageUrl: null,
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load profile picture",
      imageUrl: null,
    };
  }
};

/**
 * Upload profile picture
 * @param {File} file - Image file to upload
 * @returns {Promise} Upload response
 */
export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await apiClient.post(`${API_URL}/user/upload-profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || "Profile picture uploaded successfully",
        profilePicture: response.data.profilePicture || response.data.data?.profilePicture,
      };
    }

    return {
      success: false,
      message: response.data?.message || "Failed to upload profile picture",
    };
  } catch (error) {
    console.error("Upload profile picture error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to upload profile picture",
    };
  }
};

/**
 * Remove profile picture
 * @returns {Promise} Remove response
 */
export const removeProfilePicture = async () => {
  try {
    const response = await apiClient.delete(`${API_URL}/user/remove-profile-picture`);

    return {
      success: response.data.success,
      message: response.data.message || "Profile picture removed successfully",
    };
  } catch (error) {
    console.error("Remove profile picture error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to remove profile picture",
    };
  }
};

/**
 * Update phone number
 * @param {string} phone - Phone number
 * @returns {Promise} Update response
 */
export const updatePhone = async (phone) => {
  try {
    const response = await apiClient.put(`${API_URL}/user/update-phone`, { phone });

    return {
      success: response.data.success,
      message: response.data.message || "Phone updated successfully",
      data: response.data.user,
    };
  } catch (error) {
    console.error("Update phone error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update phone",
    };
  }
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} confirmPassword - Confirm new password
 * @returns {Promise} Change password response
 */
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const response = await apiClient.put(`${API_URL}/user/change-password`, {
      currentPassword,
      newPassword,
      confirmNewPassword: confirmPassword,
    });

    return {
      success: response.data.success,
      message: response.data.message || "Password changed successfully",
    };
  } catch (error) {
    console.error("Change password error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to change password",
    };
  }
};

/**
 * Get vendor's orders
 * GET /api/v1/orders/vendor/:vendorId
 * @param {string} vendorId - Vendor ID
 * @param {Object} filters - Filter parameters (page, limit, status)
 * @returns {Promise} Orders data
 */
export const getVendorOrders = async (vendorId, filters = {}) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const queryParams = new URLSearchParams(filters);
    const url = `${API_URL}/orders/vendor/${vendorId}${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await apiClient.get(url);
    
    if (response.data && (response.data.orders || response.data.data)) {
      const orders = response.data.orders || response.data.data;
      return {
        success: true,
        data: orders,
        total: response.data.total || (orders.length || 0),
        page: response.data.page || 1,
        pages: response.data.pages || 1,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load orders",
      data: [],
      total: 0,
    };
  } catch (error) {
    console.error("Get vendor orders error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load orders",
      data: [],
      total: 0,
    };
  }
};

/**
 * Update order status (for vendors)
 * PATCH /api/v1/orders/vendor/:orderId/status
 * @param {string} orderId - Order ID
 * @param {string} status - New order status
 * @returns {Promise} Update response
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await apiClient.patch(`${API_URL}/orders/vendor/${orderId}/status`, { status });
    
    return {
      success: response.data.success,
      message: response.data.message || "Order status updated successfully",
      data: response.data.order || response.data.data,
    };
  } catch (error) {
    console.error("Update order status error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update order status",
    };
  }
};

// ============ VENDOR RATING & REVIEWS ============

/**
 * Get vendor rating (aggregated from all products)
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
          totalRating += ratingResult.averageRating || 0;
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
    
    return {
      success: true,
      averageRating: response.data.averageRating || response.data.rating || 0,
      totalReviews: response.data.totalReviews || 0,
      breakdown: response.data.breakdown || {},
    };
  } catch (error) {
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
 * Get product reviews
 * GET /api/v1/review/product/:product_id
 * @param {string} productId - Product ID
 * @param {Object} filters - Filter parameters (page, limit)
 * @returns {Promise} Reviews list
 */
export const getProductReviews = async (productId, filters = {}) => {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const queryParams = new URLSearchParams(filters);
    const url = `${API_URL}/review/product/${productId}${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await apiClient.get(url);
    
    if (response.data && (response.data.reviews || response.data.data)) {
      const reviews = response.data.reviews || response.data.data;
      return {
        success: true,
        data: reviews,
        total: response.data.total || (reviews.length || 0),
        page: response.data.page || 1,
        pages: response.data.pages || 1,
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load reviews",
      data: [],
      total: 0,
    };
  } catch (error) {
    console.error("Get product reviews error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load reviews",
      data: [],
      total: 0,
    };
  }
};

/**
 * Get my reviews (for authenticated user)
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
      };
    }
    
    return {
      success: false,
      message: response.data?.message || "Failed to load reviews",
      data: [],
    };
  } catch (error) {
    console.error("Get my reviews error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load reviews",
      data: [],
    };
  }
};

// ============ FOLLOW & REPORT ============

/**
 * Follow a vendor
 * @param {string} vendorId - Vendor ID to follow
 * @returns {Promise} Follow response
 */
export const followVendor = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.post(`${API_URL}/user/${vendorId}/follow`);
    
    return {
      success: response.data.success,
      message: response.data.message || "Vendor followed successfully",
      data: response.data.data,
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
 * @param {string} vendorId - Vendor ID to unfollow
 * @returns {Promise} Unfollow response
 */
export const unfollowVendor = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.post(`${API_URL}/user/${vendorId}/unfollow`);
    
    return {
      success: response.data.success,
      message: response.data.message || "Vendor unfollowed successfully",
      data: response.data.data,
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
 * Check follow status for a vendor
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Follow status
 */
export const checkFollowStatus = async (vendorId) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.get(`${API_URL}/user/${vendorId}/follow-status`);
    
    return {
      success: true,
      isFollowing: response.data.isFollowing || response.data.following || false,
    };
  } catch (error) {
    console.error("Check follow status error:", error.message);
    
    return {
      success: false,
      isFollowing: false,
    };
  }
};

/**
 * Report a vendor
 * @param {string} vendorId - Vendor ID to report
 * @param {Object} reportData - Report details (reason, description)
 * @returns {Promise} Report response
 */
export const reportVendor = async (vendorId, reportData) => {
  try {
    if (!vendorId) {
      throw new Error('Vendor ID is required');
    }

    const response = await apiClient.post(`${API_URL}/user/${vendorId}/report`, reportData);
    
    return {
      success: response.data.success,
      message: response.data.message || "Vendor reported successfully",
    };
  } catch (error) {
    console.error("Report vendor error:", error.message);
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to report vendor",
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
  getUserProfile,
  getProfilePicture,
  uploadProfilePicture,
  removeProfilePicture,
  updatePhone,
  changePassword,
  
  // Orders
  getVendorOrders,
  updateOrderStatus,
  
  // Ratings & Reviews
  getVendorRating,
  getProductAverageRating,
  getProductReviews,
  getMyReviews,
  
  // Follow & Report
  followVendor,
  unfollowVendor,
  checkFollowStatus,
  reportVendor,
  
  // Utility
  getToken,
  isAuthenticated,
  getCurrentUser,
  getUserRole,
  isVendor,
};