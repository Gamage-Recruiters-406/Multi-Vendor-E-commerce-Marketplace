import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Optional: prevent duplicate review per user per product
reviewSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

// Helper method: check if high rating
reviewSchema.methods.isPositive = function () {
  return this.rating >= 4;
};

export default mongoose.model("Review", reviewSchema);