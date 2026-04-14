import express from 'express';
import { createProduct, deleteProduct, getAllProducts, getProductsByCategory, getProductsByStore, getSingleProduct } from '../controllers/productController.js';
import { requiredSignIn, isVendor } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/imageUploader.js';

const router = express.Router();

// Create product
router.post('/', requiredSignIn, isVendor, upload.array('images', 5), createProduct);

// Get all products
router.get('/', getAllProducts);

// Get products by store
router.get('/store/:storeId', getProductsByStore);

// Get products by category
router.get('/category/:categoryId', getProductsByCategory);

// Get Single product
router.get("/:id", getSingleProduct);

// Delete product
router.delete("/:id", requiredSignIn, isVendor, deleteProduct);

export default router;