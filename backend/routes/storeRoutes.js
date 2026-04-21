import express from 'express';
import { createStore, getSingleStore, getStoresByVendor } from '../controllers/storeController.js';
import { requiredSignIn, isVendor } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/imageUploader.js';

const router = express.Router();

// Create store
router.post('/', requiredSignIn, isVendor, upload.single('logo'), createStore);

// Get vendor stores
router.get('/', requiredSignIn, isVendor, getStoresByVendor);

// Get single store
router.get('/:id', getSingleStore);

export default router;