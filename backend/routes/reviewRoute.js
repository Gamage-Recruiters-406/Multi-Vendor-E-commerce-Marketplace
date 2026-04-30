import express from "express";
import {
    addReview,
    updateReview,
    deleteReview,
    getProductReviews,
    getAverageRating,
    getMyReviews
} from "../controllers/reviewController.js";

import { requiredSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Add review
router.post("/", requiredSignIn, addReview);

// Update review
router.put("/:id", requiredSignIn, updateReview);

// Delete review
router.delete("/:id", requiredSignIn, deleteReview);

// Get reviews by product
router.get("/product/:product_id", getProductReviews);

// Get average rating
router.get("/average/:product_id", getAverageRating);

// Get my reviews for user
router.get("/my", requiredSignIn, getMyReviews);

export default router;