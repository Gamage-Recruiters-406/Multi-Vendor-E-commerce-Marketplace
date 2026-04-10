import express from 'express';
import { createCategory, getAllCategories } from '../controllers/categoryController.js';
import { requiredSignIn, isAdminOrVendor } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create category
router.post('/', requiredSignIn, isAdminOrVendor, createCategory);

// Get all categories
router.get("/", getAllCategories);

export default router;