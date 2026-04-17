import pluralize from 'pluralize';

export function toPlural(word) {
    if (!word) return word;
    // pluralize() directly returns the plural form
    return pluralize(word);
}