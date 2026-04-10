import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';
import { FAQTemplate, ProductFAQ, ChatSession } from '../models/chatbot.js';
import Product from '../models/Product.js';

// Initialize Groq with your free API key
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// ==================== HELPER FUNCTIONS ====================

// Get product by ID with populated fields
async function getProduct(productId) {
    return await Product.findById(productId)
        .populate('category', 'name')
        .populate('store', 'name');
}

// Get AI answer using Groq (for custom typed questions)
async function getGroqAnswer(userQuestion, product) {
    // Get category name
    const categoryName = product.category?.name || 'General';
    const storeName = product.store?.name || 'Vendor';
    
    // Build specifications string from attributes
    let specsText = '';
    if (product.attributes && product.attributes.length > 0) {
        product.attributes.forEach(attr => {
            if (attr.name && attr.values && attr.values.length > 0) {
                specsText += `\n- ${attr.name}: ${attr.values.join(', ')}`;
            }
        });
    }
    
    const prompt = `You are a helpful customer support assistant for an e-commerce marketplace.

PRODUCT INFORMATION:
- Name: ${product.name}
- Price: $${product.price}
- Category: ${categoryName}
- Store: ${storeName}
- Description: ${product.description?.substring(0, 500) || 'No description available'}${specsText}

PLATFORM POLICIES:
- Returns accepted within 14 days of delivery
- Shipping takes 3-7 business days
- All payments are secure

INSTRUCTIONS:
1. Answer ONLY based on the product information provided above
2. Be concise, friendly, and helpful (maximum 150 words)
3. If you don't know the answer, say: "I don't have that information. Would you like to contact the store directly?"
4. Never make up information
5. Use emojis occasionally 🛍️

User Question: ${userQuestion}

Answer:`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful e-commerce customer support assistant."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 300,
        });

        return completion.choices[0]?.message?.content || "I'm having trouble responding. Please try again.";
        
    } catch (error) {
        console.error('Groq API error:', error);
        return "I'm having trouble responding right now. Please try again or contact the store directly. 📞";
    }
}

// Generate product-specific questions using Groq
async function generateProductQuestions(product) {
    const categoryName = product.category?.name || 'General';
    
    const prompt = `You are an e-commerce expert. Based on the following product, generate the 5 most frequently asked questions that customers would ask.

PRODUCT NAME: ${product.name}
CATEGORY: ${categoryName}
PRICE: $${product.price}
DESCRIPTION: ${product.description || 'No description available'}

Generate 5 practical, relevant questions about this SPECIFIC product. 
Each question should be something a real customer would ask before buying.

Return ONLY valid JSON format like this:
[
  {"question": "What is the battery life?", "answer": "Based on specifications, the battery life is [answer from product info]"},
  {"question": "Does it come with a warranty?", "answer": "Answer based on product info or say 'Check with store'"}
]

IMPORTANT: 
- Questions must be SPECIFIC to this product, not generic
- Answers should be based on product information provided
- If information is not available, answer: "Please check product details or contact store"
- Keep answers concise (under 100 words each)`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an e-commerce FAQ generator. Return ONLY valid JSON, no other text."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 2000,
        });

        const text = completion.choices[0]?.message?.content || '';
        
        let cleanText = text;
        if (text.includes('```json')) {
            cleanText = text.split('```json')[1].split('```')[0];
        } else if (text.includes('```')) {
            cleanText = text.split('```')[1];
        }
        
        const questions = JSON.parse(cleanText.trim());
        return questions.slice(0, 5);
        
    } catch (error) {
        console.error('Groq Question Generation error:', error);
        return null;
    }
}

// Fallback answers (if AI fails)
function getFallbackAnswer(question, product) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('return') || lowerQuestion.includes('refund')) {
        return `Returns are accepted within 14 days of delivery. Product must be unused and in original packaging. 🛍️`;
    }
    if (lowerQuestion.includes('shipping') || lowerQuestion.includes('delivery')) {
        return `Shipping typically takes 3-7 business days depending on your location. 📦`;
    }
    if (lowerQuestion.includes('original') || lowerQuestion.includes('genuine')) {
        return `Yes, ${product.name} is 100% genuine and sold by a verified store. ✅`;
    }
    if (lowerQuestion.includes('payment') || lowerQuestion.includes('pay')) {
        return `We accept all major credit cards and digital wallets. Secure payments via Stripe. 💳`;
    }
    if (lowerQuestion.includes('stock') || lowerQuestion.includes('available')) {
        return `Current stock: ${product.stock} units available. 📦`;
    }
    
    return `I don't have that information. Would you like to contact the store directly? 📞`;
}

