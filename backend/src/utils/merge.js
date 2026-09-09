/**
 * Deep-merge `source` into `target`. Plain objects merge recursively; arrays and
 * primitives replace. Used for partial profile updates so nested sections can be
 * updated without wiping sibling fields.
 */
function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);
}

export function mergeDeep(target = {}, source = {}) {
  const out = { ...target };
  for (const [key, val] of Object.entries(source)) {
    if (val === undefined) continue;
    if (isPlainObject(val) && isPlainObject(out[key])) {
      out[key] = mergeDeep(out[key], val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

export default mergeDeep;
