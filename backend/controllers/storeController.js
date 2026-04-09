import Store from '../models/Store.js';
import { uploadImage } from '../middlewares/imageUploader.js';

// Capitalize each word
function formatName(name) {
    return name
        .trim()
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// Create Store
export const createStore = async (req, res) => {
    try {
        const { name, description } = req.body;
        const vendorId = req.user._id;

       if (!name || !name.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Store name is required' 
            });
       }

       // Step 1: format
       const finalName = formatName(name);

       // Step 2: case-insensitive check
       const existingStore = await Store.findOne({
            name: { $regex: `^${finalName}$`, $options: "i" }
       });

       if (existingStore) {
            return res.status(409).json({ 
                success: false, 
                message: 'Store already exists' 
            });
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
            name: finalName,
            description: description || '',
            logo: logoUrl,
            vendor: vendorId,
            status: 'active',
        });

        res.status(201).json({ 
            success: true, 
            data: store 
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};