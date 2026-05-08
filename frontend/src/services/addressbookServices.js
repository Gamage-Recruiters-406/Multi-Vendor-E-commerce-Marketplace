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
      // Normalize profile picture if it exists
      let profilePicture = response.data.user.profilePicture;
      if (profilePicture && typeof profilePicture === 'string') {
        profilePicture = profilePicture.trim();
        if (!profilePicture) {
          profilePicture = null;
        }
      }

      return {
        success: true,
        data: {
          fullName: response.data.user.fullname || response.data.user.fullName || "",
          email: response.data.user.email || "",
          phone: response.data.user.phone || "",
          country: response.data.user.country || "Sri Lanka",
          profilePicture: profilePicture || null,
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
 * Uses correct backend endpoint PUT /change-password with correct payload
 */
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    // Validate inputs on client side
    if (!currentPassword || !newPassword || !confirmPassword) {
      return {
        success: false,
        message: "All password fields are required",
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: "New password and confirmation do not match",
      };
    }

    if (newPassword.length < 6) {
      return {
        success: false,
        message: "New password must be at least 6 characters",
      };
    }

    console.log("=== CHANGE PASSWORD REQUEST ===");
    console.log("Attempting to change password...");
    console.log("Auth Token present:", !!localStorage.getItem("authToken"));
    console.log("Sending request to: PUT " + `${API_URL}/change-password`);
    console.log("Payload fields: currentPassword, newPassword, confirmNewPassword");

    // Use the CORRECT endpoint and payload format that matches your backend
    const response = await apiClient.put(`${API_URL}/user/change-password`, {
      currentPassword,
      newPassword,
      confirmNewPassword: confirmPassword,  // IMPORTANT: Backend expects confirmNewPassword
    });

    console.log("✅ Password change response:", response.data);

    if (response.data.success) {
      console.log("✅ SUCCESS: Password changed successfully!");
      return {
        success: true,
        message: response.data.message || "Password changed successfully!",
      };
    }

    console.log("❌ FAILED: Response not successful");
    return {
      success: false,
      message: response.data.message || "Failed to change password",
    };
  } catch (error) {
    console.error("=== PASSWORD CHANGE ERROR ===");
    console.error("❌ Error occurred:", error.message);
    console.error("Error status:", error.response?.status);
    console.error("Error data:", error.response?.data);

    // Provide specific error messages based on backend response
    if (error.response?.status === 401) {
      console.error("401: Current password is incorrect OR user not authenticated");
      return {
        success: false,
        message: error.response?.data?.message || "Current password is incorrect. Please verify and try again.",
      };
    }

    if (error.response?.status === 400) {
      console.error("400: Bad request - password doesn't meet requirements");
      return {
        success: false,
        message: error.response?.data?.message || "Password must be at least 6 characters",
      };
    }

    if (error.response?.status === 404) {
      console.error("404: User not found in database");
      return {
        success: false,
        message: "User not found. Please logout and login again to refresh your session.",
      };
    }

    if (error.response?.status === 500) {
      console.error("500: Server error");
      return {
        success: false,
        message: error.response?.data?.message || "Server error. Please try again later.",
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to change password. Please try again.",
    };
  }
};

/**
 * Upload profile picture
 * Tries multiple endpoint variations
 */
export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);

    console.log("🔄 Attempting to upload profile picture...");
    console.log("File name:", file.name);
    console.log("File size:", file.size);
    console.log("File type:", file.type);

    let response;
    let lastError;

    // Try primary endpoint
    try {
      const endpoint = `${API_URL}/user/profile-picture`;
      console.log("Trying endpoint: POST " + endpoint);
      response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("Upload successful at endpoint:", endpoint);
    } catch (error1) {
      lastError = error1;
      console.warn("Primary endpoint failed, trying alternative 1...");
      
      // Try alternative 1
      try {
        const endpoint = `${API_URL}/user/upload-profile-picture`;
        console.log("Trying endpoint: POST " + endpoint);
        response = await apiClient.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log("Upload successful at endpoint:", endpoint);
      } catch (error2) {
        console.warn("Alternative 1 failed, trying alternative 2...");
        
        // Try alternative 2 - using PUT
        try {
          const endpoint = `${API_URL}/user/profile-picture`;
          console.log("Trying endpoint: PUT " + endpoint);
          response = await apiClient.put(endpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          console.log("Upload successful at endpoint:", endpoint);
        } catch (error3) {
          console.error("All upload endpoints failed");
          throw error3;
        }
      }
    }

    console.log("✅ Upload response:", response.data);

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
    console.error("❌ Upload profile picture error:", error.message);
    console.error("Error status:", error.response?.status);
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to upload profile picture",
    };
  }
};

/**
 * Get profile picture
 * GET /api/v1/user/get-profile-picture
 * Returns JSON with profilePicture URL field
 */
