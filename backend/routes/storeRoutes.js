import express from 'express';
import { createStore, deleteStore, getMyStores, getRecentStores, getSingleStore, updateStore } from '../controllers/storeController.js';
import { requiredSignIn, isVendor } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/imageUploader.js';

const router = express.Router();

// Create store
router.post('/', requiredSignIn, isVendor, upload.single('logo'), createStore);

// Get recent stores
router.get('/recent', getRecentStores);

// Get vendor's stores
router.get('/my-stores', requiredSignIn, isVendor, getMyStores);

// Get single store
router.get('/:id', getSingleStore);

// Update store
router.put('/:id', requiredSignIn, isVendor, upload.single('logo'), updateStore);

// Delete store
router.delete('/:id', requiredSignIn, isVendor, deleteStore);

export default router;