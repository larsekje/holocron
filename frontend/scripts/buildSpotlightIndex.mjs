// Build the spotlight search index from the curated JSON data at
// frontend/public/assets/data. That data is the single source of truth;
// stoogoff/oggdude were the upstream raw inputs that fed it.
//
// Output: frontend/src/data/spotlightIndex.generated.json — bundled at build time.

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertVehicleToGenesys } from './genesysConversion.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const dataDir = path.resolve(projectRoot, 'frontend', 'public', 'assets', 'data');
const generatedDir = path.resolve(projectRoot, 'frontend', 'src', 'data');
const outFile = path.resolve(generatedDir, 'spotlightIndex.generated.json');
const cloutFile = path.resolve(generatedDir, 'adversaryClout.generated.json');

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

function entry(type, name, { subtitle, tags = [], description, extra = {}, named, fromAdventure, clout } = {}) {
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
  if (typeof fromAdventure === 'boolean') result.fromAdventure = fromAdventure;
  if (typeof clout === 'number') result.clout = clout;
  return result;
}

function pushUnique(results, e) {
  if (!results.some((x) => x.id === e.id)) results.push(e);
}

const ADVERSARY_TYPES = new Set(['Minion', 'Rival', 'Nemesis']);

function buildAdversaries(rawList, cloutMap) {
  const results = [];
  if (!Array.isArray(rawList)) return results;
  let skipped = 0;
  let excluded = 0;
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
    const clout = typeof cloutMap?.[adv.name] === 'number' ? cloutMap[adv.name] : undefined;
    const tags = Array.isArray(adv.tags) ? adv.tags.filter(Boolean).map(String) : [];
    // D20Radio.com is fan-forum content — exclude it from the index entirely.
    if (tags.some((t) => /^source:\s*D20Radio\.com$/i.test(t))) {
      excluded++;
      continue;
    }
    // Characters that appear in a pre-written adventure carry an
    // `adventure:<Adventure Name>` tag in the source data. Hoist that into a
    // boolean so the query language and the Spotlight header can filter on it
    // the same way they do `named`.
    const fromAdventure = tags.some((t) => /^adventure:/i.test(t));
    pushUnique(
      results,
      entry('adversary', adv.name, {
        subtitle: adv.type,
        tags: tags.length ? tags : undefined,
        description,
        named: adv.named === true,
        fromAdventure,
        clout,
        extra: {
          adversaryType: adv.type,
          named: adv.named === true,
          fromAdventure,
          clout,
          characteristics: adv.characteristics,
          derived: adv.derived,
          skills: adv.skills,
          talents: adv.talents,
          abilities: adv.abilities,
          weapons: adv.weapons,
          gear: adv.gear,
          factions: adv.factions,
          archetypes: adv.archetypes,
          coreArchetype: adv.coreArchetype,
          traits: adv.traits,
        },
      }),
    );
  }
  if (skipped) console.warn(`[spotlight] Skipped ${skipped} malformed adversary entries.`);
  if (excluded) console.log(`[spotlight] Excluded ${excluded} D20Radio.com adversary entries.`);
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
    else if (w.plusDamage != null) subtitleBits.push(`Damage +${w.plusDamage}`);
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
          // Melee weapons in the source data omit `damage` and use
          // `plusDamage` (the bonus added to the wielder's Brawn). Preserve
          // it so the runtime can compute final damage per wielder.
          plusDamage: w.plusDamage,
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

