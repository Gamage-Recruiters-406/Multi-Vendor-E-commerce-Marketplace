import mongoose from 'mongoose';

// FAQ Template Schema (Admin predefined templates)
const faqTemplateSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        unique: true,
        enum: ['default', 'electronics', 'clothing', 'furniture', 'beauty', 'books']
    },
    questions: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
        displayOrder: { type: Number, default: 0 },
        clickCount: { type: Number, default: 0 }
    }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Product-specific FAQ Schema (AI-generated or custom)
const productFAQSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true
    },
    customQuestions: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
        displayOrder: { type: Number, default: 0 },
        clickCount: { type: Number, default: 0 }
    }],
    useCustomOnly: { type: Boolean, default: true },
    generatedBy: { type: String, enum: ['ai', 'manual'], default: 'manual' },
    generatedAt: { type: Date }
}, { timestamps: true });

// Chat Session Schema
const chatSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messages: [{
        sender: { type: String, enum: ['user', 'ai', 'vendor'], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        isRead: { type: Boolean, default: false }
    }],
    status: { 
        type: String, 
        enum: ['active', 'transferred_to_vendor', 'closed'],
        default: 'active'
    }
}, { timestamps: true });

export const FAQTemplate = mongoose.model('FAQTemplate', faqTemplateSchema);
export const ProductFAQ = mongoose.model('ProductFAQ', productFAQSchema);
export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
