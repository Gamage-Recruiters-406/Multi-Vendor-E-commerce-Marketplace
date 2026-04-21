const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

// ── Helper: attach JWT token to every request ──
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ── Helper: handle response errors ──
const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const getVendorProfile = async () => {
  const res = await fetch(`${BASE_URL}/user/profile`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ✅ orders/vendor/list
export const getVendorOrders = async () => {
  const res = await fetch(`${BASE_URL}/orders/vendor/list`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getOrderById = async (orderId) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getOrderTracking = async (orderId) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/tracking`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await fetch(`${BASE_URL}/orders/vendor/${orderId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

export const getStoreById = async (storeId) => {
  const res = await fetch(`${BASE_URL}/stores/${storeId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const createStore = async (formData) => {
  const res = await fetch(`${BASE_URL}/stores/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      // NOTE: Do NOT set Content-Type here — browser sets it with boundary for FormData
    },
    body: formData,
  });
  return handleResponse(res);
};

export const getProductById = async (productId) => {
  const res = await fetch(`${BASE_URL}/products/${productId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const createProduct = async (formData) => {
  const res = await fetch(`${BASE_URL}/products/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      // NOTE: Do NOT set Content-Type — browser sets it for FormData
    },
    body: formData,
  });
  return handleResponse(res);
};

export const getAllCategories = async () => {
  const res = await fetch(`${BASE_URL}/categories/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getAnnouncementsFeed = async () => {
  const res = await fetch(`${BASE_URL}/announcements/feed`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getProfilePicture = async () => {
  const res = await fetch(`${BASE_URL}/users/get-profile-picture`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

export const getVendorDashboardStats = async () => {
  // REMOVE THIS and uncomment fetch below when backend is ready:
  return {
    totalSales: "$24,580",
    totalOrders: 156,
    monthlyRevenue: "$12,340",
    lowStockAlerts: 8,
  };
};

export const getVendorSalesAnalytics = async (period = "daily") => {
  const mock = {
    daily: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      data: [2000, 1800, 3200, 4800, 3000, 3500, 4200],
    },
    weekly: {
      labels: ["Wk1", "Wk2", "Wk3", "Wk4"],
      data: [12000, 15000, 11000, 18000],
    },
    monthly: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      data: [45000, 52000, 38000, 61000, 55000, 70000],
    },
  };
  return mock[period];
};

export const getVendorProducts = async (storeId) => {
  if (!storeId) return [];

  const res = await fetch(`${BASE_URL}/products/store/${storeId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};
