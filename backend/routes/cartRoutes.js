import express from "express";
import {
    addToCart,
    getCart,
    removeFromCart,
    clearCart
} from "../controllers/cartController.js";

import { requiredSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Add item to cart
router.post("/add", requiredSignIn, addToCart);

// Get logged user cart
router.get("/", requiredSignIn, getCart);

// Remove single item from cart
router.delete("/:product_id", requiredSignIn, removeFromCart);

// Clear full cart
router.delete("/", requiredSignIn, clearCart);

export default router;