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

/**
 * Fetch all stores belonging to the logged-in vendor.
 */
export const getMyStores = async () => {
  return request(`${API_URL}/store/my-stores`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

/**
 * Fetch products for a specific store (used to build product→category map).
 */
export const getProductsByStore = async (storeId) => {
  return request(`${API_URL}/product/store/${storeId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

/**
 * Fetch paid payments for a specific store owned by the logged-in vendor.
 *
 * Sends `store_id` as a URL query parameter — this is the standard approach
 * for GET requests and matches the updated backend that reads:
 *   const store_id = req.query.store_id || req.body?.store_id;
 */
export const getPaidPaymentsForStore = async (storeId, params = {}) => {
  const query = new URLSearchParams();
  query.set('store_id', storeId);                    // primary param
  if (params.page)      query.set('page',      params.page);
  if (params.limit)     query.set('limit',      params.limit);
  if (params.startDate) query.set('startDate',  params.startDate);
  if (params.endDate)   query.set('endDate',    params.endDate);

  const url = `${API_URL}/payment/get-paid-payments-for-owner?${query.toString()}`;

  return request(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
};

