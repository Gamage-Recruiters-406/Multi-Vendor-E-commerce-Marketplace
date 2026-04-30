import mongoose from "mongoose";

const storePaymentSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true
    },
    amount: {
        type: Number,
        min: 0,
        required: true
    },
    platformFee: {
        type: Number,
        min: 0,
        required: true
    },
    netAmount: {         // amount after platform fee deducted
        type: Number,
        min: 0,
        required: true
    }
});

const paymentSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    storePayments: [storePaymentSchema],
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
        required: true
    },
    amount:{
        amount:{
            type: Number,
            min: 0,
            required: true
        },
        platformFee:{
            type: Number,
            min: 0,
            required: true
        },
        currency:{
            type: String,
            required: true,
            uppercase : true
        },
        paymentMethod:{
            type: String,
            required: true,
        }
    },
    paymentDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true,
        lowercase: true,
        enum: ["paid", "pending"],
        default: "pending"
    },
    stripePaymentIntentId:{
        type: String
    }

},{timestamps: true});

export default mongoose.model("Payment",paymentSchema);