/**
 * Normalize a label into a stable slug key used for matching and lookups.
 * e.g. "Node.js " -> "node.js", "C++" -> "c++", "Machine  Learning" -> "machine learning"
 * Keeps meaningful symbols (+ . #) that distinguish tech skills.
 */
export function slugify(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9+.# ]/g, '')
    .trim();
}

export default slugify;
