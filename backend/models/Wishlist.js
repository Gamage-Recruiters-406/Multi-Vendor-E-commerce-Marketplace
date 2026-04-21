import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
});

const wishlistSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // one wishlist per user
        },
        items: [wishlistItemSchema],
    },
    { timestamps: true }
);

// Check empty wishlist
wishlistSchema.methods.isEmptyWishlist = function () {
    return this.items.length === 0;
};

export default mongoose.model("Wishlist", wishlistSchema);