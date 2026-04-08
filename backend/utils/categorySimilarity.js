import { toPlural } from './pluralize.js';

/**
 * Simple stemming: remove common English suffixes
 */
function stem(word) {
    let stemmed = word.replace(/(ies|ves|es|s)$/, '');
    stemmed = stemmed.replace(/(ing|ed|er|est)$/, '');
    return stemmed;
}

/**
 * Normalize a category name:
 * - lowercase
 * - remove punctuation
 * - remove stop words
 * - apply stemming
 */
function normalizeForComparison(name) {
    const stopWords = [
        'items', 'products', 'product', 'goods', 'accessories', 'accessory',
        'equipment', 'gear', 'collection', 'series', 'things', 'stuff'
    ];
    let normalized = name.toLowerCase().trim();
    normalized = normalized.replace(/[^\w\s]/g, '');
    let words = normalized.split(/\s+/);
    words = words.filter(word => !stopWords.includes(word));
    if (words.length === 0) return '';
    words = words.map(word => stem(word));
    return words.join(' ');
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }
    return matrix[b.length][a.length];
}

function areSimilar(normA, normB) {
    if (normA === normB) return true;
    if (normA.length === 0 || normB.length === 0) return false;
    if (normA.includes(normB) || normB.includes(normA)) return true;
    const maxLen = Math.max(normA.length, normB.length);
    const distance = levenshteinDistance(normA, normB);
    const ratio = distance / maxLen;
    return ratio <= 0.3;
}

/**
 * Find existing categories similar to the given name.
 * Fetches ALL categories from DB and checks each one.
 */
export async function findSimilarCategories(name, CategoryModel) {
    const pluralName = toPlural(name);
    const allCategories = await CategoryModel.find().select('name');
    const similar = [];

    for (const existing of allCategories) {
        const existingName = existing.name;
        
        // Exact match after pluralization
        if (existingName.toLowerCase() === pluralName.toLowerCase()) {
            similar.push(existing);
            continue;
        }
        
        const normalizedNew = normalizeForComparison(pluralName);
        const normalizedExisting = normalizeForComparison(existingName);
        
        if (areSimilar(normalizedNew, normalizedExisting)) {
            similar.push(existing);
        }
    }
    
    return similar;
}