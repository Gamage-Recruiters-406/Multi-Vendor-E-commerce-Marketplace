// ============================================================
// src/api/vendorDashboard.js
// ============================================================
// All API calls for the Vendor Dashboard in one place.
// Base URL comes from .env → VITE_API_BASE_URL
//
// HOW TO USE:
//   import { getVendorOrders, getVendorProfile } from "../api/vendorDashboard";
//
// HOW TO ADD AUTH TOKEN:
//   Store your JWT in localStorage after login:
//     localStorage.setItem("token", response.token)
//   This file reads it automatically via getAuthHeaders()
// ============================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

// ============================================================
// ✅ CONNECTED — GET /api/users/profile
// Returns: { user: { name, email, role, profilePicture, phone } }
// Used in: Sidebar profile section, top greeting
// ============================================================
export const getVendorProfile = async () => {
  const res = await fetch(`${BASE_URL}/users/profile`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — GET /api/orders/vendor/list
// Returns: { orders: [{ _id, orderItems, buyer, status, totalAmount, createdAt }] }
// Used in: Recent Orders table, Orders page
// ============================================================
export const getVendorOrders = async () => {
  const res = await fetch(`${BASE_URL}/orders/vendor/list`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — GET /api/orders/:orderId
// Returns: { order: { _id, orderItems, buyer, status, totalAmount, ... } }
// Used in: Order detail modal/page
// ============================================================
export const getOrderById = async (orderId) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — GET /api/orders/:orderId/tracking
// Returns: { tracking: { status, history: [...] } }
// Used in: Order tracking timeline
// ============================================================
export const getOrderTracking = async (orderId) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/tracking`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — PATCH /api/orders/vendor/:orderId/status
// Body: { status: "Confirmed" | "Shipped" | "Delivered" }
// Returns: { order: { _id, status, ... } }
// Used in: Order management — update status button
// ============================================================
export const updateOrderStatus = async (orderId, status) => {
  const res = await fetch(`${BASE_URL}/orders/vendor/${orderId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — GET /api/stores/:id
// Returns: { store: { _id, storeName, logo, description, vendor } }
// Used in: My Store quick card, Store settings page
// ============================================================
export const getStoreById = async (storeId) => {
  const res = await fetch(`${BASE_URL}/stores/${storeId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — POST /api/stores/
// Body: FormData { storeName, description, logo (file) }
// Returns: { store: { _id, storeName, logo, ... } }
// Used in: Create store form
// ============================================================
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

// ============================================================
// ✅ CONNECTED — GET /api/products/:id
// Returns: { product: { _id, title, price, stock, images, variants, category } }
// Used in: Product detail view
// ============================================================
export const getProductById = async (productId) => {
  const res = await fetch(`${BASE_URL}/products/${productId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — POST /api/products/
// Body: FormData { title, description, price, stock, category, variants, images[] }
// Returns: { product: { _id, title, price, ... } }
// Used in: Add New Product button / form
// ============================================================
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

// ============================================================
// ✅ CONNECTED — GET /api/categories/
// Returns: [{ _id, name }]
// Used in: Product form category dropdown
// ============================================================
export const getAllCategories = async () => {
  const res = await fetch(`${BASE_URL}/categories/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — GET /api/announcements/feed
// Returns: { announcements: [{ _id, title, message, type, createdAt }] }
// Used in: Notifications panel, notification bell
// ============================================================
export const getAnnouncementsFeed = async () => {
  const res = await fetch(`${BASE_URL}/announcements/feed`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// ✅ CONNECTED — GET /api/users/get-profile-picture
// Returns: { profilePicture: "url string" }
// Used in: Sidebar avatar image
// ============================================================
export const getProfilePicture = async () => {
  const res = await fetch(`${BASE_URL}/users/get-profile-picture`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
};

// ============================================================
// 🟡 DUMMY — No backend route yet
// Needed: GET /api/vendor/dashboard/stats
// Should return: { totalSales, totalOrders, monthlyRevenue, lowStockCount }
// Used in: Stat cards at top of dashboard
// TODO: Ask backend team to create this endpoint
// ============================================================
export const getVendorDashboardStats = async () => {
  // REMOVE THIS and uncomment fetch below when backend is ready:
  return {
    totalSales: "$24,580",
    totalOrders: 156,
    monthlyRevenue: "$12,340",
    lowStockAlerts: 8,
  };

  // UNCOMMENT when /api/vendor/dashboard/stats is ready:
  // const res = await fetch(`${BASE_URL}/vendor/dashboard/stats`, {
  //   headers: getAuthHeaders(),
  // });
  // return handleResponse(res);
};

// ============================================================
// 🟡 DUMMY — No backend route yet
// Needed: GET /api/vendor/analytics/sales?period=daily|weekly|monthly
// Should return: { labels: [...], data: [...] }
// Used in: Sales Overview chart
// TODO: Ask backend team to create this endpoint
// ============================================================
export const getVendorSalesAnalytics = async (period = "daily") => {
  // REMOVE THIS and uncomment fetch below when backend is ready:
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

  // UNCOMMENT when /api/vendor/analytics/sales is ready:
  // const res = await fetch(`${BASE_URL}/vendor/analytics/sales?period=${period}`, {
  //   headers: getAuthHeaders(),
  // });
  // return handleResponse(res);
};

// ============================================================
// 🟡 DUMMY — No backend route yet
// Needed: GET /api/vendor/products/list
// Should return: { products: [{ _id, title, price, stock, sold, images }] }
// Used in: Top Selling Products, Product management table
// NOTE: getSingleProduct exists but no list endpoint for vendor yet
// TODO: Ask backend team to add vendor product list route
// ============================================================
export const getVendorProducts = async () => {
  // REMOVE THIS and uncomment fetch below when backend is ready:
  return {
    products: [
      {
        id: "P001",
        name: "Wireless Headphones",
        stock: 45,
        price: 89.99,
        status: "active",
        sold: 45,
        img: "🎧",
      },
      {
        id: "P002",
        name: "Smart Watch",
        stock: 3,
        price: 199.99,
        status: "low",
        sold: 32,
        img: "⌚",
      },
      {
        id: "P003",
        name: "Phone Case",
        stock: 0,
        price: 24.99,
        status: "out",
        sold: 28,
        img: "📱",
      },
    ],
  };

  // UNCOMMENT when /api/vendor/products/list is ready:
  // const res = await fetch(`${BASE_URL}/vendor/products/list`, {
  //   headers: getAuthHeaders(),
  // });
  // return handleResponse(res);
};
