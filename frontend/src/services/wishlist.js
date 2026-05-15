const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_VERSION = (import.meta.env.VITE_API_VERSION || '/api/v1').startsWith('/')
  ? (import.meta.env.VITE_API_VERSION || '/api/v1')
  : `/${import.meta.env.VITE_API_VERSION || 'api/v1'}`;

const API_URL = `${API_BASE_URL}${API_VERSION}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Get wishlist
export const getWishlist = async () => {
  const response = await fetch(`${API_URL}/wishlist`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch wishlist');
  }
  return data;
};

// Add to wishlist
export const addToWishlist = async (product_id) => {
  const response = await fetch(`${API_URL}/wishlist/add`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ product_id }),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to add to wishlist');
  }
  return data;
};

// Remove from wishlist
export const removeFromWishlist = async (product_id) => {
  const response = await fetch(`${API_URL}/wishlist/${product_id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to remove from wishlist');
  }
  return data;
};

// Clear wishlist
export const clearWishlist = async () => {
  const response = await fetch(`${API_URL}/wishlist/clear`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to clear wishlist');
  }
  return data;
};
