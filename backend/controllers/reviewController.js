const Review = require("../models/Review");
const mongoose = require("mongoose");


// Add Review
exports.addReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user.id;

    if (!product_id || !rating) {
      return res.status(400).json({ message: "Product and rating required" });
    }

    // Check already reviewed
    const existingReview = await Review.findOne({ user_id, product_id });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }

    const review = new Review({
      user_id,
      product_id,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({
      message: "Review added successfully",
      review,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Update Review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Only owner can update
    if (review.user_id.toString() !== user_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();

    res.json({
      message: "Review updated",
      review,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Delete Review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Only owner can delete
    if (review.user_id.toString() !== user_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await review.deleteOne();

    res.json({
      message: "Review deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get Reviews by Product
exports.getProductReviews = async (req, res) => {
  try {
    const { product_id } = req.params;

    const reviews = await Review.find({ product_id })
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get Average Rating
exports.getAverageRating = async (req, res) => {
  try {
    const { product_id } = req.params;

    const result = await Review.aggregate([
      {
        $match: {
          product_id: new mongoose.Types.ObjectId(product_id),
        },
      },
      {
        $group: {
          _id: "$product_id",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return res.json({
        avgRating: 0,
        totalReviews: 0,
      });
    }

    res.json({
      avgRating: result[0].avgRating,
      totalReviews: result[0].totalReviews,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get My Reviews
exports.getMyReviews = async (req, res) => {
  try {
    const user_id = req.user.id;

    const reviews = await Review.find({ user_id })
      .populate("product_id", "name price")
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};