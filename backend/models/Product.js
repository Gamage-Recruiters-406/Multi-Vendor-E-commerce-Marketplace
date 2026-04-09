import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
    sku: { type: String, unique: true, sparse: true },
    attributes: {
        size: { type: String, default: '' },
        color: { type: String, default: '' }
    },
    additionalPrice: { type: Number, default: 0 }, // price difference from base price
    stock: { type: Number, required: true, min: 0, default: 0 },
});

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
        },
        images: [{
            type: String,
        }],
        variants: [variantSchema],
        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
    },
    { timestamps: true }
);

// Compound unique index: store + name (product name unique per store)
productSchema.index({ store: 1, name: 1 }, { unique: true });


export default mongoose.model('Product', productSchema);