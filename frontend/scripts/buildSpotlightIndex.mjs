// Build the spotlight search index from the curated JSON data at
// frontend/public/assets/data. That data is the single source of truth;
// stoogoff/oggdude were the upstream raw inputs that fed it.
//
// Output: frontend/src/data/spotlightIndex.generated.json — bundled at build time.

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.resolve(projectRoot, 'frontend', 'public', 'assets', 'data');
const outFile = path.resolve(projectRoot, 'frontend', 'src', 'data', 'spotlightIndex.generated.json');

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function readJson(filename) {
  const filePath = path.join(dataDir, filename);
  try {
    const raw = (await fs.readFile(filePath, 'utf-8')).replace(/^﻿/, '');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[spotlight] Failed to read ${path.relative(projectRoot, filePath)}: ${e.message}`);
    return null;
  }
}

function entry(type, name, { subtitle, tags = [], description, extra = {}, named } = {}) {
  const id = `${type}_${slugify(name)}`;
  const result = {
    id,
    type,
    name,
    detail: { id, type, name, description, ...extra },
  };
  if (subtitle) result.subtitle = subtitle;
  if (tags && tags.length) result.tags = tags;
  if (typeof named === 'boolean') result.named = named;
  return result;
}

function pushUnique(results, e) {
  if (!results.some((x) => x.id === e.id)) results.push(e);
}

const ADVERSARY_TYPES = new Set(['Minion', 'Rival', 'Nemesis']);

function buildAdversaries(rawList) {
  const results = [];
  if (!Array.isArray(rawList)) return results;
  let skipped = 0;
  for (const adv of rawList) {
    if (!adv || typeof adv !== 'object') {
      skipped++;
      continue;
    }
    if (!adv.name || !ADVERSARY_TYPES.has(adv.type)) {
      // Skip malformed records (e.g. a description sneaking in as the name).
      skipped++;
      continue;
    }
    const description =
      typeof adv.description === 'string' && adv.description.length > 0
        ? adv.description
        : undefined;
    pushUnique(
      results,
      entry('adversary', adv.name, {
        subtitle: adv.type,
        tags: Array.isArray(adv.tags) ? adv.tags.filter(Boolean).map(String) : undefined,
        description,
        named: adv.named === true,
        extra: {
          adversaryType: adv.type,
          named: adv.named === true,
          characteristics: adv.characteristics,
          derived: adv.derived,
          skills: adv.skills,
          talents: adv.talents,
          abilities: adv.abilities,
          weapons: adv.weapons,
          gear: adv.gear,
          factions: adv.factions,
          archetypes: adv.archetypes,
          traits: adv.traits,
        },
      }),
    );
  }
  if (skipped) console.warn(`[spotlight] Skipped ${skipped} malformed adversary entries.`);
  return results;
}

function buildTalents(rawList) {
  const results = [];
  if (!Array.isArray(rawList)) return results;
  for (const t of rawList) {
    if (!t?.name) continue;
    const ranked = t.ranked === true;
    pushUnique(
      results,
      entry('talent', t.name, {
        subtitle: ranked ? 'Ranked' : undefined,
        tags: ranked ? ['Ranked'] : undefined,
        description: t.description,
        extra: {
          ranked,
          tier: t.tier,
          activation: t.activation,
        },
      }),
    );
  }
  return results;
}

function buildWeapons(rawList) {
  const results = [];
  if (!Array.isArray(rawList)) return results;
  for (const w of rawList) {
    if (!w?.name) continue;
    const qualities = Array.isArray(w.qualities) ? w.qualities : [];
    const subtitleBits = [];
    if (w.damage != null) subtitleBits.push(`Damage ${w.damage}`);
    if (w.critical != null) subtitleBits.push(`Crit ${w.critical}`);
    pushUnique(
      results,
      entry('weapon', w.name, {
        subtitle: subtitleBits.join(', ') || undefined,
        tags: qualities.map((q) => (typeof q === 'string' ? q : q?.name)).filter(Boolean),
        description: w.description,
        extra: {
          skill: w.skill,
          damage: w.damage,
          crit: w.critical,
          range: w.range,
          encum: w.encumbrance ?? w.encum,
          hardPoints: w.hardPoints,
          price: w.price,
          rarity: w.rarity,
          qualities,
          category: w.category ?? w.type,
        },
      }),
    );
  }
  return results;
}

async function main() {
  // Verify data dir exists
  try {
    const stat = await fs.stat(dataDir);
    if (!stat.isDirectory()) throw new Error('not a directory');
  } catch {
    console.warn(`[spotlight] Data directory missing at ${path.relative(projectRoot, dataDir)}.`);
    const existing = await fs.readFile(outFile, 'utf-8').catch(() => null);
    if (existing && existing.trim().length > 2) {
      console.warn(`[spotlight] Keeping existing index at ${path.relative(projectRoot, outFile)}.`);
      return;
    }
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, '[]\n', 'utf-8');
    return;
  }

  const [adversariesRaw, talentsRaw, weaponsRaw] = await Promise.all([
    readJson('adversaries.json'),
    readJson('talents.json'),
    readJson('weapons.json'),
  ]);

  const results = [
    ...buildAdversaries(adversariesRaw),
    ...buildTalents(talentsRaw),
    ...buildWeapons(weaponsRaw),
  ];

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(results, null, 2), 'utf-8');
  console.log(
    `[spotlight] Wrote ${results.length} entries (${results.filter((r) => r.type === 'adversary').length} adversaries, ${results.filter((r) => r.type === 'talent').length} talents, ${results.filter((r) => r.type === 'weapon').length} weapons) to ${path.relative(projectRoot, outFile)}.`,
  );
}

main().catch((err) => {
  console.error('[spotlight] Failed to build Spotlight index:', err);
  process.exit(1);
});
