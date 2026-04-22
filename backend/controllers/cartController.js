import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { product_id, quantity } = req.body;

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

        let cart = await Cart.findOne({ user_id });

        // Create cart if not exists
        if (!cart) {
            cart = await Cart.create({
                user_id,
                items: [],
                totalPrice: 0
            });
        }

        // Check existing item
        const existingItem = cart.items.find(
            item => String(item.product_id) === String(product_id)
        );

        if (existingItem) {
            existingItem.quantity += quantity || 1;
        } else {
            cart.items.push({
                product_id,
                quantity: quantity || 1,
                price: product.price
            });
        }

        // Recalculate total
        cart.totalPrice = cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Added to cart",
            data: cart
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get cart
export const getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user_id: req.user._id })
            .populate("items.product_id")
            .lean();

        if (!cart) {
            return res.status(200).json({
                success: true,
                data: {
                    items: [],
                    totalPrice: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            data: cart
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const user_id = req.user._id;
        const { product_id } = req.params;

        const cart = await Cart.findOne({ user_id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = cart.items.filter(
            item => String(item.product_id) !== String(product_id)
        );

        cart.totalPrice = cart.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Item removed",
            data: cart
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ user_id: req.user._id });

        res.status(200).json({
            success: true,
            message: "Cart cleared"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};