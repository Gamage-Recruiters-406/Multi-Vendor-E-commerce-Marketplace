import express from 'express';
import { createStore, getRecentStores, getSingleStore, updateStore } from '../controllers/storeController.js';
import { requiredSignIn, isVendor } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/imageUploader.js';

const router = express.Router();

// Create store
router.post('/', requiredSignIn, isVendor, upload.single('logo'), createStore);

// Get recent stores
router.get('/recent', getRecentStores);

// Get single store
router.get('/:id', getSingleStore);

// Update store
router.put('/:id', requiredSignIn, isVendor, upload.single('logo'), updateStore);

export default router;