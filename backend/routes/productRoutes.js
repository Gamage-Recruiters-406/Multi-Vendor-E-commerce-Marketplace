import express from 'express';
import { createProduct, getAllProducts, getSingleProduct } from '../controllers/productController.js';
import { requiredSignIn, isVendor } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/imageUploader.js';

const router = express.Router();

// Create product
router.post('/', requiredSignIn, isVendor, upload.array('images', 5), createProduct);

// Get all products
router.get('/', getAllProducts);

// Get Single product
router.get("/:id", getSingleProduct);

export default router;