import Category from "../models/Category.js";
import Product from "../models/Product.js";
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



// Update category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parentCategory } = req.body;

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Format name
        let finalName = category.name;

        if (name) {
            const plural = toPlural(name.trim().toLowerCase());
            finalName = formatCategoryName(plural);
        }

        // Duplicate Check
        if (name) {
            const existing = await Category.findOne({
                _id: { $ne: id },
                name: { $regex: `^${finalName}$`, $options: "i" }
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: "Category already exists"
                });
            }
        }

        // Prevent self-parent
        if (parentCategory && parentCategory === id) {
            return res.status(400).json({
                success: false,
                message: "Category cannot be its own parent"
            });
        }

        if (parentCategory !== undefined) {
            category.parentCategory = parentCategory;
        }

        category.name = finalName;

        await category.save();

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        const parentId = category.parentCategory;

        // Step 1: Move child categories
        await Category.updateMany(
            { parentCategory: id },
            { parentCategory: parentId || null }
        );

        // Step 2: Handle products
        if (parentId) {
            // Move products to parent category
            await Product.updateMany(
                { category: id },
                { category: parentId }
            );
        } else {
            // No parent → move to "Uncategorized"
            let uncategorized = await Category.findOne({ 
                name: { $regex: `^Uncategorized$`, $options: "i" }
             });

            if (!uncategorized) {
                uncategorized = await Category.create({
                    name: "Uncategorized",
                    createdBy: req.user._id,
                });
            }

            await Product.updateMany(
                { category: id },
                { category: uncategorized._id }
            );
        }

        // Step 3: Delete category
        await category.deleteOne();

        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
}