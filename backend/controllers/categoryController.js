import Category from "../models/Category.js";
import { toPlural } from "../utils/pluralize.js";

function formatCategoryName(name) {
    return name
        .trim()
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// Create category
export const createCategory = async (req, res) => {
    try {
        const {name, parentCategory} = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        // Step 1: normalize + pluralize
        const plural = toPlural(name.trim().toLowerCase());

        // Step 2: format (Capital Case)
        const finalName = formatCategoryName(plural);

        // Step 3: Check for existing category with the same name (case-insensitive)
        const existing = await Category.findOne({
            name: { $regex: `^${finalName}$`, $options: "i" }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name: finalName,
            parentCategory: parentCategory || null,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            data: category,
        });
        
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



// Build tree recursively
const buildCategoryTree = (categories, parentId = null) => {
    return categories
        .filter(cat => {
            return String(cat.parentCategory) === String(parentId);
        })
        .map(cat => ({
            _id: cat._id,
            name: cat.name,
            parentCategory: cat.parentCategory,
            children: buildCategoryTree(categories, cat._id)
        }));
};

// Get all categories (tree)
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({})
            .select("-__v")
            .lean();

        const categoryTree = buildCategoryTree(categories, null);

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categoryTree
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}