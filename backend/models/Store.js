import mongoose from 'mongoose';
import { generateSlug } from '../utils/slugify.js';

const storeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
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

// Generate slug from name before validation
storeSchema.pre('validate', async function () {
    if (this.isModified('name') || !this.slug) {
        let baseSlug = generateSlug(this.name);
        let slug = baseSlug;
        let counter = 1;
        while (await mongoose.model('Store').exists({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter++}`;
        }
        this.slug = slug;
    }
});

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