import express from 'express';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '../controllers/categoryController.js';
import { requiredSignIn, isAdminOrVendor, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create category
router.post('/', requiredSignIn, isAdminOrVendor, createCategory);

// Get all categories
router.get("/", getAllCategories);

// update category
router.put("/:id", requiredSignIn, isAdmin, updateCategory);

// Delete category
router.delete("/:id", requiredSignIn, isAdmin, deleteCategory);

export default router;