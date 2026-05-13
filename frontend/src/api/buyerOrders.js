const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const API_VERSION = (import.meta.env.VITE_API_VERSION || '/api/v1').startsWith('/')
  ? (import.meta.env.VITE_API_VERSION || '/api/v1')
  : `/${import.meta.env.VITE_API_VERSION || 'api/v1'}`;

const API_URL = `${API_BASE_URL}${API_VERSION}`;

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Transform backend order data to frontend format
const transformOrder = (backendOrder) => {
  if (!backendOrder) return null;

  // Extract vendor name from the first vendor order
  const vendorName = backendOrder.vendorOrders?.[0]?.vendor?.fullname || 'Unknown Vendor';
  const vendorInitials = vendorName
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'VN';
  
  // Extract items from all vendor orders
  const allItems = backendOrder.vendorOrders?.flatMap(vo => vo.items) || [];
  const primaryItemName = allItems[0]?.productName || 'Order';
  const trackingHistory = backendOrder.vendorOrders
    ?.flatMap((segment) =>
      (segment.trackingHistory || []).map((event) => ({
        ...event,
        vendorName: segment.vendor?.fullname || vendorName,
        vendorOrderId: segment._id || '',
      }))
    )
    .sort((left, right) => new Date(left.changedAt || 0) - new Date(right.changedAt || 0)) || [];

  const summary = backendOrder.priceSummary || {};
  const subtotal = Number(summary.subtotal ?? backendOrder.vendorOrders?.reduce((sum, vo) => sum + (vo.subtotal || 0), 0) ?? 0);
  const discountAmount = Number(summary.discountAmount ?? backendOrder.vendorOrders?.reduce((sum, vo) => sum + (vo.discountAmount || 0), 0) ?? 0);
  const shippingFee = Number(summary.shippingFee ?? backendOrder.vendorOrders?.reduce((sum, vo) => sum + (vo.shippingFee || 0), 0) ?? 0);
  const totalAmount = Number(summary.totalAmount ?? backendOrder.vendorOrders?.reduce((sum, vo) => sum + (vo.totalAmount || 0), 0) ?? 0);
  
  // Format tags from items (show first 2-3 products)
  const tags = allItems.slice(0, 3).map(item => ({
    icon: '📦',
    text: item.productName || 'Product',
  }));

  // Get total price from priceSummary
  const totalPrice = backendOrder.priceSummary?.totalAmount || 
                     backendOrder.vendorOrders?.reduce((sum, vo) => sum + (vo.totalAmount || 0), 0) || 0;

  return {
    id: backendOrder._id || '',
    orderId: backendOrder._id || '',
    orderNumber: backendOrder.orderNumber,
    displayName: primaryItemName,
    status: (backendOrder.overallStatus || 'Placed').toUpperCase(),
    brand: vendorName,
    vendorName,
    date: new Date(backendOrder.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    tags: tags.length > 0 ? tags : [{
      icon: '📦',
      text: `${allItems.length} item${allItems.length !== 1 ? 's' : ''}`,
    }],
    price: parseFloat(totalAmount || totalPrice) || 0,
    initials: vendorInitials,
    orderNumber: backendOrder.orderNumber,
    paymentMethod: backendOrder.payment?.method || 'Card',
    paymentStatus: backendOrder.payment?.status || 'Pending',
    shippingAddress: backendOrder.shippingAddress || {},
    items: allItems.map((item) => ({
      productId: item.productId || '',
      productName: item.productName || 'Product',
      imageUrl: item.imageUrl || '',
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      totalPrice: Number(item.totalPrice) || Number(item.quantity) * Number(item.unitPrice) || 0,
      variant: item.variant || {},
    })),
    trackingHistory,
    subtotal: parseFloat(subtotal) || 0,
    discountAmount: parseFloat(discountAmount) || 0,
    shippingFee: parseFloat(shippingFee) || 0,
    totalAmount: parseFloat(totalAmount) || 0,
  };
};

// Get buyer's orders
export const getBuyerOrders = async () => {
  try {
    const response = await fetch(`${API_URL}/orders/my`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch orders');
    }

    // Backend returns orders in the 'orders' array with pagination
    const orders = Array.isArray(data.orders) ? data.orders : [];
    return orders.map(order => transformOrder(order)).filter(Boolean);
  } catch (error) {
    console.error('Error fetching buyer orders:', error);
    throw error;
  }
};

// Get order details
export const getOrderDetails = async (orderId) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch order details');
    }

    // Backend returns the order in 'order' property
    return transformOrder(data.order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Get order tracking information
export const getOrderTracking = async (orderId) => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}/tracking`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch tracking information');
    }

    // Backend returns tracking in 'tracking' property
    return data.tracking || {};
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    throw error;
  }
};
