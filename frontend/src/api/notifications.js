const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_VERSION = (import.meta.env.VITE_API_VERSION || '/api/v1').startsWith('/')
  ? (import.meta.env.VITE_API_VERSION || '/api/v1')
  : `/${import.meta.env.VITE_API_VERSION || 'api/v1'}`;
const BASE_URL = `${API_BASE_URL}${API_VERSION}`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const getNotifications = async (page = 1, limit = 20) => {
  const res = await fetch(`${BASE_URL}/notifications?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getUnreadCount = async () => {
  const res = await fetch(`${BASE_URL}/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const markAllAsRead = async () => {
  const res = await fetch(`${BASE_URL}/notifications/mark-all-read`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const markAsRead = async (notificationId) => {
  const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
