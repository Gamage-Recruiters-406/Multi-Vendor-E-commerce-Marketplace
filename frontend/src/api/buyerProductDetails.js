const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

const handleResponse = async (res) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const getProductDetails = async (productId) => {
  const res = await fetch(`${BASE_URL}/product/${productId}`);
  return handleResponse(res);
};

export const getProductReviews = async (productId) => {
  const res = await fetch(`${BASE_URL}/review/product/${productId}`);
  return handleResponse(res);
};

export const getProductAverageRating = async (productId) => {
  const res = await fetch(`${BASE_URL}/review/average/${productId}`);
  return handleResponse(res);
};
