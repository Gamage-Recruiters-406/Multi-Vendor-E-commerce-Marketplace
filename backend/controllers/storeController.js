import Store from '../models/Store.js';
import { uploadImage } from '../middlewares/imageUploader.js';

export const createStore = async (req, res) => {
    try {
        const { name, description } = req.body;
        const vendorId = req.user._id;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Store name is required' });
        }

        // Check if store name already exists
        const existingStore = await Store.findOne({ name });
        if (existingStore) {
            return res.status(409).json({ success: false, message: 'Store name already taken' });
        }

        let logoUrl = '';
        if (req.file) {
            // Upload to Cloudinary and get public_id
            const publicId = await uploadImage(req.file.buffer, 'marketplace/stores');
            // Construct the full URL
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            logoUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
        }

        const store = await Store.create({
            name,
            description: description || '',
            logo: logoUrl,
            vendor: vendorId,
            status: 'active',
        });

        res.status(201).json({ success: true, data: store });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Store name already exists' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};