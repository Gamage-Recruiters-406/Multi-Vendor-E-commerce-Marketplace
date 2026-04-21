import Store from '../models/Store.js';
import { uploadImage } from '../middlewares/imageUploader.js';
import { v2 as cloudinary } from 'cloudinary';

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
            logoUrl = await uploadImage(req.file.buffer, 'marketplace/stores');
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
}



// Get Single Store
export const getSingleStore = async (req, res) => {
    try {
        const { id } = req.params;

        const store = await Store.findById(id)
            .populate('vendor', 'name email');

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        res.status(200).json({
            success: true,
            data: store
        });

    } catch (error) {
        console.error(error);
        
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}



// Get Recent Stores
export const getRecentStores = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        
        const recentStores = await Store.find({ status: 'active' })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('vendor', 'name email');

        res.status(200).json({
            success: true,
            count: recentStores.length,
            data: recentStores
        });

    } catch (error) {
        console.error('Error in getRecentStores:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
}



// Update Store
export const updateStore = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        const store = await Store.findById(id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        // 🔐 Ownership check
        if (String(store.vendor) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this store"
            });
        }

        // 🔤 Name formatting + uniqueness
        let finalName = store.name;

        if (name && name.trim()) {
            finalName = formatName(name);

            const existingStore = await Store.findOne({
                _id: { $ne: id },
                name: { $regex: `^${finalName}$`, $options: "i" }
            });

            if (existingStore) {
                return res.status(409).json({
                    success: false,
                    message: "Store already exists"
                });
            }
        }

        // 🖼️ Handle logo update
        let logoUrl = store.logo;

        if (req.file) {
            // 🔥 DELETE OLD IMAGE (CORRECT WAY)
            if (store.logo) {
                try {
                    const url = store.logo;

                    // Extract public_id safely
                    const afterUpload = url.split("/upload/")[1];
                    const parts = afterUpload.split("/");
                    const publicPath = parts.slice(1).join("/"); // remove version
                    const publicId = publicPath.split(".")[0];

                    // Delete with cache invalidation
                    await cloudinary.uploader.destroy(publicId, {
                        invalidate: true
                    });

                    console.log("Deleted old image:", publicId);

                } catch (err) {
                    console.error("Error deleting old logo:", err.message);
                }
            }

            // 🔥 Upload new image (same as createStore)
            logoUrl = await uploadImage(req.file.buffer, "marketplace/stores");
        }

        // 🔥 Update fields safely
        store.name = finalName;
        store.description = description ?? store.description;
        store.status = status ?? store.status;
        store.logo = logoUrl;

        await store.save();

        res.status(200).json({
            success: true,
            data: store
        });

    } catch (error) {
        console.error("UPDATE STORE ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};