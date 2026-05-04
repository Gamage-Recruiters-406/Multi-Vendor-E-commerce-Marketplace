const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP error ${res.status}`);
  }

  return data;
};

export const getFAQQuestionsApi = async (productId) => {
  const res = await fetch(`${BASE_URL}/chatbot/products/${productId}/faq`);
  return handleResponse(res);
};

export const askAIQuestionApi = async ({ productId, message, sessionId }) => {
  const res = await fetch(`${BASE_URL}/chatbot/chat/ask`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, message, sessionId }),
  });

  return handleResponse(res);
};

export const contactVendorApi = async ({ productId, sessionId }) => {
  const res = await fetch(`${BASE_URL}/chatbot/chat/contact-vendor`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, sessionId }),
  });

  return handleResponse(res);
};

export const sendVendorMessageApi = async ({ sessionId, message }) => {
  const res = await fetch(`${BASE_URL}/chatbot/chat/vendor-message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId, message }),
  });

  return handleResponse(res);
};
