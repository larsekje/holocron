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
// Stoogoff adversaries (JSON) directory
const stoogoffAdversariesDir = path.resolve(projectRoot, 'backend', 'data', 'stoogoff', 'adversaries');

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

async function listXmlFiles(dirPath) {
  try {
    const names = await fs.readdir(dirPath, { withFileTypes: true });
    return names
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.xml'))
      .map((e) => path.join(dirPath, e.name));
  } catch {
    return [];
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

function asArray(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function cleanText(x) {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  return JSON.stringify(x);
}

// Inference helpers (JS versions of archetypeUtils heuristics)
const tagIncludes = (tags, needle) => !!(tags || []).some((t) => String(t).toLowerCase().includes(String(needle).toLowerCase()));
const nameIncludes = (name, needle) => String(name || '').toLowerCase().includes(String(needle || '').toLowerCase());
const valOr = (n, d) => (typeof n === 'number' ? n : d);

function inferFactionJS(adversary) {
  const tags = adversary.tags || [];
  const name = adversary.name || '';
  const factions = new Set();
  if (tagIncludes(tags, 'empire') || tagIncludes(tags, 'imperial')) factions.add('Imperial');
  if (tagIncludes(tags, 'rebel') || tagIncludes(tags, 'alliance')) factions.add('Rebel');
  if (tagIncludes(tags, 'underworld') || tagIncludes(tags, 'pirate') || tagIncludes(tags, 'hutt')) factions.add('Underworld');
  if (tagIncludes(tags, 'corporate') || tagIncludes(tags, 'sorosuub') || tagIncludes(tags, 'czerka') || tagIncludes(tags, 'kuat')) factions.add('Corporate');
  if (tagIncludes(tags, 'security') || tagIncludes(tags, 'police') || nameIncludes(name, 'Guard') || nameIncludes(name, 'Officer')) factions.add('Local Law');
  if (tagIncludes(tags, 'civilian') || tagIncludes(tags, 'nobility')) factions.add('Civilian');
  if (tagIncludes(tags, 'cis') || tagIncludes(tags, 'separatist')) factions.add('Separatist/CIS');
  if (tagIncludes(tags, 'species:Droid')) factions.add('Droid');
  if (tagIncludes(tags, 'creature')) factions.add('Creature');
  if (factions.size === 0) factions.add('Other');
  return Array.from(factions);
}

function inferArchetypesJS(adversary) {
  const roles = new Set();
  const skills = adversary.skills || {};
  const weapons = adversary.weapons || [];
  const tags = adversary.tags || [];
  const name = adversary.name || '';
  const abilities = adversary.abilities || [];
  const skill = (k) => (typeof skills[k] === 'number' ? skills[k] : 0);
  const hasWeapon = (needle) => (weapons || []).some((w) => (typeof w === 'string' ? w : (w || {}).name)?.toLowerCase().includes(String(needle).toLowerCase()));

  if (skill('Brawl') >= 2 || skill('Melee') >= 2 || hasWeapon('vibro') || hasWeapon('sword') || hasWeapon('spear') || hasWeapon('shock gloves') || skill('Coercion') >= 2) roles.add('Bruiser');
  if (skill('Ranged: Light') >= 2 || skill('Ranged: Heavy') >= 2 || hasWeapon('pistol') || hasWeapon('rifle') || hasWeapon('carbine') || hasWeapon('repeater') || hasWeapon('sniper')) roles.add('Shooter');

  const stealthy = skill('Stealth') >= 2;
  const skulExpert = skill('Skulduggery') >= 3;
  const assassinationSignals = tagIncludes(tags, 'assassin') || nameIncludes(name, 'Assassin');
  const sniperish = skill('Ranged: Heavy') >= 3 && hasWeapon('sniper');
  if (stealthy || assassinationSignals || sniperish || (skulExpert && (stealthy || assassinationSignals))) roles.add('Operative');

  if (skill('Computers') >= 2 || tagIncludes(tags, 'slicer') || tagIncludes(tags, 'hacker') || skill('Mechanics') >= 2 || tagIncludes(tags, 'engineer') || tagIncludes(tags, 'technician')) roles.add('Tech');
  if (skill('Piloting: Space') >= 2 || skill('Piloting: Planetary') >= 2) roles.add('Pilot');
  if (skill('Medicine') >= 2 || tagIncludes(tags, 'medic')) roles.add('Medic');
  if (skill('Survival') >= 2 || skill('Perception') >= 2 || tagIncludes(tags, 'hunter') || tagIncludes(tags, 'scout')) roles.add('Scout');
  if (skill('Leadership') >= 2 || nameIncludes(name, 'Officer') || tagIncludes(tags, 'officer') || tagIncludes(tags, 'commander')) roles.add('Leader');

  const socialStrong = Math.max(skill('Charm'), skill('Deception'), skill('Negotiation')) >= 3;
  if (socialStrong || tagIncludes(tags, 'entertainer') || tagIncludes(tags, 'nobility') || tagIncludes(tags, 'bureaucrat') || tagIncludes(tags, 'compnor') || nameIncludes(name, 'Administrator')) roles.add('Social');

  if (tagIncludes(tags, 'security') || nameIncludes(name, 'Guard') || nameIncludes(name, 'Police') || tagIncludes(tags, 'police') || tagIncludes(tags, 'law')) roles.add('Security');
  if (tagIncludes(tags, 'force') || tagIncludes(tags, 'inquisitor') || (abilities || []).some((a) => String(a).toLowerCase().includes('force'))) roles.add('Force‑User');
  if (tagIncludes(tags, 'species:Droid')) roles.add('Droid');
  if (tagIncludes(tags, 'creature')) roles.add('Beast/Creature');

  return Array.from(roles);
}

function inferTraitsJS(adversary) {
  const traits = new Set();
  const skills = adversary.skills || {};
  const weapons = adversary.weapons || [];
  const tags = adversary.tags || [];
  const derived = adversary.derived || {};
  const characteristics = adversary.characteristics || {};
  const abilities = adversary.abilities || [];
  const skill = (k) => (typeof skills[k] === 'number' ? skills[k] : 0);
  const hasWeapon = (needle) => (weapons || []).some((w) => (typeof w === 'string' ? w : (w || {}).name)?.toLowerCase().includes(String(needle).toLowerCase()));
  const soak = valOr(derived.soak, valOr(characteristics.Brawn, 2));
  const wounds = valOr(derived.wounds, 10);
  const meleeDef = Array.isArray(derived.defense) ? valOr(derived.defense[0], 0) : 0;
  const rangedDef = Array.isArray(derived.defense) ? valOr(derived.defense[1], 0) : 0;
  const defense = Math.max(meleeDef, rangedDef);

  const strongAttack = skill('Ranged: Heavy') >= 3 || skill('Ranged: Light') >= 3 || skill('Melee') >= 3 || skill('Brawl') >= 3;
  const fragile = soak <= 3 && defense <= 1 && wounds <= 12;
  if (strongAttack && fragile) traits.add('Glass Cannon');

  const controlGear = hasWeapon('stun') || hasWeapon('net') || hasWeapon('ensnare') || hasWeapon('riot shield');
  const hasAdversary = (adversary.talents || []).some((t) => String(t).toLowerCase().includes('adversary'));
  if (defense >= 2 || soak >= 6 || (hasAdversary && (defense >= 1 || soak >= 6 || controlGear)) || controlGear) traits.add('Persistent Pest');

  if (skill('Medicine') >= 2 || tagIncludes(tags, 'medic')) traits.add('Healer');
  if (skill('Ranged: Heavy') >= 3 && (hasWeapon('sniper') || hasWeapon('rifle'))) traits.add('Sniper');
  if (skill('Brawl') >= 2 || hasWeapon('shock') || hasWeapon('vibroknuck') || hasWeapon('vibroblade')) traits.add('Brawler');

  const socialMax = Math.max(skill('Charm'), skill('Deception'), skill('Negotiation'));
  const presence = valOr(characteristics.Presence, 2);
  if (tagIncludes(tags, 'nobility') || tagIncludes(tags, 'bureaucrat') || tagIncludes(tags, 'compnor') || (presence >= 3 && socialMax >= 3)) traits.add('Politician');

  if (tagIncludes(tags, 'creature')) {
    traits.add('Beast');
    if (soak >= 6 || wounds >= 18 || hasWeapon('breach') || hasWeapon('vicious')) traits.add('Nasty Beast');
  }

  if (tagIncludes(tags, 'force') || tagIncludes(tags, 'inquisitor') || (abilities || []).some((a) => String(a).toLowerCase().includes('force'))) traits.add('Force User');
  if (skill('Piloting: Space') >= 3 || skill('Piloting: Planetary') >= 3) traits.add('Ace Pilot');

  return Array.from(traits);
}

function isNamedCharacter(name, tags, sourceFileBase) {
  // True if coming from characters.json explicitly
  if (String(sourceFileBase || '').toLowerCase() === 'characters.json') return true;
  const n = String(name || '').trim();
  if (!n) return false;
  // Titles that usually denote a specific person
  const titled = /^(Admiral|General|Captain|Agent|Governor|Grand Moff|Moff|Commander|Senator|Duchess|Lord|Lady|Doctor|Dr\.|Professor)\b/.test(n);
  if (titled) return true;
  // Proper two+ word personal names (each part capitalized), excluding generic role nouns
  const proper = /^[A-Z][A-Za-z'\-]+(?: [A-Z][A-Za-z'\-]+)+$/.test(n);
  if (proper) {
    const forbidden = ['Guard','Trooper','Officer','Pilot','Assassin','Droid','Beast','Creature','Staff','Mate','Thug','Henchman','Soldier','Pirate','Scout','Gunner','Laborer','Worker','Minion'];
    const words = n.split(/\s+/);
    const hasForbidden = words.some((w) => forbidden.includes(w));
    if (!hasForbidden) return true;
  }
  return false;
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

// Collector for normalized adversaries to publish for the frontend UI
const adversariesOut = new Map();

async function loadStoogoffAdversaries(results) {
  // Read all JSON files in the stoogoff adversaries directory
  let files = [];
  try {
    files = await listJsonFiles(stoogoffAdversariesDir);
  } catch {
    files = [];
  }
  if (!files || files.length === 0) return;

  // De-duplicate by adversary name (case-insensitive)
  const seen = new Set();

  const pickSource = (tags) => {
    if (!Array.isArray(tags)) return undefined;
    const book = tags.find((t) => typeof t === 'string' && t.startsWith('book:'));
    const adv = tags.find((t) => typeof t === 'string' && t.startsWith('adventure:'));
    const nice = (s) => (s ? String(s).replace(/^.*?:/, '').trim() : undefined);
    const parts = [nice(book), nice(adv)].filter(Boolean);
    return parts.length ? parts.join(' • ') : undefined;
  };

  for (const file of files) {
    try {
      const txt = await fs.readFile(file, 'utf-8');
      const arr = JSON.parse(txt);
      if (!Array.isArray(arr)) continue;
      for (const a of arr) {
        if (!a || typeof a !== 'object') continue;
        const name = a.name || a.Name;
        const atype = a.type || a.Type;
        if (!name || !atype) continue;
        const key = String(name).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const tags = Array.isArray(a.tags) ? a.tags.slice(0, 6) : [];
        const source = pickSource(tags);

        // Spotlight entry
        push(
          results,
          entry('adversary', name, {
            subtitle: String(atype),
            tags: [String(atype), ...tags].filter(Boolean),
            description: a.description || a.notes || '',
            extra: {
              category: String(atype),
              source,
            },
          })
        );

        // Normalized adversary for frontend UI (adversaryService)
        try {
          const characteristics = a.characteristics || a.Characteristics || {};
          const rawDerived = a.derived || a.Derived || {};
          const derived = { ...(rawDerived || {}) };
          if (Array.isArray(derived.defence) && !derived.defense) {
            derived.defense = derived.defence; // normalize British spelling
          }
          const skillsRaw = a.skills || a.Skills || {};
          const skills = Array.isArray(skillsRaw)
            ? skillsRaw.reduce((acc, s) => {
                if (s) acc[String(s)] = 1;
                return acc;
              }, {})
            : skillsRaw || {};
          const talents = Array.isArray(a.talents) ? a.talents : (a.talents ? [a.talents] : []);
          const abilities = Array.isArray(a.abilities) ? a.abilities : (a.abilities ? [a.abilities] : []);
          const weapons = Array.isArray(a.weapons) ? a.weapons : (a.weapons ? [a.weapons] : []);
          const gear = Array.isArray(a.gear) ? a.gear : (a.gear ? [a.gear] : []);
          const fullTags = Array.isArray(a.tags) ? a.tags : (a.tags ? [a.tags] : []);
          const sourceBase = path.basename(file);

          const normalized = {
            name: String(name),
            type: String(atype),
            description: a.description || undefined,
            notes: a.notes || undefined,
            characteristics,
            derived,
            skills,
            talents,
            abilities,
            weapons,
            gear,
            tags: fullTags,
          };

          // Build-time inference and named flag
          const factions = inferFactionJS(normalized);
          const archetypes = inferArchetypesJS(normalized);
          const traits = inferTraitsJS(normalized);
          const named = isNamedCharacter(String(name), fullTags, sourceBase);

          adversariesOut.set(key, {
            ...normalized,
            factions,
            archetypes,
            traits,
            named,
          });
        } catch {
          // ignore normalization issues for this record
        }
      }
    } catch {
      // ignore malformed files
    }
  }
}

async function buildIndex() {
  const results = [];

  // Include all adversaries from stoogoff JSON into Spotlight
  await loadStoogoffAdversaries(results);

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

  // Vehicles parsing intentionally disabled (ignore vehicles for now)
  // If needed later, restore parsing of XML files in oggdude/Vehicles and push 'vehicle' entries.

  // Write output
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(results, null, 2), 'utf-8');

  // Also write a flattened adversaries.json for the frontend UI
  const adversariesFile = path.resolve(projectRoot, 'frontend', 'public', 'assets', 'data', 'adversaries.json');
  await fs.mkdir(path.dirname(adversariesFile), { recursive: true });
  const adversaryArray = Array.from(adversariesOut.values());
  await fs.writeFile(adversariesFile, JSON.stringify(adversaryArray, null, 2), 'utf-8');

  console.log(`[spotlight] Wrote ${results.length} entries to ${path.relative(projectRoot, outFile)}`);
  console.log(`[spotlight] Wrote ${adversaryArray.length} adversaries to ${path.relative(projectRoot, adversariesFile)}`);
}

buildIndex().catch((err) => {
  console.error('[spotlight] Failed to build Spotlight index:', err);
  process.exit(1);
});
