import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    values: [
        {
            type: String,
            trim: true,
        }
    ]
}, { _id: false });

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
        attributes: [attributeSchema],
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

productSchema.index(
    { store: 1, name: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
);


export default mongoose.model('Product', productSchema);