import mongoose from 'mongoose';
import { connectDB, disconnectDB, isDBConnected } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { slugify } from '../utils/slugify.js';
import { Skill } from '../modules/skills/skill.model.js';
import { Role } from '../modules/skills/role.model.js';
import { SKILLS, ROLES_SEED } from './skills.data.js';
import { seedDemo } from './demo.seed.js';

/**
 * Idempotent seed runner. Upserts the skill taxonomy and role competency models.
 * Safe to run repeatedly. Usage: `npm run seed`.
 */
export async function seedSkills() {
  let created = 0;
  let updated = 0;
  for (const s of SKILLS) {
    const slug = slugify(s.canonicalName);
    const aliases = (s.aliases || []).map((a) => a.toLowerCase().trim());
    const res = await Skill.updateOne(
      { slug },
      { $set: { canonicalName: s.canonicalName, slug, category: s.category, aliases, active: true } },
      { upsert: true }
    );
    if (res.upsertedCount) created += 1;
    else if (res.modifiedCount) updated += 1;
  }
  return { created, updated, total: SKILLS.length };
}

export async function seedRoles() {
  let created = 0;
  let updated = 0;
  for (const r of ROLES_SEED) {
    const slug = slugify(r.title);
    const mappedSkills = r.mappedSkills.map((m) => ({ ...m, slug: slugify(m.name) }));
    const res = await Role.updateOne(
      { slug },
      { $set: { title: r.title, slug, category: r.category, description: r.description, mappedSkills, active: true } },
      { upsert: true }
    );
    if (res.upsertedCount) created += 1;
    else if (res.modifiedCount) updated += 1;
  }
  return { created, updated, total: ROLES_SEED.length };
}

export async function runSeed() {
  await connectDB();
  if (!isDBConnected()) {
    logger.error('Cannot seed: database is not connected. Set MONGODB_URI in .env and retry.');
    return false;
  }
  const skills = await seedSkills();
  const roles = await seedRoles();
  logger.info(`Seed complete. Skills: ${JSON.stringify(skills)} | Roles: ${JSON.stringify(roles)}`);

  // Optional demo dataset: `npm run seed -- --demo` or `npm run seed:demo`.
  if (process.argv.includes('--demo')) {
    await seedDemo();
  }
  return true;
}

// Run directly (node src/seed/index.js)
const isDirect = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('src/seed/index.js');
if (isDirect) {
  runSeed()
    .then(async () => {
      await disconnectDB();
      await mongoose.connection.close().catch(() => {});
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error(`Seed failed: ${err.message}`);
      await disconnectDB().catch(() => {});
      process.exit(1);
    });
}
