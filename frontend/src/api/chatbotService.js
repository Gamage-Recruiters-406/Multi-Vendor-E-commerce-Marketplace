const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/chatbot`;

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ==============================
// Vendor Sessions
// ==============================

// Get all vendor chat sessions
export const getVendorSessions = async () => {
  const res = await fetch(`${BASE_URL}/vendor/sessions`, {
    headers: getAuthHeaders(),
  });

  return res.json();
};

// Get single session messages
export const getVendorSessionMessages = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/vendor/sessions/${sessionId}`, {
    headers: getAuthHeaders(),
  });

  return res.json();
};

// Vendor reply to buyer
export const vendorReplyToBuyer = async (data) => {
  const res = await fetch(`${BASE_URL}/vendor/reply`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

// Close session
export const closeChatSession = async (data) => {
  const res = await fetch(`${BASE_URL}/vendor/close-session`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

// ==============================
// Buyer Chat APIs
// ==============================

// Ask AI
export const askAIQuestion = async (data) => {
  const res = await fetch(`${BASE_URL}/chat/ask`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

// Contact Vendor
export const contactVendor = async (data) => {
  const res = await fetch(`${BASE_URL}/chat/contact-vendor`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

// Send message to vendor
export const sendVendorMessage = async (data) => {
  const res = await fetch(`${BASE_URL}/chat/vendor-message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return res.json();
};

// Get buyer chat history
export const getChatHistory = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/chat/history/${sessionId}`, {
    headers: getAuthHeaders(),
  });

  return res.json();
};
