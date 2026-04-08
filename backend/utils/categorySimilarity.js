import Category from '../models/Category.js';
import { pluralize } from './pluralize.js';

/**
 * Find existing categories similar to the given name.
 * Strategy: exact match after pluralization (case-insensitive).
 * Returns array of matching categories (usually 0 or 1).
 */
export async function findSimilarCategories(name) {
    const pluralName = pluralize(name);
    // Case-insensitive exact match using regex
    const regex = new RegExp(`^${escapeRegex(pluralName)}$`, 'i');
    return await Category.find({ name: regex });
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}