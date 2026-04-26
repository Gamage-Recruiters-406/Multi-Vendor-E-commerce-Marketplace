/* Vendor Profile Services */

// Normalize URL - remove trailing slashes
const normalizeUrlPart = (value = '') => value.replace(/\/\/+$/, '');

// Ensure leading slash for path
const ensureLeadingSlash = (value = '') => value.startsWith('/') ? value : `/${value}`;

// Configure API endpoints using Vite environment variables or fallbacks
const API_BASE_URL = normalizeUrlPart(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const API_VERSION = ensureLeadingSlash(import.meta.env.VITE_API_VERSION || '/api');
const API_URL = `${API_BASE_URL}${API_VERSION}`;

console.log('🔗 Vendor Profile Service API URL:', API_URL);

/* Get authorization headers */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/* Parse API response safely */
const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

/* Make HTTP request with error handling */
const request = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const data = await parseResponse(response);

    if (!response.ok) {
      const message = data?.message || data?.error || response.statusText || 'Request failed';
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== VENDOR PROFILE OPERATIONS ====================

/**
 * Get current logged-in vendor's profile
 * Uses user/profile endpoint since vendors are users with vendor role
 * @returns {Promise} Vendor profile data
 */
export const getVendorProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in as a vendor to view this profile');
    }

    const url = `${API_URL}/user/profile`;
    console.log('🔗 Fetching vendor profile from:', url);
    
    const response = await request(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    console.log('✅ Vendor profile response:', response);
    
    if (!response) {
      throw new Error('Empty response from vendor profile endpoint');
    }
    
    return {
      success: true,
      user: response.user || response.data || response,
      data: response.user || response.data || response,
    };
  } catch (error) {
    console.error('❌ Error fetching vendor profile:', error);
    throw error;
  }
};

/**
 * Get specific vendor's public profile by ID
 * @param {string} vendorId - Vendor ID to fetch
 * @returns {Promise} Vendor profile data
 */
export const getVendorProfileById = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    const url = `${API_URL}/vendors/${vendorId}`;
    console.log('🔗 Fetching vendor by ID from:', url);
    
    const response = await request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log('✅ Vendor by ID response:', response);
    
    return {
      success: true,
      user: response.user || response.data || response,
      data: response.user || response.data || response,
    };
  } catch (error) {
    console.error('❌ Error fetching vendor by ID:', error);
    throw error;
  }
};

/**
 * Get vendor's products
 * @param {string} vendorId - Vendor ID
 * @param {Object} filters - Filter parameters (page, limit, category, etc.)
 * @returns {Promise} Products list
 */
export const getVendorProducts = async (vendorId, filters = {}) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    const queryParams = new URLSearchParams(filters);
    const url = `${API_URL}/vendors/${vendorId}/products?${queryParams}`;
    
    return await request(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    throw error;
  }
};

/**
 * Get vendor's reviews
 * @param {string} vendorId - Vendor ID
 * @param {Object} filters - Filter parameters
 * @returns {Promise} Reviews list
 */
export const getVendorReviews = async (vendorId, filters = {}) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    const queryParams = new URLSearchParams(filters);
    const url = `${API_URL}/vendors/${vendorId}/reviews?${queryParams}`;
    
    return await request(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error fetching vendor reviews:', error);
    throw error;
  }
};

/**
 * Get vendor statistics
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Vendor stats
 */
export const getVendorStats = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    return await request(`${API_URL}/vendors/${vendorId}/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    throw error;
  }
};

/**
 * Get vendor rating breakdown
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Rating breakdown
 */
export const getRatingsBreakdown = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    return await request(`${API_URL}/vendors/${vendorId}/ratings-breakdown`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error fetching ratings breakdown:', error);
    throw error;
  }
};

/**
 * Get vendor verification badges
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Badges list
 */
export const getVendorBadges = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    return await request(`${API_URL}/vendors/${vendorId}/badges`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error fetching vendor badges:', error);
    throw error;
  }
};

/**
 * Get vendor journey/milestones
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Journey milestones
 */
export const getVendorJourney = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    return await request(`${API_URL}/vendors/${vendorId}/journey`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error fetching vendor journey:', error);
    throw error;
  }
};

// ==================== FOLLOW OPERATIONS ====================

/**
 * Follow a vendor (PROTECTED - Requires authentication)
 * @param {string} vendorId - Vendor ID to follow
 * @returns {Promise} Follow response
 */
export const followVendor = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    return await request(`${API_URL}/vendors/${vendorId}/follow`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error following vendor:', error);
    throw error;
  }
};

/**
 * Unfollow a vendor (PROTECTED - Requires authentication)
 * @param {string} vendorId - Vendor ID to unfollow
 * @returns {Promise} Unfollow response
 */
export const unfollowVendor = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    return await request(`${API_URL}/vendors/${vendorId}/unfollow`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error unfollowing vendor:', error);
    throw error;
  }
};

/**
 * Check follow status for a vendor
 * @param {string} vendorId - Vendor ID
 * @returns {Promise} Follow status
 */
export const checkFollowStatus = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    return await request(`${API_URL}/vendors/${vendorId}/follow-status`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    throw error;
  }
};

/**
 * Report a vendor
 * @param {string} vendorId - Vendor ID to report
 * @param {Object} reportData - Report details (reason, description, etc.)
 * @returns {Promise} Report response
 */
export const reportVendor = async (vendorId, reportData) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }

  try {
    return await request(`${API_URL}/vendors/${vendorId}/report`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reportData),
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error reporting vendor:', error);
    throw error;
  }
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/**
 * Get current user from localStorage
 * @returns {Object|null} Current user object or null
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
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
  return getUserRole() === 'Vendor';
};

// ==================== DEFAULT EXPORT ====================

export default {
  // Vendor Profile
  getVendorProfile,
  getVendorProfileById,
  getVendorProducts,
  getVendorReviews,
  getVendorStats,
  getRatingsBreakdown,
  getVendorBadges,
  getVendorJourney,

  // Follow Operations
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