import { Skill } from './skill.model.js';
import { isDBConnected } from '../../config/db.js';
import { slugify } from '../../utils/slugify.js';
import { logger } from '../../utils/logger.js';

/**
 * Synonym/normalization layer for consistent skill matching.
 *
 * Builds an in-memory index (alias/slug -> canonicalName) from the Skill
 * collection, cached briefly to avoid per-request DB hits. Degrades gracefully:
 * when the DB is unavailable or a skill is unknown, it returns a cleaned version
 * of the input so matching still works with raw labels.
 */
const CACHE_TTL_MS = 60_000;
let cache = { at: 0, map: new Map() };

async function buildIndex() {
  const map = new Map();
  if (!isDBConnected()) return map;
  try {
    const skills = await Skill.find({ active: true }).select('canonicalName slug aliases').lean();
    for (const s of skills) {
      map.set(s.slug, s.canonicalName);
      map.set(slugify(s.canonicalName), s.canonicalName);
      for (const a of s.aliases || []) map.set(slugify(a), s.canonicalName);
    }
  } catch (err) {
    logger.warn(`Skill normalization index build failed: ${err.message}`);
  }
  return map;
}

async function getIndex() {
  const now = Date.now();
  if (now - cache.at < CACHE_TTL_MS && cache.map.size) return cache.map;
  const map = await buildIndex();
  cache = { at: now, map };
  return map;
}

/** Force a rebuild on next lookup (call after taxonomy edits). */
export function invalidateNormalizationCache() {
  cache = { at: 0, map: new Map() };
}

/**
 * Normalize a single raw skill name to its canonical form.
 * Falls back to a title-cased cleaned label when unknown.
 */
export async function normalizeName(raw) {
  if (!raw) return '';
  const key = slugify(raw);
  const index = await getIndex();
  if (index.has(key)) return index.get(key);
  return titleCase(raw);
}

/**
 * Normalize a list of skills. Accepts strings or {name, level} objects and
 * always returns {name, level, matched} objects (deduped by canonical name).
 */
export async function normalizeSkillList(list = []) {
  const index = await getIndex();
  const out = new Map();
  for (const item of list) {
    const rawName = typeof item === 'string' ? item : item?.name;
    if (!rawName) continue;
    const level = typeof item === 'object' && item?.level ? item.level : 'intermediate';
    const key = slugify(rawName);
    const matched = index.has(key);
    const name = matched ? index.get(key) : titleCase(rawName);
    // Keep the highest-signal entry if duplicates collapse to the same canonical.
    if (!out.has(name)) out.set(name, { name, level, matched });
  }
  return [...out.values()];
}

function titleCase(str) {
  const cleaned = String(str).trim().replace(/\s+/g, ' ');
  // Preserve tokens with special chars (e.g. node.js, c++) as-is lowercased.
  if (/[.+#]/.test(cleaned)) return cleaned;
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}
