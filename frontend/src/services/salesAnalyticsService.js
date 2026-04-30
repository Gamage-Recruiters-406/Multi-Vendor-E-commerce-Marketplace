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

export const getVendorOrders = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.status) query.set('status', params.status);
  if (params.sort) query.set('sort', params.sort);

  const url = `${API_URL}/orders/vendor/list${query.toString() ? `?${query.toString()}` : ''}`;
  return request(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const getMyStores = async () => {
  return request(`${API_URL}/store/my-stores`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const getProductsByStore = async (storeId) => {
  return request(`${API_URL}/product/store/${storeId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const getAllCategories = async () => {
  return request(`${API_URL}/category`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const getPaidPaymentsForOwner = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const url = `${API_URL}/payments/get-paid-payments-for-owner${query.toString() ? `?${query.toString()}` : ''}`;
  return request(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

export const getAllOrders = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);

  const url = `${API_URL}/orders/admin/list${query.toString() ? `?${query.toString()}` : ''}`;
  return request(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};
