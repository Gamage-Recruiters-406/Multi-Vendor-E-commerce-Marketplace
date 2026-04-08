export function pluralize(word) {
  if (!word) return word;
  const lower = word.toLowerCase();
  // Common irregulars
  const irregulars = {
    child: "children",
    person: "people",
    man: "men",
    woman: "women",
    tooth: "teeth",
    foot: "feet",
    mouse: "mice",
    goose: "geese",
  };
  if (irregulars[lower]) return irregulars[lower];
  // Words ending with y -> ies
  if (lower.endsWith("y") && !"aeiou".includes(lower[lower.length - 2])) {
    return word.slice(0, -1) + "ies";
  }
  // Words ending with s, sh, ch, x, z -> es
  if (/(s|sh|ch|x|z)$/i.test(lower)) {
    return word + "es";
  }
  // Default: add s
  return word + "s";
}
