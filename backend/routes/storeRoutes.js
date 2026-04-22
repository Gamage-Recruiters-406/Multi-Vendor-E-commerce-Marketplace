import express from 'express';
import { createStore, getRecentStores, getSingleStore } from '../controllers/storeController.js';
import { requiredSignIn, isVendor } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/imageUploader.js';

const router = express.Router();

// Create store
router.post('/', requiredSignIn, isVendor, upload.single('logo'), createStore);

// Get recent stores
router.get('/recent', getRecentStores);

// Get single store
router.get('/:id', getSingleStore);


export default router;