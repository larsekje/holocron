// Parse OggDude vehicle XML into the same shape as the curated
// frontend/public/assets/data/vehicles/{eote,aor,fad}.json files. Lets the
// build script ingest the full ~415 vehicle library (capital ships, frigates,
// supplemental craft) without hand-curation.
//
// Shape produced — matches what buildVehicles() expects:
//   { name, fullName, group, info: {...}, characteristics: {...},
//     derived: {...}, weapons: [...] }
//
// Weapons get resolved against Weapons.xml so each vehicle entry carries
// inlined weapon stats (name, damage, crit, range, qualities) just like the
// curated set. Genesys conversion is applied separately by buildVehicles.

import { promises as fs } from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
});

const RANGE_LABEL = {
  wrEngaged: 'Engaged',
  wrShort: 'Short',
  wrMedium: 'Medium',
  wrLong: 'Long',
  wrExtreme: 'Extreme',
  wrClose: 'Close',
};

const SENSOR_LABEL = {
  srShort: 'Short',
  srMedium: 'Medium',
  srLong: 'Long',
  srExtreme: 'Extreme',
  srClose: 'Close',
};

const QUALITY_NAMES = {
  AUTOFIRE: 'Auto-Fire',
  LIMITEDAMMO: 'Limited Ammo',
  SLOWFIRING: 'Slow-Firing',
  STUNDAMAGE: 'Stun Damage',
  STUNSETTING: 'Stun Setting',
};

// Convert OggDude QualityKey ("LINKED") to a human-readable name ("Linked").
function qualityName(key) {
  if (!key) return '';
  if (QUALITY_NAMES[key]) return QUALITY_NAMES[key];
  return key.charAt(0) + key.slice(1).toLowerCase();
}

// Convert FiringArcs object (six bools) into a single arc label that matches
// what the curated JSONs use (Forward / Aft / Port / Starboard / All / mixed).
function arcLabel(arcs) {
  if (!arcs || typeof arcs !== 'object') return undefined;
  const set = [];
  if (arcs.Fore === true) set.push('Forward');
  if (arcs.Aft === true) set.push('Aft');
  if (arcs.Port === true) set.push('Port');
  if (arcs.Starboard === true) set.push('Starboard');
  if (arcs.Dorsal === true) set.push('Dorsal');
  if (arcs.Ventral === true) set.push('Ventral');
  if (set.length === 0) return undefined;
  // Forward+Aft+Port+Starboard = "All" (turret-style coverage).
  const cardinal = ['Forward', 'Aft', 'Port', 'Starboard'];
  if (cardinal.every((c) => set.includes(c))) return 'All';
  return set.join('/');
}

// OggDude Handling stores raw signed integer; curated JSON expects "+0", "-1".
function formatHandling(h) {
  const n = typeof h === 'number' ? h : parseInt(h, 10);
  if (!Number.isFinite(n)) return '+0';
  return n >= 0 ? `+${n}` : String(n);
}

// XML lists become arrays only when there are multiple children. Normalize so
// the caller can always treat them as arrays.
function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function navicomputer(v) {
  if (v === true || v === 'true') return 'Yes';
  if (v === false || v === 'false') return 'No';
  if (typeof v === 'string' && v.length > 0) return v;
  return null;
}

// Build an in-memory weapon catalogue keyed by OggDude weapon Key. Each entry
// has the resolved stats that the curated JSON shape needs to inline.
async function loadWeaponCatalogue(oggdudeRoot) {
  const file = path.join(oggdudeRoot, 'Weapons.xml');
  const raw = await fs.readFile(file, 'utf-8');
  const parsed = xml.parse(raw);
  const items = asArray(parsed?.Weapons?.Weapon);
  const catalogue = {};
  for (const w of items) {
    if (!w?.Key) continue;
    catalogue[w.Key] = {
      name: w.Name ?? w.Key,
      damage: typeof w.Damage === 'number' ? w.Damage : null,
      crit: typeof w.Crit === 'number' ? w.Crit : null,
      range: RANGE_LABEL[w.RangeValue] ?? w.RangeValue ?? undefined,
    };
  }
  return catalogue;
}

// Pick the first non-generic category as the vehicle's display group. OggDude
// often stacks ["Capital Ship", "Non-Fighter Starship", "Starship"]; we want
// the most specific.
function pickGroup(categories) {
  const list = asArray(categories?.Category).filter(Boolean);
  if (list.length === 0) return undefined;
  // Skip very generic terminal categories so e.g. "Capital Ship" wins over
  // "Starship". The curated JSONs use plural group names ("Starfighters",
  // "Freighters") — we don't try to match that exactly; the OggDude category
  // is close enough for filtering and tagging.
  const generic = new Set(['Starship', 'Vehicle', 'Speeder']);
  const specific = list.find((c) => !generic.has(c));
  return specific ?? list[0];
}