// Seed default FAQ templates
async function seedDefaultFAQs() {
    const defaultTemplates = [
        {
            category: 'default',
            questions: [
                { question: "What is your return policy?", answer: "Returns accepted within 14 days of delivery. Product must be unused and in original packaging.", displayOrder: 1 },
                { question: "How long does shipping take?", answer: "Shipping typically takes 3-7 business days depending on your location.", displayOrder: 2 },
                { question: "Is this product original?", answer: "Yes, all products are 100% genuine and sold by verified stores.", displayOrder: 3 },
                { question: "Do you offer cash on delivery?", answer: "No, we only accept secure online payments.", displayOrder: 4 },
                { question: "Can I track my order?", answer: "Yes, tracking information is available in your order dashboard once shipped.", displayOrder: 5 }
            ]
        },
        {
            category: 'electronics',
            questions: [
                { question: "What is the battery life?", answer: "Battery life varies by model. Check product specifications for details.", displayOrder: 1 },
                { question: "Does it come with a warranty?", answer: "Yes, most electronics come with a 1-year manufacturer warranty.", displayOrder: 2 },
                { question: "Is the charger included?", answer: "Yes, original charger is included in the box unless stated otherwise.", displayOrder: 3 },
                { question: "Can I return if defective?", answer: "Yes, defective products can be returned within 7 days for a full refund.", displayOrder: 4 },
                { question: "Is this water resistant?", answer: "Check product specifications for IP rating details.", displayOrder: 5 }
            ]
        },
        {
            category: 'clothing',
            questions: [
                { question: "What size should I order?", answer: "Please refer to the size chart in the product images.", displayOrder: 1 },
                { question: "What fabric is this?", answer: "Fabric details are listed in the product description.", displayOrder: 2 },
                { question: "How do I wash this?", answer: "Machine wash cold with similar colors. Check the care label.", displayOrder: 3 },
                { question: "Can I exchange size?", answer: "Yes, size exchanges are supported within 14 days.", displayOrder: 4 },
                { question: "Is it true to size?", answer: "Most customers find it true to size. Check the reviews.", displayOrder: 5 }
            ]
        },
        {
            category: 'furniture',
            questions: [
                { question: "Assembly required?", answer: "Assembly instructions and tools are included. Estimated assembly time: 30-60 minutes.", displayOrder: 1 },
                { question: "What are the dimensions?", answer: "Check the product specifications for detailed dimensions.", displayOrder: 2 },
                { question: "What material is it made of?", answer: "Material details are listed in the product description.", displayOrder: 3 },
                { question: "Is there a warranty?", answer: "Yes, furniture comes with 1-year warranty against manufacturing defects.", displayOrder: 4 },
                { question: "Can I return if damaged?", answer: "Yes, report damage within 48 hours of delivery for free replacement.", displayOrder: 5 }
            ]
        },
        {
            category: 'beauty',
            questions: [
                { question: "Is this product tested on animals?", answer: "All our beauty products are cruelty-free and not tested on animals.", displayOrder: 1 },
                { question: "What are the ingredients?", answer: "Full ingredient list is available in the product description.", displayOrder: 2 },
                { question: "Is it suitable for sensitive skin?", answer: "Check product description for skin type suitability.", displayOrder: 3 },
                { question: "What is the expiration date?", answer: "Expiration date is printed on the product packaging.", displayOrder: 4 },
                { question: "Is it organic?", answer: "Check product specifications for organic certification details.", displayOrder: 5 }
            ]
        },
        {
            category: 'books',
            questions: [
                { question: "Is this book new or used?", answer: "All books sold on our marketplace are new unless clearly stated as used.", displayOrder: 1 },
                { question: "What is the publication date?", answer: "Publication date is listed in the product details.", displayOrder: 2 },
                { question: "Is there an ebook version?", answer: "Check product variations for ebook availability.", displayOrder: 3 },
                { question: "How many pages?", answer: "Page count is listed in the product specifications.", displayOrder: 4 },
                { question: "Who is the publisher?", answer: "Publisher information is in the product details.", displayOrder: 5 }
            ]
        }
    ];
    
    for (const template of defaultTemplates) {
        await FAQTemplate.findOneAndUpdate(
            { category: template.category },
            template,
            { upsert: true }
        );
    }
    console.log('✅ FAQ templates seeded!');
}

