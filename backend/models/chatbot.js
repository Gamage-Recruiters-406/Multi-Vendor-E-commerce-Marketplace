import mongoose from 'mongoose';

// FAQ Template - stores 5 questions per product category (FALLBACK)
const faqTemplateSchema = new mongoose.Schema({
    category: { 
        type: String, 
        required: true, 
        unique: true,
        enum: ['electronics', 'clothing', 'furniture', 'beauty', 'books', 'default']
    },
    questions: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
        displayOrder: { type: Number, default: 0 },
        clickCount: { type: Number, default: 0 }
    }]
}, { timestamps: true });

// Product FAQ - stores AI-generated or vendor-customized questions for specific products
const productFAQSchema = new mongoose.Schema({
    productId: { 
        type: String,  // Using String for now (TempProduct), change to ObjectId when Product model ready
        required: true, 
        unique: true 
    },
    customQuestions: [{
        question: { type: String, required: true },
        answer: { type: String, required: true },
        displayOrder: { type: Number, default: 0 },
        clickCount: { type: Number, default: 0 }
    }],
    useCustomOnly: { 
        type: Boolean, 
        default: true  // For AI-generated, use only these questions
    },
    generatedAt: { 
        type: Date, 
        default: Date.now 
    },
    generatedBy: { 
        type: String,  // 'ai' or 'vendor'
        default: 'ai' 
    }
}, { timestamps: true });

// Chat Session - stores conversations
const chatSessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productId: { type: String, required: true },
    vendorId: { type: String },
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

// Temporary Product (for testing until Product model is ready)
const tempProductSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: 'default' },
    description: { type: String },
    vendorId: { type: String }
});

export const FAQTemplate = mongoose.model('FAQTemplate', faqTemplateSchema);
export const ProductFAQ = mongoose.model('ProductFAQ', productFAQSchema);
export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export const TempProduct = mongoose.model('TempProduct', tempProductSchema);