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