// ==================== CONTROLLER FUNCTIONS ====================

// 1. Create a product (Admin only)
export const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Get all products
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category', 'name')
            .populate('store', 'name');
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Get product by ID
export const getProductById = async (req, res) => {
    try {
        const product = await getProduct(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Get 5 FAQ questions when chatbot opens
export const getFAQQuestions = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Get category name for template matching
        const categoryName = product.category?.name?.toLowerCase() || 'default';
        
        // Check for custom AI-generated FAQs
        const customFAQ = await ProductFAQ.findOne({ productId: product._id });
        if (customFAQ && customFAQ.customQuestions.length > 0) {
            const questions = customFAQ.customQuestions
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .slice(0, 5)
                .map(q => ({
                    id: q._id,
                    question: q.question
                }));
            
            return res.json({ 
                questions, 
                productName: product.name, 
                type: 'ai-generated'
            });
        }
        
        // Use category template
        let template = await FAQTemplate.findOne({ 
            category: categoryName 
        });
        
        if (!template) {
            await seedDefaultFAQs();
            template = await FAQTemplate.findOne({ category: 'default' });
        }
        
        const questions = template.questions.slice(0, 5).map(q => ({
            id: q._id,
            question: q.question
        }));
        
        res.json({ questions, productName: product.name, type: 'category-template' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load questions' });
    }
};

// 5. User CLICKS a FAQ button (DEFAULT answer from DB - NO AI)
export const getFAQAnswer = async (req, res) => {
    try {
        const { questionId, productId } = req.body;
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Check custom FAQs first
        const customFAQ = await ProductFAQ.findOne({ productId: product._id });
        if (customFAQ) {
            const question = customFAQ.customQuestions.id(questionId);
            if (question) {
                question.clickCount += 1;
                await customFAQ.save();
                return res.json({ answer: question.answer });
            }
        }
        
        // Use category template
        const categoryName = product.category?.name?.toLowerCase() || 'default';
        const template = await FAQTemplate.findOne({ 
            category: categoryName 
        });
        
        if (template) {
            const question = template.questions.id(questionId);
            if (question) {
                question.clickCount += 1;
                await template.save();
                return res.json({ answer: question.answer });
            }
        }
        
        res.status(404).json({ error: 'Question not found' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get answer' });
    }
};

// 6. User TYPES a custom question (AI generates answer using Groq)
export const askAIQuestion = async (req, res) => {
    try {
        const { message, productId, sessionId } = req.body;
        const userId = req.user._id;
        
        if (!message || !productId) {
            return res.status(400).json({ error: 'Message and productId required' });
        }
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        let session = await ChatSession.findOne({ sessionId });
        if (!session) {
            const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            session = new ChatSession({
                sessionId: newSessionId,
                userId: userId,
                productId: product._id,
                messages: []
            });
        }
        
        const aiAnswer = await getGroqAnswer(message, product);
        
        session.messages.push(
            { sender: 'user', message: message, timestamp: new Date() },
            { sender: 'ai', message: aiAnswer, timestamp: new Date() }
        );
        await session.save();
        
        res.json({
            success: true,
            answer: aiAnswer,
            sessionId: session.sessionId
        });
        
    } catch (error) {
        console.error(error);
        const product = await getProduct(req.body.productId);
        const fallbackAnswer = getFallbackAnswer(req.body.message, product);
        res.json({
            success: true,
            answer: fallbackAnswer,
            sessionId: req.body.sessionId
        });
    }
};

// 7. Get chat history
export const getChatHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user._id;
        
        const session = await ChatSession.findOne({ 
            sessionId,
            userId: userId
        });
        
        if (!session) {
            return res.json({ messages: [], status: 'active' });
        }
        
        res.json({
            messages: session.messages,
            status: session.status
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 8. Contact store/vendor
export const contactVendor = async (req, res) => {
    try {
        const { sessionId, productId } = req.body;
        const userId = req.user._id;
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const storeId = product.store?._id || product.store;
        
        let session = await ChatSession.findOne({ sessionId });
        if (!session) {
            const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            session = new ChatSession({
                sessionId: newSessionId,
                userId: userId,
                productId: product._id,
                vendorId: storeId,
                messages: [],
                status: 'transferred_to_vendor'
            });
        } else {
            if (session.userId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'Access denied to this session' });
            }
            session.vendorId = storeId;
            session.status = 'transferred_to_vendor';
            session.messages.push({
                sender: 'ai',
                message: "You're now connected with the store. They'll respond shortly.",
                timestamp: new Date()
            });
        }
        
        await session.save();
        
        res.json({
            success: true,
            sessionId: session.sessionId,
            message: "Store chat activated. The store will respond shortly."
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to connect to store' });
    }
};

// 9. Send message to store/vendor
export const sendVendorMessage = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const userId = req.user._id;
        
        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        if (session.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Access denied to this session' });
        }
        
        session.messages.push({
            sender: 'user',
            message: message,
            timestamp: new Date(),
            isRead: false
        });
        session.updatedAt = new Date();
        await session.save();
        
        res.json({
            success: true,
            message: "Message sent to store"
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 10. Seed FAQs endpoint handler (Admin only)
export const seedFAQs = async (req, res) => {
    try {
        await seedDefaultFAQs();
        res.json({ 
            success: true, 
            message: "FAQ templates seeded successfully!" 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: error.message 
        });
    }
};

// 11. Generate and save AI FAQs for a product (Store/Vendor or Admin)
export const generateAIFAQ = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Check if user owns the store or is admin
        const isOwner = product.store?._id?.toString() === userId.toString() || product.store?.toString() === userId.toString();
        if (!isOwner && userRole !== 'admin') {
            return res.status(403).json({ error: 'You can only generate FAQs for your own products' });
        }
        
        const generatedQuestions = await generateProductQuestions(product);
        
        if (!generatedQuestions || generatedQuestions.length === 0) {
            return res.status(500).json({ error: 'Failed to generate questions. Please try again.' });
        }
        
        let productFAQ = await ProductFAQ.findOne({ productId: product._id });
        if (!productFAQ) {
            productFAQ = new ProductFAQ({ productId: product._id });
        }
        
        productFAQ.customQuestions = generatedQuestions.map((q, index) => ({
            question: q.question,
            answer: q.answer,
            displayOrder: index + 1,
            clickCount: 0
        }));
        productFAQ.useCustomOnly = true;
        productFAQ.generatedAt = new Date();
        productFAQ.generatedBy = 'ai';
        await productFAQ.save();
        
        res.json({
            success: true,
            message: "AI-generated FAQs saved successfully!",
            questions: productFAQ.customQuestions
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// 12. Preview AI-generated questions (without saving)
export const previewAIFAQ = async (req, res) => {
    try {
        const { productId } = req.body;
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const generatedQuestions = await generateProductQuestions(product);
        
        if (!generatedQuestions) {
            return res.status(500).json({ error: 'Failed to generate questions' });
        }
        
        res.json({
            success: true,
            questions: generatedQuestions
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// 13. Manually edit a product's FAQ question
export const editProductFAQ = async (req, res) => {
    try {
        const { productId, questionId, question, answer } = req.body;
        const userId = req.user._id;
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const isOwner = product.store?._id?.toString() === userId.toString() || product.store?.toString() === userId.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Permission denied' });
        }
        
        let productFAQ = await ProductFAQ.findOne({ productId: product._id });
        if (!productFAQ) {
            return res.status(404).json({ error: 'No FAQs found for this product' });
        }
        
        if (questionId) {
            const questionToEdit = productFAQ.customQuestions.id(questionId);
            if (questionToEdit) {
                if (question) questionToEdit.question = question;
                if (answer) questionToEdit.answer = answer;
            }
        } else {
            productFAQ.customQuestions.push({
                question,
                answer,
                displayOrder: productFAQ.customQuestions.length + 1
            });
        }
        
        await productFAQ.save();
        
        res.json({
            success: true,
            message: "FAQ updated successfully",
            questions: productFAQ.customQuestions
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 14. Delete a product's FAQ question
export const deleteProductFAQ = async (req, res) => {
    try {
        const { productId, questionId } = req.body;
        const userId = req.user._id;
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const isOwner = product.store?._id?.toString() === userId.toString() || product.store?.toString() === userId.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Permission denied' });
        }
        
        let productFAQ = await ProductFAQ.findOne({ productId: product._id });
        if (!productFAQ) {
            return res.status(404).json({ error: 'No FAQs found' });
        }
        
        productFAQ.customQuestions = productFAQ.customQuestions.filter(
            q => q._id.toString() !== questionId
        );
        await productFAQ.save();
        
        res.json({
            success: true,
            message: "FAQ deleted successfully"
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 15. Reset product FAQs to category default
export const resetToDefaultFAQ = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user._id;
        
        const product = await getProduct(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const isOwner = product.store?._id?.toString() === userId.toString() || product.store?.toString() === userId.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Permission denied' });
        }
        
        await ProductFAQ.findOneAndDelete({ productId: product._id });
        
        res.json({
            success: true,
            message: "Reset to category default FAQs"
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ==================== VENDOR ENDPOINTS ====================

// Get all messages for vendor (their store's chat sessions)
export const getVendorSessions = async (req, res) => {
    try {
        const vendorId = req.user._id;
        
        // Find all stores owned by this vendor
        const Store = await import('../models/Store.js');
        const stores = await Store.default.find({ createdBy: vendorId });
        const storeIds = stores.map(s => s._id);
        
        // Find all products in these stores
        const products = await Product.find({ store: { $in: storeIds } });
        const productIds = products.map(p => p._id);
        
        // Find all chat sessions for these products
        const sessions = await ChatSession.find({
            productId: { $in: productIds },
            status: 'transferred_to_vendor'
        })
        .populate('userId', 'name email')
        .populate('productId', 'name')
        .sort({ updatedAt: -1 });
        
        res.json({ success: true, sessions });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Get single chat session messages for vendor
export const getVendorSessionMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const vendorId = req.user._id;
        
        const session = await ChatSession.findOne({ sessionId })
            .populate('userId', 'name email')
            .populate('productId', 'name');
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Verify vendor owns this product's store
        const product = await Product.findById(session.productId).populate('store');
        if (product.store.createdBy.toString() !== vendorId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Mark unread messages as read when vendor views them
        session.messages.forEach(msg => {
            if (msg.sender === 'user' && !msg.isRead) {
                msg.isRead = true;
            }
        });
        await session.save();
        
        res.json({ 
            success: true, 
            session: {
                sessionId: session.sessionId,
                buyer: session.userId,
                product: session.productId,
                messages: session.messages,
                status: session.status
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Vendor reply to buyer
export const vendorReplyToBuyer = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const vendorId = req.user._id;
        
        if (!sessionId || !message) {
            return res.status(400).json({ error: 'SessionId and message required' });
        }
        
        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Verify vendor owns this product's store
        const product = await Product.findById(session.productId).populate('store');
        if (!product || product.store.createdBy.toString() !== vendorId.toString()) {
            return res.status(403).json({ error: 'You can only reply to messages for your products' });
        }
        
        // Add vendor reply to messages
        session.messages.push({
            sender: 'vendor',
            message: message,
            timestamp: new Date(),
            isRead: true
        });
        session.updatedAt = new Date();
        await session.save();
        
        res.json({ 
            success: true, 
            message: 'Reply sent to buyer',
            reply: {
                message: message,
                timestamp: new Date()
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Close chat session (vendor can close)
export const closeChatSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const vendorId = req.user._id;
        
        const session = await ChatSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        // Verify vendor owns this product's store
        const product = await Product.findById(session.productId).populate('store');
        if (product.store.createdBy.toString() !== vendorId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        session.status = 'closed';
        session.messages.push({
            sender: 'vendor',
            message: 'This conversation has been closed. Thank you for contacting us!',
            timestamp: new Date(),
            isRead: true
        });
        await session.save();
        
        res.json({ success: true, message: 'Chat session closed' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};