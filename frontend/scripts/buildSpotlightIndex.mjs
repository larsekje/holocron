import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..', '..');
const defaultOggdudeDir = path.resolve(projectRoot, 'backend', 'data', 'oggdude');
const oggdudeDir =
  process.env.OGGDUDE_DIR ||
  process.env.OGGDUDE_DATA_DIR ||
  defaultOggdudeDir;
const outFile = path.resolve(projectRoot, 'frontend', 'src', 'data', 'spotlightIndex.generated.json');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  trimValues: true,
});

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function safeRead(filePath) {
  try {
    const xml = await fs.readFile(filePath, 'utf-8');
    return parser.parse(xml);
  } catch {
    return null;
  }
}

async function listJsonFiles(dirPath) {
  try {
    const names = await fs.readdir(dirPath, { withFileTypes: true });
    return names
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.json'))
      .map((e) => path.join(dirPath, e.name));
  } catch {
    return [];
  }
}

const BOOK_NAMES = {
  eote: 'Edge of the Empire',
  aor: 'Age of Rebellion',
  fad: 'Force and Destiny',
  crb: 'Core Rulebook',
};

const prettifySource = (s) => {
  if (!s) return undefined;
  const key = String(s).toLowerCase().replace(/\.json$/, '');
  if (BOOK_NAMES[key]) return BOOK_NAMES[key];
  const minor = new Set(['of', 'the', 'and', 'in', 'a', 'on', 'to']);
  return key
    .split(/[-_\s]+/)
    .map((w, i) => (i > 0 && minor.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
};

function asArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function cleanText(x) {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  return JSON.stringify(x);
}

// Helper: parse Source into friendly string
const fmtSource = (src) => {
  if (!src) return undefined;
  if (typeof src === 'string') return src;
  const txt = src?.['#text'] || src?.text || src?._ || src?.Name || src?.name || '';
  const page = src?.Page || src?.page;
  return [txt, page ? `p.${page}` : null].filter(Boolean).join(' ').trim() || undefined;
};

// Normalize Oggdude ActivationValue (e.g., "taIncidental") into user-friendly labels
const normalizeActivation = (a) => {
  const v = String(a ?? '').toLowerCase().trim();
  switch (v) {
    case 'taaction':
      return 'Action';
    case 'tamaneuver':
      return 'Maneuver';
    case 'tapassive':
      return 'Passive';
    case 'taincidental':
      return 'Incidental';
    case 'taincidentaloot':
      return 'Incidental (Out of Turn)';
    default: {
      if (!v) return undefined;
      const stripped = v.startsWith('ta') ? v.slice(2) : v;
      if (stripped === 'incidentaloot') return 'Incidental (Out of Turn)';
      return stripped.charAt(0).toUpperCase() + stripped.slice(1);
    }
  }
};

// Map Skills.xml CharKey -> full characteristic name
const charKeyToName = (k) => {
  const v = String(k || '').toUpperCase();
  switch (v) {
    case 'BR': return 'Brawn';
    case 'AG':
    case 'AGI': return 'Agility';
    case 'INT': return 'Intellect';
    case 'CUN': return 'Cunning';
    case 'WIL': return 'Willpower';
    case 'PR': return 'Presence';
    default: return undefined;
  }
};

// Map skillkey -> full skillname name
const skillKeyToName = (k) => {
    const v = String(k || '').toUpperCase();
    switch (v) {
        case 'GUNN': return 'Gunnery';
        default: return undefined;
    }
};

function entry(type, name, { subtitle, tags = [], description, extra = {} }) {
  const id = `${type}_${slugify(name)}`;
  return {
    id,
    type,
    name,
    subtitle,
    tags,
    detail: {
      id,
      type,
      name,
      description,
      ...extra,
    },
  };
}

function push(results, e) {
  // Avoid duplicate id entries
  if (!results.some((x) => x.id === e.id)) results.push(e);
}

async function buildIndex() {
  // Verify source directory exists
  try {
    const stat = await fs.stat(oggdudeDir);
    if (!stat.isDirectory()) throw new Error('Not a directory');
  } catch {
    console.warn(`[spotlight] Oggdude directory not found at ${oggdudeDir}.`);
    // If an index already exists, keep it to avoid wiping bundled data
    try {
      const existing = await fs.readFile(outFile, 'utf-8').catch(() => null);
      if (existing && existing.trim().length > 2) {
        console.warn(`[spotlight] Keeping existing index at ${path.relative(projectRoot, outFile)} (not rebuilding).`);
        return;
      }
    } catch {}
    console.warn('[spotlight] No existing index found; writing empty index.');
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, JSON.stringify([], null, 2), 'utf-8');
    return;
  }

  const results = [];

  // Talents
  const talentsJson = await safeRead(path.join(oggdudeDir, 'Talents.xml'));
  const talentNodes = asArray(talentsJson?.Talents?.Talent);
  for (const t of talentNodes) {
    const name = t?.Name || t?.name;
    if (!name) continue;
    const tier = t?.Tier ?? t?.tier;
    const activation = t?.Activation ?? t?.activation ?? t?.ActivationValue ?? t?.activationValue;
    const activationLabel = normalizeActivation(activation);
    const rankedRaw = t?.Ranked ?? t?.ranked;
    const ranked = typeof rankedRaw === 'boolean' ? rankedRaw : String(rankedRaw ?? '').toLowerCase() === 'true';
    const summary = t?.Summary ?? t?.Description ?? t?.Text ?? t?.Desc;
    // Normalize source(s) into friendly strings
    const sourceNodes = asArray(t?.Sources?.Source ?? t?.Source ?? t?.Book ?? t?.book);
    const sources = sourceNodes.map((s) => fmtSource(s)).filter(Boolean);
    const extra = {
      tier: tier ?? undefined,
      activation: activation ?? undefined,
      activationLabel: activationLabel ?? undefined,
      ranked: ranked || undefined,
      source: sources[0] ?? undefined,
    };
    push(
      results,
      entry('talent', name, {
        subtitle: [tier ? `Tier ${tier}` : null, ranked ? 'Ranked' : (activationLabel ? String(activationLabel) : null)]
          .filter(Boolean)
          .join(' • ') || undefined,
        // Do not include source in tags; only include normalized activation label
        tags: [activationLabel].filter(Boolean).map(String),
        description: cleanText(summary),
        extra,
      })
    );
  }

  // Helper: parse Source into friendly string (moved above)

  // Weapons
  const weaponsJson = await safeRead(path.join(oggdudeDir, 'Weapons.xml'));
  const weaponNodes = asArray(weaponsJson?.Weapons?.Weapon);
  for (const w of weaponNodes) {
    const name = w?.Name || w?.name;
    if (!name) continue;
    const damage = w?.Damage ?? w?.damage;
    const damageAdd = w?.DamageAdd ?? w?.damageAdd;
    const crit = w?.Crit ?? w?.crit ?? w?.Critical;
    const range = String(w?.RangeValue || '').replace(/^wr/i, '');
    const skill = skillKeyToName(w?.SkillKey);
    const encum = w?.Encum ?? w?.Encumbrance ?? w?.encum;
    const hardPoints = w?.HP ?? w?.HardPoints ?? w?.hardPoints;
    const price = w?.Price ?? w?.price;
    const rarity = w?.Rarity ?? w?.rarity;
    const restrictedRaw = w?.Restricted ?? w?.restricted ?? w?.IsRestricted ?? w?.isRestricted;
    const restricted = typeof restrictedRaw === 'boolean' ? restrictedRaw : String(restrictedRaw ?? '').toLowerCase() === 'true';
    const wtype = w?.Type ?? w?.type;
    const source = fmtSource(w?.Source ?? w?.source ?? w?.Book ?? w?.book);

    // Normalize qualities to preserve counts (e.g., Accurate 1)
    const qualityNodes = asArray(w?.Qualities?.Quality || w?.qualities || w?.Quality);
    const qualities = qualityNodes
      .map((q) => {
        if (typeof q === 'string') return { name: q };
        const key = q?.Key ?? q?.key ?? q?.Name ?? q?.name;
        if (!key) return null;
        const count = q?.Count ?? q?.count ?? q?.Value ?? q?.value ?? q?.Rank ?? q?.rank;
        const out = { name: key };
        if (count != null && count !== '') (out).count = count;
        return out;
      })
      .filter(Boolean);

    // Extract base mods text
    const baseMods = asArray(w?.BaseMods?.Mod).map((m) => {
      if (typeof m === 'string') return m;
      return (
        m?.MiscDesc ??
        m?.miscDesc ??
        m?.Description ??
        m?.description ??
        m?.Name ??
        m?.name ??
        ''
      );
    }).filter(Boolean);

    const desc = w?.Description ?? w?.Desc ?? w?.Text;

    // Build damage subtitle preferring Damage, else DamageAdd with '+'
    const damageSubtitle = (damage != null && Number(damage) !== 0)
      ? `Damage ${damage}`
      : (damageAdd != null && Number(damageAdd) !== 0)
        ? `Damage +${damageAdd}`
        : (damage != null ? `Damage ${damage}` : null);

    push(
      results,
      entry('weapon', name, {
        subtitle: [
          damageSubtitle,
          crit != null ? `Crit ${crit}` : null,
        ]
          .filter(Boolean)
          .join(', ') || undefined,
        // Tag with quality names only
        tags: qualities.map((q) => String((q).name)).filter(Boolean).slice(0, 4),
        description: cleanText(desc),
        extra: {
          damage,
          damageAdd,
          crit,
          range,
          skill,
          encum,
          hardPoints,
          price,
          rarity,
          restricted: restricted || undefined,
          category: wtype,
          qualities,           // full objects so UI can render "Name X"
          baseMods: baseMods.length ? baseMods : undefined,
          source,
        },
      })
    );
  }

  // Skills
  const skillsJson = await safeRead(path.join(oggdudeDir, 'Skills.xml'));
  const skillNodes = asArray(skillsJson?.Skills?.Skill);
  for (const s of skillNodes) {
    const name = s?.Name || s?.name;
    if (!name) continue;
    const type = s?.Type ?? s?.type;
    const career = s?.Career ?? s?.career;
    const charKeyRaw = s?.CharKey ?? s?.charKey ?? s?.CharacteristicKey ?? s?.characteristicKey;
    const charKey = charKeyRaw ? String(charKeyRaw).toUpperCase() : undefined;
    const characteristic = (charKey ? charKeyToName(charKey) : undefined);
    const desc = s?.Description ?? s?.Desc ?? s?.Text;

    push(
      results,
      entry('skill', name, {
        subtitle: characteristic ? String(characteristic) : undefined,
        tags: [type, career, characteristic].filter(Boolean).map(String),
        description: cleanText(desc),
        extra: {
          type,
          career,
          characteristic,
          charKey,
        },
      })
    );
  }

  // Armor
  const armorsJson = await safeRead(path.join(oggdudeDir, 'Armors.xml'));
  const armorNodes = asArray(armorsJson?.Armors?.Armor);
  for (const a of armorNodes) {
    const name = a?.Name || a?.name;
    if (!name) continue;
    const soak = a?.Soak ?? a?.soak;
    const defense = a?.Defense ?? a?.defense;
    const hp = a?.HP ?? a?.HardPoints ?? a?.hardPoints;
    const encum = a?.Encum ?? a?.Encumbrance ?? a?.encum;
    const price = a?.Price ?? a?.price;
    const rarity = a?.Rarity ?? a?.rarity;
    const restrictedRaw = a?.Restricted ?? a?.restricted ?? a?.IsRestricted ?? a?.isRestricted;
    const restricted = typeof restrictedRaw === 'boolean' ? restrictedRaw : String(restrictedRaw ?? '').toLowerCase() === 'true';
    const desc = a?.Description ?? a?.Desc ?? a?.Text;
    const source = fmtSource(a?.Source ?? a?.source ?? a?.Book ?? a?.book);

    push(
      results,
      entry('armor', name, {
        subtitle: [
          soak != null ? `Soak +${soak}` : null,
          defense != null ? `Defense +${defense}` : null,
          hp != null ? `HP ${hp}` : null,
          encum != null ? `Encum ${encum}` : null,
        ]
          .filter(Boolean)
          .join(', ') || undefined,
        tags: ['Armor'],
        description: cleanText(desc),
        extra: { soak, defense, hp, encum, price, rarity, restricted: restricted || undefined, source, category: 'Armor' },
      })
    );
  }

  // Gear
  const gearJson = await safeRead(path.join(oggdudeDir, 'Gears.xml'));
  const gearNodes = asArray(gearJson?.Gears?.Gear);
  for (const g of gearNodes) {
    const name = g?.Name || g?.name;
    if (!name) continue;
    const encum = g?.Encum ?? g?.Encumbrance ?? g?.encum;
    const hp = g?.HP ?? g?.HardPoints ?? g?.hardPoints;
    const price = g?.Price ?? g?.price;
    const rarity = g?.Rarity ?? g?.rarity;
    const restrictedRaw = g?.Restricted ?? g?.restricted ?? g?.IsRestricted ?? g?.isRestricted;
    const restricted = typeof restrictedRaw === 'boolean' ? restrictedRaw : String(restrictedRaw ?? '').toLowerCase() === 'true';
    const desc = g?.Description ?? g?.Desc ?? g?.Text;
    const source = fmtSource(g?.Source ?? g?.source ?? g?.Book ?? g?.book);
    const gearType = g?.Type ?? g?.type;

    push(
      results,
      entry('gear', name, {
        subtitle: [hp != null ? `HP ${hp}` : null, encum != null ? `Encum ${encum}` : null]
          .filter(Boolean)
          .join(', ') || undefined,
        description: cleanText(desc),
        extra: { encum, hp, price, rarity, restricted: restricted || undefined, source, category: gearType ?? 'Gear' },
      })
    );
  }

  // Item Attachments
  const attachmentsJson = await safeRead(path.join(oggdudeDir, 'ItemAttachments.xml'));
  // OggDude structure uses <ItemAttachments><ItemAttachment>...</ItemAttachment></ItemAttachments>
  const attachmentNodes = asArray(
    attachmentsJson?.ItemAttachments?.ItemAttachment ||
    attachmentsJson?.ItemAttachments?.Attachment ||
    attachmentsJson?.Attachments?.Attachment
  );
  for (const att of attachmentNodes) {
    const name = att?.Name || att?.name;
    if (!name) continue;
    const hp = att?.HP ?? att?.HardPoints ?? att?.hardPoints;
    const price = att?.Price ?? att?.price;
    const rarity = att?.Rarity ?? att?.rarity;
    const restrictedRaw = att?.Restricted ?? att?.restricted ?? att?.IsRestricted ?? att?.isRestricted;
    const restricted = typeof restrictedRaw === 'boolean' ? restrictedRaw : String(restrictedRaw ?? '').toLowerCase() === 'true';
    const desc = att?.Description ?? att?.Desc ?? att?.Text;
    // Collect mods from BaseMods and AddedMods; prefer descriptive text (MiscDesc/Description),
    // otherwise fall back to key + optional count (e.g., "ACCURATE 1").
    const collectMods = (node) =>
      asArray(node?.Mod)
        .map((m) => {
          if (!m) return null;
          const misc = m?.MiscDesc ?? m?.miscDesc ?? m?.Description ?? m?.description;
          if (misc && String(misc).trim()) return String(misc).trim();
          const key = m?.Key ?? m?.key ?? m?.Name ?? m?.name;
          const count = m?.Count ?? m?.count ?? m?.Value ?? m?.value ?? m?.Rank ?? m?.rank;
          const label = key ? String(key).trim() : '';
          if (!label) return null;
          return count != null && count !== '' ? `${label} ${count}` : label;
        })
        .filter(Boolean);

    const baseModsArr = collectMods(att?.BaseMods ?? att?.baseMods);
    const addedModsArr = collectMods(att?.AddedMods ?? att?.addedMods);
    const otherModsArr = collectMods(att?.Mods ?? att?.mods); // fallback if some datasets use Mods

    // Backward compatibility: combined mods list
    const mods = [...baseModsArr, ...addedModsArr, ...otherModsArr];

    const source = fmtSource(att?.Source ?? att?.source ?? att?.Book ?? att?.book ?? (att?.Sources?.Source ? asArray(att?.Sources?.Source)[0] : undefined));

    push(
      results,
      entry('attachment', name, {
        subtitle: [hp != null ? `HP ${hp}` : null].filter(Boolean).join(', ') || undefined,
        tags: ['Attachment', ...mods.slice(0, 3)],
        description: cleanText(desc),
        extra: { hp, price, rarity, restricted: restricted || undefined, baseMods: baseModsArr.length ? baseModsArr : undefined, addedMods: addedModsArr.length ? addedModsArr : undefined, mods: mods.length ? mods : undefined, source, category: att.Type },
      })
    );
  }

  // Adversaries (Stoogoff JSON)
  const adversariesDir = path.resolve(projectRoot, 'backend', 'data', 'stoogoff', 'adversaries');
  const advFiles = await listJsonFiles(adversariesDir);
  const advRaw = [];
  for (const file of advFiles) {
    let data;
    try {
      const raw = (await fs.readFile(file, 'utf-8')).replace(/^﻿/, '');
      data = JSON.parse(raw);
    } catch (e) {
      console.warn(`[spotlight] Failed to parse ${path.relative(projectRoot, file)}: ${e.message}`);
      continue;
    }
    if (!Array.isArray(data)) continue;
    const fileSource = prettifySource(path.basename(file, '.json'));
    for (const adv of data) {
      if (!adv?.name) continue;
      const bookTag = (Array.isArray(adv.tags) ? adv.tags : []).find((t) => /^book:/i.test(String(t)));
      const bookCode = bookTag ? String(bookTag).replace(/^book:/i, '').toLowerCase() : null;
      const source = bookCode ? prettifySource(bookCode) : fileSource;
      advRaw.push({ adv, source });
    }
  }
  // Count names so duplicates get a source-suffixed display name
  const advNameCounts = new Map();
  for (const { adv } of advRaw) {
    advNameCounts.set(adv.name, (advNameCounts.get(adv.name) || 0) + 1);
  }
  for (const { adv, source } of advRaw) {
    const isDup = (advNameCounts.get(adv.name) || 0) > 1;
    const displayName = isDup && source ? `${adv.name} (${source})` : adv.name;
    const advType = adv.type || undefined; // Minion / Rival / Nemesis
    push(
      results,
      entry('adversary', displayName, {
        subtitle: advType || undefined,
        tags: Array.isArray(adv.tags) ? adv.tags.filter(Boolean).map(String) : undefined,
        description: cleanText(adv.description),
        extra: {
          adversaryType: advType,
          characteristics: adv.characteristics,
          derived: adv.derived,
          skills: adv.skills,
          talents: adv.talents,
          abilities: adv.abilities,
          weapons: adv.weapons,
          gear: adv.gear,
          source,
        },
      })
    );
  }

  // Vehicles parsing intentionally disabled (ignore vehicles for now)
  // If needed later, restore parsing of XML files in oggdude/Vehicles and push 'vehicle' entries.

  // Write output
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`[spotlight] Wrote ${results.length} entries to ${path.relative(projectRoot, outFile)}`);
}

buildIndex().catch((err) => {
  console.error('[spotlight] Failed to build Spotlight index:', err);
  process.exit(1);
});
