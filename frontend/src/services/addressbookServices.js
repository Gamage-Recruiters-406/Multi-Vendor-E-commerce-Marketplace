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

// ============ PROFILE API CALLS ============

/**
 * Get buyer profile
 */
export const getProfile = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/user/profile`);
    
    if (response.data.success && response.data.user) {
      return {
        success: true,
        data: {
          fullName: response.data.user.fullname || response.data.user.fullName || "",
          email: response.data.user.email || "",
          phone: response.data.user.phone || "",
          country: response.data.user.country || "United States",
          profilePicture: response.data.user.profilePicture || null,
        },
      };
    }
    
    return {
      success: false,
      message: response.data.message || "Failed to load profile",
    };
  } catch (error) {
    console.error("Get profile error:", error.message);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Not authenticated. Please login again.",
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load profile",
    };
  }
};

/**
 * Update phone number
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
 * Upload profile picture
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
      message: response.data.message || "Failed to upload profile picture",
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
 * Get profile picture
 */
export const getProfilePicture = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/user/get-profile-picture`, {
      responseType: 'blob', // Important for image data
    });

    if (response.data) {
      // Create object URL from blob
      const imageUrl = URL.createObjectURL(response.data);
      return {
        success: true,
        imageUrl: imageUrl,
      };
    }

    return {
      success: false,
      message: "No profile picture found",
    };
  } catch (error) {
    console.error("Get profile picture error:", error.message);
    
    if (error.response?.status === 404) {
      return {
        success: false,
        message: "No profile picture found",
      };
    }
    
    return {
      success: false,
      message: error.response?.data?.message || "Failed to load profile picture",
    };
  }
};

/**
 * Remove profile picture
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

// ============ ADDRESS BOOK API CALLS (MOCK DATA FOR NOW) ============

// Mock address data storage (in memory - will reset on page refresh)
let mockAddresses = [
  {
    _id: "1",
    label: "Home",
    street: "123 Main Street",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "United States",
    isDefault: true,
  },
  {
    _id: "2",
    label: "Office",
    street: "456 Business Ave",
    city: "Los Angeles",
    state: "CA",
    zip: "90001",
    country: "United States",
    isDefault: false,
  },
];

let nextAddressId = 3;

/**
 * Get all addresses (MOCK DATA)
 */
export const getAllAddresses = async () => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: [...mockAddresses],
    };
  } catch (error) {
    console.error("Get all addresses error:", error);
    return {
      success: false,
      message: "Failed to load addresses",
      data: [],
    };
  }
};

/**
 * Add new address (MOCK DATA)
 */
export const addAddress = async (address) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newAddress = {
      _id: String(nextAddressId++),
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state || "",
      zip: address.zip || "",
      country: address.country || "United States",
      isDefault: false,
    };
    
    mockAddresses.push(newAddress);
    
    return {
      success: true,
      message: "Address added successfully",
      data: newAddress,
    };
  } catch (error) {
    console.error("Add address error:", error);
    return {
      success: false,
      message: "Failed to add address",
    };
  }
};

/**
 * Update address (MOCK DATA)
 */
export const updateAddress = async (addressId, address) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const index = mockAddresses.findIndex(addr => addr._id === addressId);
    
    if (index === -1) {
      return {
        success: false,
        message: "Address not found",
      };
    }
    
    mockAddresses[index] = {
      ...mockAddresses[index],
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state || "",
      zip: address.zip || "",
      country: address.country || "United States",
    };
    
    return {
      success: true,
      message: "Address updated successfully",
      data: mockAddresses[index],
    };
  } catch (error) {
    console.error("Update address error:", error);
    return {
      success: false,
      message: "Failed to update address",
    };
  }
};

/**
 * Delete address (MOCK DATA)
 */
export const deleteAddress = async (addressId) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const initialLength = mockAddresses.length;
    mockAddresses = mockAddresses.filter(addr => addr._id !== addressId);
    
    if (mockAddresses.length === initialLength) {
      return {
        success: false,
        message: "Address not found",
      };
    }
    
    return {
      success: true,
      message: "Address deleted successfully",
    };
  } catch (error) {
    console.error("Delete address error:", error);
    return {
      success: false,
      message: "Failed to delete address",
    };
  }
};

/**
 * Set default address (MOCK DATA)
 */
export const setDefaultAddress = async (addressId) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Remove default from all addresses
    mockAddresses = mockAddresses.map(addr => ({
      ...addr,
      isDefault: addr._id === addressId,
    }));
    
    const defaultAddress = mockAddresses.find(addr => addr._id === addressId);
    
    if (!defaultAddress) {
      return {
        success: false,
        message: "Address not found",
      };
    }
    
    return {
      success: true,
      message: "Default address updated successfully",
      data: defaultAddress,
    };
  } catch (error) {
    console.error("Set default address error:", error);
    return {
      success: false,
      message: "Failed to set default address",
    };
  }
};