const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

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

export const addToCartApi = async ({ product_id, quantity }) => {
  const res = await fetch(`${BASE_URL}/cart/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ product_id, quantity }),
  });

  return handleResponse(res);
};

export const addToWishlistApi = async (product_id) => {
  const res = await fetch(`${BASE_URL}/wishlist/add`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ product_id }),
  });

  return handleResponse(res);
};
