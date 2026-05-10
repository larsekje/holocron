// Apply the homebrew Genesys conversion (Holocron v2 PDF p. 67, "Stat Block
// Conversion") to canonical FFG SWRPG vehicle stat blocks.
//
// Pure functions on the vehicle JSON shape. Called from buildSpotlightIndex
// before each entry is emitted so the spotlight index lands already-converted.
// Conversion summary per PDF p. 67:
//   - Silhouette: unchanged
//   - Speed: rename to Max Speed (we keep the JSON key); cap at 5
//   - Handling: unchanged
//   - Defense: sum across tracked zones / number of zones tracked, round up
//     or down — single value, exposed as derived.defense. Per-arc data is
//     intentionally dropped (Genesys collapses arcs as written).
//   - Armor: civilian -1 (min 1); battleships and stations +1 (sil <7) or +2
//     (sil >=7). Civilian = anything that isn't `group === 'Capital Ships'`.
//   - HT Threshold: + silhouette
//   - SS Threshold: unchanged
//   - Weapon damage: -2 (clamped to 0)
//   - Blast / Breach quality: -2 (dropped if it goes <=0)
//   - Guided quality: +1
//   - Range overrides for Lasers/Ions/Torpedoes/Turbo-Lasers from the PDF are
//     recommendations rather than mechanical rules; not auto-applied here.

export function convertVehicleToGenesys(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') return vehicle;

  const sil = vehicle.characteristics?.Silhouette ?? 0;
  const isBattleship = vehicle.group === 'Capital Ships';
  const armorMod = isBattleship ? (sil >= 7 ? 2 : 1) : -1;

  return {
    ...vehicle,
    characteristics: vehicle.characteristics
      ? {
          ...vehicle.characteristics,
          Speed: capSpeed(vehicle.characteristics.Speed),
        }
      : vehicle.characteristics,
    derived: vehicle.derived
      ? {
          // Per-arc `defence` is intentionally dropped — Genesys uses a single
          // `defense` value computed below.
          armour: applyArmor(vehicle.derived.armour, armorMod),
          hull: bumpHull(vehicle.derived.hull, sil),
          system: vehicle.derived.system,
          defense: flattenDefense(vehicle.derived.defence),
        }
      : vehicle.derived,
    weapons: Array.isArray(vehicle.weapons)
      ? vehicle.weapons.map(convertWeapon)
      : vehicle.weapons,
  };
}

function capSpeed(s) {
  return typeof s === 'number' && s > 5 ? 5 : s;
}

function applyArmor(raw, mod) {
  if (typeof raw !== 'number') return raw;
  return Math.max(1, raw + mod);
}

function bumpHull(raw, sil) {
  if (typeof raw !== 'number') return raw;
  return raw + (typeof sil === 'number' ? sil : 0);
}

function flattenDefense(defence) {
  if (!defence || typeof defence !== 'object') return 0;
  const zones = ['fore', 'aft', 'port', 'starboard'];
  const tracked = zones
    .map((z) => defence[z])
    .filter((v) => typeof v === 'number');
  if (tracked.length === 0) return 0;
  const sum = tracked.reduce((a, b) => a + b, 0);
  return Math.round(sum / tracked.length);
}

function convertWeapon(weapon) {
  if (!weapon || typeof weapon !== 'object') return weapon;
  const damage =
    typeof weapon.damage === 'number'
      ? Math.max(0, weapon.damage - 2)
      : weapon.damage;
  const qualities = Array.isArray(weapon.qualities)
    ? weapon.qualities.map(convertQuality).filter((q) => q != null)
    : weapon.qualities;
  // `arc` (Forward / Aft / Port / Starboard / Dorsal / Ventral) is intentionally
  // dropped — the homebrew Genesys rules don't track firing arcs.
  const { arc: _arc, ...rest } = weapon;
  return { ...rest, damage, qualities };
}

function convertQuality(qStr) {
  if (typeof qStr !== 'string') return qStr;
  // Quality strings come in two shapes: "<Name>" (passive, e.g. "Auto-Fire")
  // or "<Name> <Rank>" (ranked, e.g. "Blast 4", "Linked 1"). Match both.
  const m = qStr.match(/^(.+?)(?:\s+(\d+))?$/);
  if (!m) return qStr;
  const name = m[1].trim();
  const lower = name.toLowerCase();
  const rank = m[2] != null ? parseInt(m[2], 10) : null;

  if (rank == null) return qStr; // unranked quality untouched

  let newRank = rank;
  if (lower === 'blast' || lower === 'breach') newRank = rank - 2;
  else if (lower === 'guided') newRank = rank + 1;

  // Blast/Breach below 1 don't carry meaning — drop the quality entirely.
  if (newRank <= 0 && (lower === 'blast' || lower === 'breach')) {
    return null;
  }
  if (newRank < 0) newRank = 0;

  return `${name} ${newRank}`;
}