// Strip OggDude bracketed prose markup down to plain text with paragraph
// breaks. Vehicle XML descriptions are wrapped in tags like [H3]Title[h3]
// (usually the vehicle name, redundant), [P] (paragraph break), and the
// occasional [B][b] / [I][i]. We drop the headers, replace [P] with a
// double newline, and pass the rest through. Dice symbols use a separate
// bracket grammar (handled by renderSwrpgText at render time).
function cleanOggDudeDescription(desc) {
  return desc
    .replace(/\[H\d+\][\s\S]*?\[h\d+\]/gi, '')
    .replace(/\[P\]/gi, '\n\n')
    .replace(/\[B\]([\s\S]*?)\[b\]/gi, '$1')
    .replace(/\[I\]([\s\S]*?)\[i\]/gi, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Walk the raw OggDude vehicle XML directory and pull out
// `<Description>` blocks keyed by `<Name>`. The stoogoff JSON is the
// canonical stat-block source but it doesn't carry the narrative blurb
// the GMs want in the sheet. Returns a Map<vehicleName, descriptionText>.
async function loadVehicleDescriptions() {
  const dir = path.resolve(projectRoot, 'backend', 'data', 'oggdude', 'Vehicles');
  let files;
  try {
    files = await fs.readdir(dir);
  } catch (e) {
    console.warn(
      `[spotlight] No OggDude vehicle XML at ${path.relative(projectRoot, dir)}; vehicle descriptions will be empty.`,
    );
    return new Map();
  }
  const map = new Map();
  for (const f of files) {
    if (!f.endsWith('.xml')) continue;
    let xml;
    try {
      xml = await fs.readFile(path.join(dir, f), 'utf-8');
    } catch {
      continue;
    }
    const nameMatch = xml.match(/<Name>([\s\S]*?)<\/Name>/);
    const descMatch = xml.match(/<Description>([\s\S]*?)<\/Description>/);
    if (!nameMatch || !descMatch) continue;
    const name = nameMatch[1].trim();
    const desc = cleanOggDudeDescription(descMatch[1]);
    if (desc) map.set(name, desc);
  }
  return map;
}

function buildVehicles(rawList, book, descriptions = new Map()) {
  const results = [];
  if (!Array.isArray(rawList)) return results;
  let skipped = 0;
  for (const v of rawList) {
    if (!v || typeof v !== 'object' || !v.name) {
      skipped++;
      continue;
    }
    const converted = convertVehicleToGenesys(v);
    const sil = converted.characteristics?.Silhouette;
    // Stoogoff carries both a short canonical `name` ("Hawk", "X-Wing",
    // "TIE Fighter") and an official `fullName` ("HWK-290 Light Freighter",
    // "T-65B 'X-Wing' Starfighter"). Prefer the short name as the entry's
    // display name — it's what stoogoff's own picker shows and matches how
    // GMs actually refer to ships at the table. The full name still goes
    // into tags so search can still find "HWK-290" or "T-65B" by typing
    // the marketing designation.
    const tags = [
      converted.group,
      converted.info?.type,
      converted.fullName && converted.fullName !== converted.name ? converted.fullName : null,
      typeof sil === 'number' ? `Sil ${sil}` : null,
    ].filter(Boolean);
    const subtitle = converted.group ?? converted.info?.type ?? undefined;
    // OggDude XML keys descriptions by official long name, so look up by
    // fullName first; fall back to the short name for entries that don't
    // have a fullName separator.
    const description =
      descriptions.get(converted.fullName) ?? descriptions.get(converted.name);
    pushUnique(
      results,
      entry('vehicle', converted.name, {
        subtitle,
        tags,
        description,
        extra: {
          book,
          fullName: converted.fullName,
          group: converted.group,
          info: converted.info,
          characteristics: converted.characteristics,
          derived: converted.derived,
          weapons: converted.weapons,
          // Hoisted so the existing top-bar block at SpotlightDetailPane.tsx
          // picks them up automatically.
          price: converted.info?.price,
          rarity: converted.info?.rarity,
        },
      }),
    );
  }
  if (skipped) console.warn(`[spotlight] Skipped ${skipped} malformed vehicle entries from ${book}.`);
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

  const [adversariesRaw, talentsRaw, weaponsRaw, eoteVehicles, aorVehicles, fadVehicles, cloutMap, vehicleDescriptions] = await Promise.all([
    readJson('adversaries.json'),
    readJson('talents.json'),
    readJson('weapons.json'),
    readJson('vehicles/eote.json'),
    readJson('vehicles/aor.json'),
    readJson('vehicles/fad.json'),
    fs
      .readFile(cloutFile, 'utf-8')
      .then((raw) => JSON.parse(raw.replace(/^﻿/, '')))
      .catch((e) => {
        console.warn(`[spotlight] No clout map at ${path.relative(projectRoot, cloutFile)}: ${e.message}`);
        return null;
      }),
    loadVehicleDescriptions(),
  ]);

  const results = [
    ...buildAdversaries(adversariesRaw, cloutMap),
    ...buildTalents(talentsRaw),
    ...buildWeapons(weaponsRaw),
    ...buildVehicles(eoteVehicles, 'eote', vehicleDescriptions),
    ...buildVehicles(aorVehicles, 'aor', vehicleDescriptions),
    ...buildVehicles(fadVehicles, 'fad', vehicleDescriptions),
  ];

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(results, null, 2), 'utf-8');
  const adversaryCount = results.filter((r) => r.type === 'adversary').length;
  const cloutCount = results.filter((r) => r.type === 'adversary' && typeof r.clout === 'number').length;
  const adventureCount = results.filter((r) => r.type === 'adversary' && r.fromAdventure === true).length;
  const vehicleCount = results.filter((r) => r.type === 'vehicle').length;
  console.log(
    `[spotlight] Wrote ${results.length} entries (${adversaryCount} adversaries [${cloutCount} with clout, ${adventureCount} from adventures], ${results.filter((r) => r.type === 'talent').length} talents, ${results.filter((r) => r.type === 'weapon').length} weapons, ${vehicleCount} vehicles) to ${path.relative(projectRoot, outFile)}.`,
  );
}

main().catch((err) => {
  console.error('[spotlight] Failed to build Spotlight index:', err);
  process.exit(1);
});
