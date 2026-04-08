import Category from "../models/Category.js";
import { findSimilarCategories } from "../utils/categorySimilarity.js";
import { toPlural } from "../utils/pluralize.js";

// Create category
export const createCategory = async (req, res, next) => {
    try {
        const {name, parentCategory} = req.body;
        if (!name) {
            return res.status(400).json({message: "Category name is required"});
        }

        // Check similarity
        const similar = await findSimilarCategories(name, Category);
        if (similar.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A similar category already exists',
                existingCategories: similar.map(cat => ({ id: cat._id, name: cat.name })),
            });
        }

        const pluralName = toPlural(name);
        const category = await Category.create({
            name: pluralName,
            parentCategory: parentCategory || null,
            createdBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            return res.status(409).json({ 
                success: false, 
                message: 'Category name already exists (case-insensitive)' 
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};