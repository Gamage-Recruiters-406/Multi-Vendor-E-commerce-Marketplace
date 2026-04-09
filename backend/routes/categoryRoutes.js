import express from 'express';
import { createCategory } from '../controllers/categoryController.js';
import { requiredSignIn, isAdminOrVendor } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create category
router.post('/', requiredSignIn, isAdminOrVendor, createCategory);

export default router;