import Product from "../models/Product.js";
import Store from "../models/Store.js";
import Category from "../models/Category.js";
import { uploadImage } from "../middlewares/imageUploader.js";

// Capitalize each word
function formatName(name) {
    return name
        .trim()
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// Create Product
export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, store, stock } = req.body;

        // Basic validation
        if(!name || !price || !category || !store) {
            return res.status(400).json({
                success: false,
                message: "Name, price, category, and store are required"
            });
        }

        // Format product name
        const finalName = formatName(name);

        // Check store exist
        const storeDoc = await Store.findById(store);
        if (!storeDoc) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        // Duplicate check
        const existing = await Product.findOne({
            store,
            name: { $regex: `^${finalName}$`, $options: "i" }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Product with the same name already exists in this store"
            });
        }

        // Parse Attributes
        let parsedAttributes = [];

        if (req.body.attributes) {
            parsedAttributes = typeof req.body.attributes === "string"
                ? JSON.parse(req.body.attributes)
                : req.body.attributes;
        }

        // multiple image upload
        let imageUrls = [];

        if (req.files && req.files.length > 0) {
            imageUrls = await Promise.all(
                req.files.map(file =>
                    uploadImage(file.buffer, "marketplace/products")
                )
            );
        }

        const product = await Product.create({
            name: finalName,
            description: description || '',
            price,
            category,
            store,
            stock: stock || 0,
            attributes: parsedAttributes,
            images: imageUrls
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error(error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Product with the same name already exists in this store"
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



// Get Single Product
export const getSingleProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id)
        .populate("store", "name logo")
        .populate("category", "name");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        console.error(error);
        
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}



// Get All Products
export const getAllProducts = async (req, res) => {
    try {
        const { keyword, category, store } = req.query;

        let query = {};

        // Search
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: "i" } },
                { description: { $regex: keyword, $options: "i" } }
            ];
        }

        // Store filter
        if (store) {
            query.store = store;
        }

        // Category filter
        if (category) {
            // get all categories
            const categories = await Category.find({}).lean();

            // recursive function
            const getAllChildIds = (parentId) => {
                let ids = [parentId];

                categories.forEach(cat => {
                    if (cat.parent && cat.parent.toString() === parentId.toString()) {
                        ids = ids.concat(getAllChildIds(cat._id));
                    }
                });

                return ids;
            };

            const categoryIds = getAllChildIds(category);

            query.category = { $in: categoryIds };
        }

        const products = await Product.find(query)
        .populate("store", "name logo")
        .populate("category", "name")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};