import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// Add to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { product_id } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        const product = await Product.findById(product_id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        let wishlist = await Wishlist.findOne({ user_id });

        // create wishlist if not exists
        if (!wishlist) {
            wishlist = await Wishlist.create({
                user_id,
                items: []
            });
        }

        // check existing item
        const exists = wishlist.items.find(
            item => String(item.product_id) === String(product_id)
        );

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Already in wishlist"
            });
        }

        wishlist.items.push({ product_id });

        await wishlist.save();

        res.status(200).json({
            success: true,
            message: "Added to wishlist",
            data: wishlist
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get wishlist
export const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user_id: req.user._id })
            .populate("items.product_id")
            .lean();

        if (!wishlist) {
            return res.status(200).json({
                success: true,
                data: {
                    items: []
                }
            });
        }

        res.status(200).json({
            success: true,
            data: wishlist
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { product_id } = req.params;

        const wishlist = await Wishlist.findOne({ user_id });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: "Wishlist not found"
            });
        }

        wishlist.items = wishlist.items.filter(
            item => String(item.product_id) !== String(product_id)
        );

        await wishlist.save();

        res.status(200).json({
            success: true,
            message: "Removed from wishlist",
            data: wishlist
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Clear wishlist
export const clearWishlist = async (req, res) => {
    try {
        await Wishlist.findOneAndDelete({ user_id: req.user._id });

        res.status(200).json({
            success: true,
            message: "Wishlist cleared"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};