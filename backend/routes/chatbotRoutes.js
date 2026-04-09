import express from 'express';
import {
    createProduct,
    getProducts,
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

// ==================== TEMPORARY - Product Management (remove when Product model ready) ====================
// Only Admin can create/manage products
router.post('/products', requiredSignIn, isAdmin, createProduct);
router.get('/products', requiredSignIn, isAdmin, getProducts);

// ==================== CHATBOT ENDPOINTS (With Authentication) ====================

// Get 5 FAQ questions - Anyone can view (no login required)
router.get('/products/:productId/faq', getFAQQuestions);

// Click FAQ button - Anyone can use (no login required)
router.post('/faq/answer', getFAQAnswer);

// Ask AI question - Buyers only (logged in users)
router.post('/chat/ask', requiredSignIn, isBuyer, askAIQuestion);

// Get chat history - Buyers only (see their own history)
router.get('/chat/history/:sessionId', requiredSignIn, isBuyer, getChatHistory);

// Contact vendor - Buyers only
router.post('/chat/contact-vendor', requiredSignIn, isBuyer, contactVendor);

// Send message to vendor - Buyers only
router.post('/chat/vendor-message', requiredSignIn, isBuyer, sendVendorMessage);

// ==================== ADMIN ONLY ====================
// Seed FAQ templates (Admin only - run once)
router.post('/admin/seed-faqs', requiredSignIn, isAdmin, seedFAQs);


// AI-Generated FAQ endpoints (Vendor/Admin only)
router.post('/faq/generate-ai', requiredSignIn, isAdminOrVendor, generateAIFAQ);
router.post('/faq/preview-ai', requiredSignIn, isAdminOrVendor, previewAIFAQ);
router.put('/faq/edit', requiredSignIn, isAdminOrVendor, editProductFAQ);
router.delete('/faq/delete', requiredSignIn, isAdminOrVendor, deleteProductFAQ);
router.post('/faq/reset-default', requiredSignIn, isAdminOrVendor, resetToDefaultFAQ);

export default router;