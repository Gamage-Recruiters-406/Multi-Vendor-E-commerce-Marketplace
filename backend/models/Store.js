import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        logo: {
            type: String,
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
    },
    { timestamps: true }
);

// Virtual for product count (will be populated later)
storeSchema.virtual('productCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'store',
    count: true,
});

// Virtual for order count & revenue – to be implemented after Order module
// For now, we'll add methods to calculate from other services

export default mongoose.model('Store', storeSchema);