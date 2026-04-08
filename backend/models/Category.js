import mongoose from 'mongoose';
import { pluralize } from '../utils/pluralize.js';
import { generateSlug } from '../utils/slugify.js';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            set: (value) => pluralize(value), // Automatically pluralize before saving
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

// Generate slug BEFORE validation
categorySchema.pre('validate', async function (next) {
    if (this.isModified('name') || !this.slug) {
        let baseSlug = generateSlug(this.name);
        let slug = baseSlug;
        let counter = 1;
        while (await mongoose.model('Category').exists({ slug, _id: { $ne: this._id } })) {
            slug = `${baseSlug}-${counter++}`;
        }
        this.slug = slug;
    }
});

// Prevent deletion if category has products or subcategories
categorySchema.methods.hasProductsOrChildren = async function () {
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ category: this._id });
    const childCount = await mongoose.model('Category').countDocuments({ parentCategory: this._id });
    return productCount > 0 || childCount > 0;
};

export default mongoose.model('Category', categorySchema);