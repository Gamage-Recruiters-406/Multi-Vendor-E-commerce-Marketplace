const normalizeUrlPart = (value = '') => value.replace(/\/\/+$/, '');
const ensureLeadingSlash = (value = '') => value.startsWith('/') ? value : `/${value}`;

const API_BASE_URL = normalizeUrlPart(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
const API_VERSION = ensureLeadingSlash(import.meta.env.VITE_API_VERSION || '/api/v1');
const API_URL = `${API_BASE_URL}${API_VERSION}`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
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

/** Get all users for admin */
export const getAllUsers = async () => {
  return await request(`${API_URL}/user/users`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

/** Get all orders for admin */
export const getAllOrders = async () => {
  return await request(`${API_URL}/orders/admin/list`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

/** Get all products */
export const getAllProducts = async () => {
  return await request(`${API_URL}/product/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};