export const getProfilePicture = async () => {
  try {
    const endpoint = `${API_URL}/user/get-profile-picture`;
    console.log("🔄 Fetching profile picture from: GET " + endpoint);

    const response = await apiClient.get(endpoint);

    console.log("Get profile picture response:", response.data);

    if (response.data && response.data.profilePicture) {
      const profilePictureUrl = response.data.profilePicture;
      console.log("✅ Profile picture URL received:", profilePictureUrl);
      
      return {
        success: true,
        imageUrl: profilePictureUrl,
      };
    }

    return {
      success: false,
      message: "No profile picture found",
    };
  } catch (error) {
    console.error("Get profile picture error:", error.message);
    
    if (error.response?.status === 404) {
      console.log("No profile picture exists yet");
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
 * Tries multiple endpoint variations
 */
export const removeProfilePicture = async () => {
  try {
    console.log("=== Attempting to remove profile picture ===");

    let response;
    let lastError;
    let endpoint;

    // Try primary endpoint
    try {
      endpoint = `${API_URL}/user/profile-picture`;
      console.log("🔄 Trying endpoint 1: DELETE " + endpoint);
      response = await apiClient.delete(endpoint);
      console.log("✅ Remove successful at endpoint 1:", endpoint);
      console.log("Response data:", response.data);
    } catch (error1) {
      lastError = error1;
      console.warn("❌ Endpoint 1 failed with status:", error1.response?.status);
      
      // Try alternative endpoint
      try {
        endpoint = `${API_URL}/user/remove-profile-picture`;
        console.log("🔄 Trying endpoint 2: DELETE " + endpoint);
        response = await apiClient.delete(endpoint);
        console.log("✅ Remove successful at endpoint 2:", endpoint);
        console.log("Response data:", response.data);
      } catch (error2) {
        lastError = error2;
        console.error("❌ Endpoint 2 also failed with status:", error2.response?.status);
        console.error("All remove endpoints failed");
        throw error2;
      }
    }

    console.log("Final remove profile picture response:", response.data);

    // Handle success response
    if (response.data && response.data.success) {
      console.log("✅ Remove was successful");
      return {
        success: true,
        message: response.data.message || "Profile picture removed successfully",
      };
    }

    return {
      success: response.data?.success || false,
      message: response.data?.message || "Profile picture removed successfully",
    };
  } catch (error) {
    console.error("=== Remove Profile Picture Failed ===");
    console.error("Error message:", error.message);
    console.error("Error status:", error.response?.status);
    
    if (error.response?.status === 404) {
      console.warn("404 - No picture to remove or endpoint not found");
      return {
        success: false,
        message: "No profile picture to remove or endpoint not found",
      };
    }

    if (error.response?.status === 401) {
      console.warn("401 - Unauthorized");
      return {
        success: false,
        message: "Not authenticated. Please login again.",
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to remove profile picture",
    };
  }
};

// ============ ADDRESS BOOK API CALLS ============

/**
 * Get all addresses from backend
 * GET /api/v1/user/addresses (PLURAL - from your routes)
 */
export const getAllAddresses = async () => {
  try {
    const endpoint = `${API_URL}/user/addresses`;
    console.log("🔄 Fetching all addresses from: GET " + endpoint);
    
    const response = await apiClient.get(endpoint);
    
    console.log("✅ Get addresses response:", response.data);

    // Handle different response formats
    if (response.data.success) {
      let addresses = [];

      // Try different response data locations
      if (Array.isArray(response.data.data)) {
        addresses = response.data.data;
      } else if (Array.isArray(response.data.addresses)) {
        addresses = response.data.addresses;
      } else if (Array.isArray(response.data.address)) {
        addresses = response.data.address;
      }

      console.log("✅ Successfully fetched " + addresses.length + " addresses");
      return {
        success: true,
        data: addresses,
      };
    }

    return {
      success: false,
      message: response.data.message || "Failed to load addresses",
      data: [],
    };
  } catch (error) {
    console.error("❌ Get all addresses error:", error.message);
    console.error("Error status:", error.response?.status);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Not authenticated. Please login again.",
        data: [],
      };
    }

    if (error.response?.status === 404) {
      console.log("ℹ️ No addresses found (404) - this is OK");
      return {
        success: true,
        message: "No addresses yet",
        data: [],
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || "Failed to load addresses",
      data: [],
    };
  }
};

/**
 * Add new address to backend
 * POST /api/v1/user/address (SINGULAR - from your routes)
 */
export const addAddress = async (address) => {
  try {
    const endpoint = `${API_URL}/user/address`;
    console.log("🔄 Adding new address to: POST " + endpoint);
    console.log("Address data:", address);

    // Validate required fields
    if (!address.label || !address.street || !address.city) {
      const message = "Please fill in all required fields (label, street, city)";
      console.warn("⚠️ Validation failed:", message);
      return {
        success: false,
        message: message,
      };
    }

    const payload = {
      label: address.label.trim(),
      street: address.street.trim(),
      city: address.city.trim(),
      state: (address.state || "").trim(),
      zip: (address.zip || "").trim(),
      country: address.country || "Sri Lanka",
    };

    console.log("Sending payload:", payload);

    const response = await apiClient.post(endpoint, payload);

    console.log("✅ Add address response:", response.data);

    if (response.data.success) {
      const newAddress = response.data.data || response.data.address || response.data;
      console.log("✅ Address added successfully:", newAddress);
      
      return {
        success: true,
        message: response.data.message || "Address added successfully",
        data: newAddress,
      };
    }

    return {
      success: false,
      message: response.data.message || "Failed to add address",
    };
  } catch (error) {
    console.error("❌ Add address error:", error.message);
    console.error("Error status:", error.response?.status);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Not authenticated. Please login again.",
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid address data",
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to add address",
    };
  }
};

/**
 * Update address in backend
 * PUT /api/v1/user/address/:addressId (SINGULAR - from your routes)
 */
export const updateAddress = async (addressId, address) => {
  try {
    const endpoint = `${API_URL}/user/address/${addressId}`;
    console.log("🔄 Updating address: PUT " + endpoint);
    console.log("Address data:", address);

    // Validate required fields
    if (!address.label || !address.street || !address.city) {
      const message = "Please fill in all required fields (label, street, city)";
      console.warn("⚠️ Validation failed:", message);
      return {
        success: false,
        message: message,
      };
    }

    const payload = {
      label: address.label.trim(),
      street: address.street.trim(),
      city: address.city.trim(),
      state: (address.state || "").trim(),
      zip: (address.zip || "").trim(),
      country: address.country || "Sri Lanka",
    };

    console.log("Sending payload:", payload);

    const response = await apiClient.put(endpoint, payload);

    console.log("✅ Update address response:", response.data);

    if (response.data.success) {
      const updatedAddress = response.data.data || response.data.address || response.data;
      console.log("✅ Address updated successfully:", updatedAddress);
      
      return {
        success: true,
        message: response.data.message || "Address updated successfully",
        data: updatedAddress,
      };
    }

    return {
      success: false,
      message: response.data.message || "Failed to update address",
    };
  } catch (error) {
    console.error("❌ Update address error:", error.message);
    console.error("Error status:", error.response?.status);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Not authenticated. Please login again.",
      };
    }

    if (error.response?.status === 404) {
      return {
        success: false,
        message: "Address not found",
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid address data",
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to update address",
    };
  }
};

/**
 * Delete address from backend
 * DELETE /api/v1/user/address/:addressId (SINGULAR - from your routes)
 */
export const deleteAddress = async (addressId) => {
  try {
    const endpoint = `${API_URL}/user/address/${addressId}`;
    console.log("🔄 Deleting address: DELETE " + endpoint);

    const response = await apiClient.delete(endpoint);

    console.log("✅ Delete address response:", response.data);

    if (response.data.success) {
      console.log("✅ Address deleted successfully");
      return {
        success: true,
        message: response.data.message || "Address deleted successfully",
      };
    }

    return {
      success: false,
      message: response.data.message || "Failed to delete address",
    };
  } catch (error) {
    console.error("❌ Delete address error:", error.message);
    console.error("Error status:", error.response?.status);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Not authenticated. Please login again.",
      };
    }

    if (error.response?.status === 404) {
      return {
        success: false,
        message: "Address not found",
      };
    }

    if (error.response?.status === 403) {
      return {
        success: false,
        message: "You don't have permission to delete this address",
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to delete address",
    };
  }
};

/**
 * Set default address in backend
 * PUT /api/v1/user/address/:addressId with isDefault: true
 */
export const setDefaultAddress = async (addressId) => {
  try {
    const endpoint = `${API_URL}/user/address/${addressId}`;
    console.log("🔄 Setting default address: PUT " + endpoint);

    const response = await apiClient.put(endpoint, {
      isDefault: true
    });

    console.log("✅ Set default address response:", response.data);

    if (response.data.success) {
      const updatedAddress = response.data.data || response.data.address || response.data;
      console.log("✅ Default address set successfully:", updatedAddress);
      
      return {
        success: true,
        message: response.data.message || "Default address updated successfully",
        data: updatedAddress,
      };
    }

    return {
      success: false,
      message: response.data.message || "Failed to set default address",
    };
  } catch (error) {
    console.error("❌ Set default address error:", error.message);
    console.error("Error status:", error.response?.status);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        message: "Not authenticated. Please login again.",
      };
    }

    if (error.response?.status === 404) {
      return {
        success: false,
        message: "Address not found",
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid request",
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to set default address",
    };
  }
};