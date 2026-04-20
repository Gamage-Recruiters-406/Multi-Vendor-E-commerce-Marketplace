const normalizeUrlPart = (value = '') => value.replace(/\/\/+$/, '');
const ensureLeadingSlash = (value = '') => value.startsWith('/') ? value : `/${value}`;

const API_BASE_URL = normalizeUrlPart(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const API_VERSION = ensureLeadingSlash(import.meta.env.VITE_API_VERSION || '/api/v1');
const API_URL = `${API_BASE_URL}${API_VERSION}`;

console.log('🔗 Auth API URL:', API_URL);

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

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

const request = async (url, options) => {
  const response = await fetch(url, options);
  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return data;
};

// Login
export const loginUser = async (credentials) => {
  try {
    const data = await request(`${API_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include',
    });

    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

export const signIn = async (email, password) => {
  return loginUser({ email, password });
};

// Registration
export const registerUser = async (userData) => {
  try {
    return await request(`${API_URL}/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
};

export const signUp = async (userData) => {
  return registerUser(userData);
};

// Logout
export const logoutUser = async () => {
  try {
    const data = await request(`${API_URL}/user/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberEmail');

    return data;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberEmail');
    throw new Error(error.message || 'Logout failed');
  }
};

export const signOut = logoutUser;

// Password Management
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

// Get User Profile
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

// Update User Profile
export const updateUserProfile = async (profileData) => {
  try {
    const data = await request(`${API_URL}/user/update-profile`, {
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

// Get Current User
/*export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const rememberEmail = (email) => {
  if (email) {
    localStorage.setItem('rememberEmail', email);
  } else {
    localStorage.removeItem('rememberEmail');
  }
};

export const getRememberedEmail = () => {
  return localStorage.getItem('rememberEmail');
};*/