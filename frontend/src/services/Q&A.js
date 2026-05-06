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

// Get FAQ questions for a product
export const getFAQQuestionsApi = async (productId) => {
  const res = await fetch(`${BASE_URL}/chatbot/products/${productId}/faq`);
  return handleResponse(res);
};

// Get answer for a clicked FAQ button
export const getFAQAnswerApi = async ({ questionId, productId }) => {
  const res = await fetch(`${BASE_URL}/chatbot/faq/answer`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ questionId, productId }),
  });

  return handleResponse(res);
};

// Ask AI a custom question
export const askAIQuestionApi = async ({ productId, message, sessionId }) => {
  const res = await fetch(`${BASE_URL}/chatbot/chat/ask`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, message, sessionId }),
  });

  return handleResponse(res);
};

// Get chat history
export const getChatHistoryApi = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/chatbot/chat/history/${sessionId}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse(res);
};

// Contact vendor
export const contactVendorApi = async ({ productId, sessionId }) => {
  const res = await fetch(`${BASE_URL}/chatbot/chat/contact-vendor`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, sessionId }),
  });

  return handleResponse(res);
};

// Send message to vendor
export const sendVendorMessageApi = async ({ sessionId, message }) => {
  const res = await fetch(`${BASE_URL}/chatbot/chat/vendor-message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId, message }),
  });

  return handleResponse(res);
};
