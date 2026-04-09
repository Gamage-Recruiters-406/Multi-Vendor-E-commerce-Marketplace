import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,  // Add this
    getFAQQuestions,
    getFAQAnswer,
    askAIQuestion,
    getChatHistory,
    contactVendor,
    sendVendorMessage,
    seedFAQs,
    generateAIFAQ,
    previewAIFAQ,
    editProductFAQ,
    deleteProductFAQ,
    resetToDefaultFAQ
} from '../controllers/chatbotController.js';
import { requiredSignIn, isAdmin, isBuyer, isAdminOrVendor } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ==================== PRODUCT MANAGEMENT ====================
router.post('/products', requiredSignIn, isAdmin, createProduct);
router.get('/products', requiredSignIn, isAdmin, getProducts);
router.get('/products/:id', requiredSignIn, isAdmin, getProductById); // Get single product

// ==================== CHATBOT ENDPOINTS ====================

// Get FAQ questions - Anyone can view
router.get('/products/:productId/faq', getFAQQuestions);

// Click FAQ button - Anyone can use
router.post('/faq/answer', getFAQAnswer);

// Ask AI question - Buyers only
router.post('/chat/ask', requiredSignIn, isBuyer, askAIQuestion);

// Get chat history - Buyers only
router.get('/chat/history/:sessionId', requiredSignIn, isBuyer, getChatHistory);

// Contact store/vendor - Buyers only
router.post('/chat/contact-vendor', requiredSignIn, isBuyer, contactVendor);

// Send message to store/vendor - Buyers only
router.post('/chat/vendor-message', requiredSignIn, isBuyer, sendVendorMessage);

// ==================== ADMIN ONLY ====================
router.post('/admin/seed-faqs', requiredSignIn, isAdmin, seedFAQs);

// ==================== VENDOR/ADMIN ENDPOINTS ====================
router.post('/faq/generate-ai', requiredSignIn, isAdminOrVendor, generateAIFAQ);
router.post('/faq/preview-ai', requiredSignIn, isAdminOrVendor, previewAIFAQ);
router.put('/faq/edit', requiredSignIn, isAdminOrVendor, editProductFAQ);
router.delete('/faq/delete', requiredSignIn, isAdminOrVendor, deleteProductFAQ);
router.post('/faq/reset-default', requiredSignIn, isAdminOrVendor, resetToDefaultFAQ);

// ==================== VENDOR ENDPOINTS (Add these) ====================

// Vendor views all their chat sessions
router.get('/vendor/sessions', requiredSignIn, isAdminOrVendor, getVendorSessions);

// Vendor views single session messages
router.get('/vendor/sessions/:sessionId', requiredSignIn, isAdminOrVendor, getVendorSessionMessages);

// Vendor replies to buyer
router.post('/vendor/reply', requiredSignIn, isAdminOrVendor, vendorReplyToBuyer);

// Vendor closes chat session
router.post('/vendor/close-session', requiredSignIn, isAdminOrVendor, closeChatSession);

export default router;