/* Profile Service */

// Normalize URL - remove trailing slashes
const normalizeUrlPart = (value = '') => value.replace(/\/\/+$/, '');

// Ensure leading slash for path
const ensureLeadingSlash = (value = '') => value.startsWith('/') ? value : `/${value}`;

// Configure API endpoints using Vite environment variables
const API_BASE_URL = normalizeUrlPart(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const API_VERSION = ensureLeadingSlash(import.meta.env.VITE_API_VERSION || '/api/v1');
const API_URL = `${API_BASE_URL}${API_VERSION}`;

console.log('🔗 Profile API URL:', API_URL);

/* Get authorization headers */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/* Parse API response */
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
  const response = await fetch(url, options);
  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return data;
};

// CURRENT USER PROFILE OPERATIONS

/* Get current logged-in user's profile */
export const getUserProfile = async () => {
  try {
    return await request(`${API_URL}/user/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch profile');
  }
};

/* Update current user's profile (currently supports phone updates) */
export const updateUserProfile = async (profileData) => {
  try {
    // If updating phone, use the dedicated updatePhone endpoint
    if (profileData.phone && Object.keys(profileData).length === 1) {
      return await updatePhone(profileData.phone);
    }

    // For other profile data, you may need to extend this based on backend capabilities
    const data = await request(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
      credentials: 'include',
    });

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to update profile');
  }
};

/* Get current user's profile picture */
export const getProfilePicture = async () => {
  try {
    return await request(`${API_URL}/user/get-profile-picture`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch profile picture');
  }
};

/* Upload profile picture for current user (PROTECTED - requires authentication) */
export const uploadProfilePicture = async (file) => {
  if (!file) {
    throw new Error('File is required');
  }

  try {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const token = localStorage.getItem('token');
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/user/upload-profile-picture`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      const message = data?.message || data?.error || response.statusText || 'Upload failed';
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error('Profile Picture Upload Error:', error);
    throw new Error(error.message || 'Failed to upload profile picture');
  }
};

/* Remove profile picture for current user */
export const removeProfilePicture = async () => {
  try {
    return await request(`${API_URL}/user/remove-profile-picture`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to remove profile picture');
  }
};

/* Update phone number for current user  */
export const updatePhone = async (phone) => {
  if (!phone) {
    throw new Error('Phone number is required');
  }
  try {
    return await request(`${API_URL}/user/update-phone`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone }),
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to update phone');
  }
};

/* Change password for current user */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    return await request(`${API_URL}/user/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to change password');
  }
};

/* Get current vendor profile - Uses user/profile endpoint since vendors are users with vendor role */
export const getVendorProfile = async (vendorId = null) => {
  // If no vendorId provided, get the current logged-in vendor's profile
  if (!vendorId) {
    try {
      // Use the user profile endpoint for current logged-in vendor
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
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching vendor profile:', error);
      throw new Error(error.message || 'Failed to fetch current vendor profile');
    }
  }
  
  // If vendorId provided, get specific vendor's profile (requires backend vendor endpoint)
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
    
    if (!response) {
      throw new Error('Empty response from vendor endpoint');
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error fetching vendor by ID:', error);
    throw new Error(error.message || 'Failed to fetch vendor profile');
  }
};

/* Get specific vendor profile by ID (PUBLIC) - Alias for getVendorProfile with ID */
export const getVendorProfileById = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }
  return getVendorProfile(vendorId);
};

/* Get current logged-in vendor's profile (PROTECTED) */
export const getCurrentVendorProfile = async () => {
  return getVendorProfile();
};

/* Get vendor profile picture (PUBLIC) */
export const getVendorProfilePicture = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }
  try {
    return await request(`${API_URL}/vendors/${vendorId}/profile-picture`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch vendor picture');
  }
};

/* Get vendor's products (PUBLIC) */
export const getVendorProducts = async (vendorId, filters = {}) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }
  try {
    const queryParams = new URLSearchParams(filters);
    return await request(`${API_URL}/vendors/${vendorId}/products?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch products');
  }
};

/* Get vendor's reviews (PUBLIC) */
export const getVendorReviews = async (vendorId, filters = {}) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }
  try {
    const queryParams = new URLSearchParams(filters);
    return await request(`${API_URL}/vendors/${vendorId}/reviews?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch reviews');
  }
};

/* Get vendor statistics (PUBLIC) */
export const getVendorStats = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }
  try {
    return await request(`${API_URL}/vendors/${vendorId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch vendor stats');
  }
};

/* Get rating breakdown (PUBLIC) */
export const getRatingsBreakdown = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }
  try {
    return await request(`${API_URL}/vendors/${vendorId}/ratings-breakdown`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch ratings breakdown');
  }
};

/* Get vendor verification badges (PUBLIC) */
export const getVendorBadges = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }
  try {
    return await request(`${API_URL}/vendors/${vendorId}/badges`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch badges');
  }
};

/* Get vendor journey/milestones (PUBLIC) */
export const getVendorJourney = async (vendorId) => {
  if (!vendorId) {
    throw new Error('Vendor ID is required');
  }
  try {
    return await request(`${API_URL}/vendors/${vendorId}/journey`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch vendor journey');
  }
};

// FOLLOW OPERATIONS (Protected - Auth required)

/* Follow a vendor (PROTECTED - Requires authentication) */
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
    throw new Error(error.message || 'Failed to follow vendor');
  }
};

/* Unfollow a vendor (PROTECTED - Requires authentication) */
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
    throw new Error(error.message || 'Failed to unfollow vendor');
  }
};

/* Check follow status for a vendor (PROTECTED) */
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
    throw new Error(error.message || 'Failed to check follow status');
  }
};

/* Report a vendor (PROTECTED - Requires authentication) */
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
    throw new Error(error.message || 'Failed to report vendor');
  }
};

// ADMIN OPERATIONS

/* Get all users (ADMIN only) */
export const getAllUsers = async () => {
  try {
    return await request(`${API_URL}/user/all-users`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch users');
  }
};

/* Get users by role (ADMIN only) */
export const getUsersByRole = async (role) => {
  if (!role) {
    throw new Error('Role is required');
  }
  try {
    return await request(`${API_URL}/user/users-by-role/${role}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch users by role');
  }
};

// UTILITY FUNCTIONS

/* Get current user from localStorage */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

/* Get authentication token from localStorage */
export const getToken = () => {
  return localStorage.getItem('token');
};

/* Check if user is authenticated */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

/* Export all functions as default object for easier importing */
export default {
  // User Profile
  getUserProfile,
  updateUserProfile,
  getProfilePicture,
  uploadProfilePicture,
  removeProfilePicture,
  updatePhone,
  changePassword,

  // Vendor Profile
  getVendorProfile,
  getVendorProfileById,
  getCurrentVendorProfile,
  getVendorProfilePicture,
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

  // Admin
  getAllUsers,
  getUsersByRole,

  // Utility
  getCurrentUser,
  getToken,
  isAuthenticated,
};