import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
});

const cartSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        items: [cartItemSchema],
        totalPrice: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    { timestamps: true }
);

// Recalculate total price
cartSchema.methods.calculateTotal = function () {
    this.totalPrice = this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    return this.totalPrice;
};

// Check cart is empty
cartSchema.methods.isEmptyCart = function () {
    return this.items.length === 0;
};

export default mongoose.model("Cart", cartSchema);