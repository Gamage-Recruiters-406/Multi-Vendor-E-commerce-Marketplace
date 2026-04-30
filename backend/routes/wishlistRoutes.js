import express from "express";
import {
    addToWishlist,
    getWishlist,
    removeFromWishlist,
    clearWishlist
} from "../controllers/wishlistController.js";

import { requiredSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Add item
router.post("/add", requiredSignIn, addToWishlist);

// Get wishlist
router.get("/", requiredSignIn, getWishlist);

// Remove item
router.delete("/:product_id", requiredSignIn, removeFromWishlist);

// Clear wishlist
router.delete("/clear", requiredSignIn, clearWishlist);

export default router;