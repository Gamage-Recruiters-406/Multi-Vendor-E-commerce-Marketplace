import express from 'express';
import { createProduct } from '../controllers/productController.js';
import { requiredSignIn, isVendor } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/imageUploader.js';

const router = express.Router();

// Create product
router.post('/', requiredSignIn, isVendor, upload.array('images', 5), createProduct);

export default router;