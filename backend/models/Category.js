import mongoose from 'mongoose';
import { toPlural } from '../utils/pluralize.js';

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            set: (value) => toPlural(value), // Automatically pluralize before saving
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

categorySchema.methods.hasProductsOrChildren = async function () {
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ category: this._id });
    const childCount = await mongoose.model('Category').countDocuments({ parentCategory: this._id });
    return productCount > 0 || childCount > 0;
};

export default mongoose.model('Category', categorySchema);