function buildWeaponEntry(vw, catalogue) {
  const def = catalogue[vw.Key];
  if (!def) return null; // Weapon key not in catalogue — skip rather than guess.
  const qualities = asArray(vw.Qualities?.Quality)
    .map((q) => {
      if (!q?.Key) return null;
      const name = qualityName(q.Key);
      const count = q.Count;
      if (typeof count === 'number' && count > 0) return `${name} ${count}`;
      return name;
    })
    .filter(Boolean);
  const arc = arcLabel(vw.FiringArcs);
  const count = typeof vw.Count === 'number' ? vw.Count : undefined;
  // OggDude vehicle weapons can carry a Count > 1 indicating the weapon is
  // installed in batteries of N. The curated JSONs flatten these into a name
  // like "Heavy turbolaser batteries" — for our purposes we just expose the
  // count as Linked-style flavour in the name when > 1, so the GM sees it.
  const nameWithCount = count && count > 1 ? `${def.name} (×${count})` : def.name;
  return {
    name: nameWithCount,
    arc,
    damage: def.damage,
    critical: def.crit,
    range: def.range,
    qualities,
  };
}

function vehicleFromXml(v, catalogue) {
  if (!v?.Name) return null;

  const sources = asArray(v?.Sources?.Source).map((s) => s?.['#text'] ?? s);
  const sourceTag = sources[0] ?? '';

  const characteristics = {
    Silhouette: typeof v.Silhouette === 'number' ? v.Silhouette : 1,
    Speed: typeof v.Speed === 'number' ? v.Speed : 0,
    Handling: formatHandling(v.Handling),
  };

  const derived = {
    armour: typeof v.Armor === 'number' ? v.Armor : 0,
    hull: typeof v.HullTrauma === 'number' ? v.HullTrauma : 0,
    system: typeof v.SystemStrain === 'number' ? v.SystemStrain : 0,
    defence: {
      fore: typeof v.DefFore === 'number' ? v.DefFore : 0,
      aft: typeof v.DefAft === 'number' ? v.DefAft : 0,
      port: typeof v.DefPort === 'number' ? v.DefPort : null,
      starboard: typeof v.DefStarboard === 'number' ? v.DefStarboard : null,
    },
  };

  const info = {
    type: v.Type ?? undefined,
    manufacturer: undefined,
    hyperdrive:
      v.HyperdrivePrimary != null
        ? {
            primary: typeof v.HyperdrivePrimary === 'number' ? v.HyperdrivePrimary : null,
            backup: typeof v.HyperdriveBackup === 'number' ? v.HyperdriveBackup : null,
          }
        : null,
    navicomputer: navicomputer(v.NaviComputer),
    sensors: SENSOR_LABEL[v.SensorRangeValue] ?? v.SensorRangeValue ?? null,
    complement: v.Crew ?? null,
    encumbrance: typeof v.EncumbranceCapacity === 'number' ? v.EncumbranceCapacity : null,
    passengers: v.Passengers ?? null,
    consumables: v.Consumables ?? null,
    price: typeof v.Price === 'number' ? v.Price : null,
    rarity: typeof v.Rarity === 'number' ? v.Rarity : null,
    hardpoints: typeof v.HP === 'number' ? v.HP : 0,
  };

  const weapons = asArray(v?.VehicleWeapons?.VehicleWeapon)
    .map((vw) => buildWeaponEntry(vw, catalogue))
    .filter(Boolean);

  return {
    name: v.Name,
    fullName: v.Name,
    group: pickGroup(v.Categories),
    info,
    characteristics,
    derived,
    weapons,
    _sourceTag: sourceTag,
  };
}

/**
 * Read every Vehicles/*.xml entry through the in-memory weapon catalogue and
 * return them in the curated-JSON shape (pre-Genesys-conversion). `oggdudeRoot`
 * defaults to the project's backend/data/oggdude path.
 */
export async function loadOggdudeVehicles(oggdudeRoot) {
  const catalogue = await loadWeaponCatalogue(oggdudeRoot);
  const dir = path.join(oggdudeRoot, 'Vehicles');
  const files = await fs.readdir(dir);
  const xmlFiles = files.filter((f) => f.toLowerCase().endsWith('.xml'));
  const out = [];
  for (const f of xmlFiles) {
    try {
      const raw = await fs.readFile(path.join(dir, f), 'utf-8');
      const parsed = xml.parse(raw);
      const v = parsed?.Vehicle;
      if (!v) continue;
      const built = vehicleFromXml(v, catalogue);
      if (built) out.push(built);
    } catch (e) {
      console.warn(`[oggdude] Failed to parse ${f}: ${e.message}`);
    }
  }
  return out;
}
