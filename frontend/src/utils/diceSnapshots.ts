import {nanoid} from 'nanoid';
import type {Participant} from '@/state/participantsStore';
import useParticipantStore from '@/state/participantsStore';
import useActiveVehicleStore from '@/state/activeVehicleStore';
import {speedBandFor} from '@/data/vehicleActions';
import type {ModalSnapshot, SnapshotAttacker, SnapshotTarget, SnapshotWeapon} from '@components/dice/mockSnapshots';
import type {DicePool} from '@/engine/diceEngine';

export function snapshotTargetFromParticipant(p: Participant): SnapshotTarget {
  const stats = (p.stats ?? {}) as Record<string, any>;
  return {
    name: p.name,
    soak: stats.soak ?? 0,
    meleeDef: stats.meleeDefense ?? 0,
    rangedDef: stats.rangedDefense ?? 0,
    wounds: stats.wounds ?? 0,
    woundThreshold: stats.woundThreshold ?? (p.isPC ? 12 : 8),
  };
}

export const RANGE_DIFFICULTY_TABLE: Record<SnapshotWeapon['range'], { count: number; label: string; presetId: string }> = {
  // Melee attacks at engaged range are Average (2 purple) by core SWRPG rules.
  // Ranged-Light/Heavy penalties at engaged are layered via the Modifiers
  // popover, not baked into the base.
  engaged: { count: 2, label: 'Average',  presetId: 'difficulty-average' },
  short:   { count: 1, label: 'Easy',     presetId: 'difficulty-easy' },
  medium:  { count: 2, label: 'Average',  presetId: 'difficulty-average' },
  long:    { count: 3, label: 'Hard',     presetId: 'difficulty-hard' },
  extreme: { count: 4, label: 'Daunting', presetId: 'difficulty-daunting' },
};

function snapshotAttackerFromParticipant(p: Participant): SnapshotAttacker {
  const stats = p.stats || {};
  return {
    name: p.name,
    characteristics: {
      brawn: stats.brawn ?? 2,
      agility: stats.agility ?? 2,
      intellect: stats.intellect ?? 2,
      cunning: stats.cunning ?? 2,
      willpower: stats.willpower ?? 2,
      presence: stats.presence ?? 2,
    },
    skills: (stats.skills as Record<string, number>) ?? {},
  };
}

// Skill rank + characteristic value → { ability, proficiency } (the green/yellow split).
function skillPool(rank: number, charValue: number): {ability: number; proficiency: number} {
  const yellow = Math.min(rank, charValue);
  const green = Math.max(rank, charValue) - yellow;
  return {ability: green, proficiency: yellow};
}

// Empty snapshot for the freestanding dice button on the top bar — no
// attacker, no weapon, no skill context. The user adds dice manually.
export function buildFreestandingSnapshot(): ModalSnapshot {
  return {
    id: nanoid(),
    label: 'Freestanding roll',
    mode: 'basic',
    pool: {},
    appliedPresets: [],
    appliedModifiers: [],
    result: null,
    spent: [],
  };
}

function skillSources(skillName: string, rank: number, charValue: number): Partial<Record<string, string[]>> {
  const yellow = Math.min(rank, charValue);
  const green = Math.max(rank, charValue) - yellow;
  const sources: Partial<Record<string, string[]>> = {};
  const label = skillName ? `${skillName} ${rank}` : `Skill ${rank}`;
  if (green > 0)  sources.ability     = Array(green).fill(label);
  if (yellow > 0) sources.proficiency = Array(yellow).fill(label);
  return sources;
}

export function buildSkillCheckSnapshot(
  participant: Participant,
  skillName: string,
  characteristic: string,
  rank: number,
  charValue: number,
): ModalSnapshot {
  const pool: DicePool = {...skillPool(rank, charValue), difficulty: 2};
  return {
    id: nanoid(),
    label: `${participant.name} — ${skillName}`,
    mode: 'basic',
    difficultyLabel: 'Average',
    attacker: snapshotAttackerFromParticipant(participant),
    attackerParticipantId: participant.id,
    skill: skillName,
    characteristic,
    pool,
    poolSources: {
      ...skillSources(skillName, rank, charValue),
      difficulty: ['Difficulty', 'Difficulty'],
    } as ModalSnapshot['poolSources'],
    appliedPresets: ['difficulty-average'],
    appliedModifiers: [],
    result: null,
    spent: [],
  };
}

export interface WeaponLike {
  name: string;
  skill: string;
  damage: number | string;
  critical?: number | string;
  crit?: number | string;
  range: string;
  qualities?: string[];
  notes?: string;
}

// Map a weapon's "range" string ('Engaged', 'Short', etc) to the SnapshotWeapon enum.
function normaliseRange(r: string): SnapshotWeapon['range'] {
  const lower = (r || '').toLowerCase();
  if (lower.includes('engage')) return 'engaged';
  if (lower.includes('short')) return 'short';
  if (lower.includes('medium')) return 'medium';
  if (lower.includes('extreme')) return 'extreme';
  if (lower.includes('long')) return 'long';
  return 'short';
}

// Holocron v2 PDF table 2-6: Attack Difficulty by range. Re-exports the shared
// table for callers that already imported the local name.
const RANGE_DIFFICULTY = RANGE_DIFFICULTY_TABLE;

function parseQualities(qualities: string[] | undefined): SnapshotWeapon['qualities'] {
  if (!qualities) return [];
  return qualities.map((q) => {
    const m = q.match(/^(.+?)\s+(\d+)$/);
    if (m) return {name: m[1], rank: parseInt(m[2], 10)};
    return {name: q};
  });
}

// Sum ranks of the "Adversary N" talent on a target. Excludes
// "Starship Adversary" — that's a separate talent for vehicle/starship combat.
function adversaryRanks(talents: string[] | undefined): number {
  if (!talents) return 0;
  let total = 0;
  for (const t of talents) {
    const m = t.match(/^Adversary\s+(\d+)$/i);
    if (m) total += parseInt(m[1], 10);
  }
  return total;
}

// Convert N Difficulty → Challenge in place. Adds fresh Challenge dice if
// there's nothing to upgrade. Sources are tagged with `label` so the dice
// roller's breakdown explains where each die came from.
function upgradePoolDifficulty(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  count: number,
  label: string,
): void {
  if (count <= 0) return;
  let diff = pool.difficulty ?? 0;
  let chal = pool.challenge ?? 0;
  let remaining = count;
  let added = 0;
  while (remaining > 0) {
    if (diff > 0) diff -= 1;
    chal += 1;
    added += 1;
    remaining -= 1;
  }
  if (diff === 0) delete pool.difficulty;
  else pool.difficulty = diff;
  pool.challenge = chal;

  const diffSources = sources.difficulty ?? [];
  const remainingDiffSources = diffSources.slice(0, diff);
  if (remainingDiffSources.length === 0) delete sources.difficulty;
  else sources.difficulty = remainingDiffSources;
  sources.challenge = [...(sources.challenge ?? []), ...Array(added).fill(label)];
}

// Convert N Ability dice → Proficiency in place. Standard SWRPG
// "upgrade ability" semantics; when no Ability remains, the upgrade adds a
// fresh Proficiency. Used for Gain the Advantage's outgoing buff.
function upgradePoolAbility(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  count: number,
  label: string,
): void {
  if (count <= 0) return;
  let ability = pool.ability ?? 0;
  let proficiency = pool.proficiency ?? 0;
  let remaining = count;
  let added = 0;
  while (remaining > 0) {
    if (ability > 0) ability -= 1;
    proficiency += 1;
    added += 1;
    remaining -= 1;
  }
  if (ability === 0) delete pool.ability;
  else pool.ability = ability;
  pool.proficiency = proficiency;

  const abilSources = sources.ability ?? [];
  const remainingAbil = abilSources.slice(0, ability);
  if (remainingAbil.length === 0) delete sources.ability;
  else sources.ability = remainingAbil;
  sources.proficiency = [...(sources.proficiency ?? []), ...Array(added).fill(label)];
}

// Add N boost dice with the given source label.
function addBoostToPool(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  count: number,
  label: string,
): void {
  if (count <= 0) return;
  pool.boost = (pool.boost ?? 0) + count;
  sources.boost = [...(sources.boost ?? []), ...Array(count).fill(label)];
}

// Add N setback dice to the pool with the given source label.
function addSetbackToPool(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  count: number,
  label: string,
): void {
  if (count <= 0) return;
  pool.setback = (pool.setback ?? 0) + count;
  sources.setback = [...(sources.setback ?? []), ...Array(count).fill(label)];
}

// Downgrade N Difficulty dice in place — convert Challenge → Difficulty if
// Challenge dice exist, otherwise remove a Difficulty die. Mirror of
// `upgradePoolDifficulty`. Source-tracking for downgraded dice is loose:
// we keep the difficulty count's source array trimmed so it stays in sync,
// but don't tag the per-die provenance (the GM can read the active chip
// list to see why a roll got easier).
function downgradePoolDifficulty(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  count: number,
): void {
  if (count <= 0) return;
  let remaining = count;
  while (remaining > 0) {
    if ((pool.challenge ?? 0) > 0) {
      pool.challenge = (pool.challenge ?? 0) - 1;
      const chalSources = sources.challenge ?? [];
      sources.challenge = chalSources.slice(0, pool.challenge);
      if (sources.challenge.length === 0) delete sources.challenge;
      pool.difficulty = (pool.difficulty ?? 0) + 1;
      sources.difficulty = [...(sources.difficulty ?? []), 'Difficulty'];
    } else if ((pool.difficulty ?? 0) > 0) {
      pool.difficulty = (pool.difficulty ?? 0) - 1;
      const diffSources = sources.difficulty ?? [];
      sources.difficulty = diffSources.slice(0, pool.difficulty);
      if (pool.difficulty === 0) {
        delete pool.difficulty;
        delete sources.difficulty;
      } else if (sources.difficulty.length === 0) {
        delete sources.difficulty;
      }
    }
    // else: nothing to downgrade — silently absorbed.
    remaining -= 1;
  }
  if ((pool.challenge ?? 0) === 0) delete pool.challenge;
}

// When a vehicle is the currently-Targeted entity, layer its standing
// modifiers onto the attacker's pool:
//   - Speed-band attack upgrades (PDF p.50 — Speed 5+ upgrades incoming
//     attacks once).
//   - Evasive Maneuvers chip → +1 upgrade.
//   - Boost Shields chip → +1 setback (each point of defense translates
//     to one setback per SWRPG core).
// All sources are labelled so the GM can see why the attack got harder.
function applyVehicleTargetModifiers(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
): void {
  const avs = useActiveVehicleStore.getState();
  const selectedId = avs.selectedVehicleId;
  if (!selectedId) return;
  const vehicle = avs.vehicles[selectedId];
  if (!vehicle) return;

  upgradePoolDifficulty(
    pool,
    sources,
    speedBandFor(vehicle.currentSpeed).attackedUpgrades,
    'Target speed',
  );

  for (const eff of vehicle.activeEffects ?? []) {
    if (eff.moveId === 'evasive-maneuvers') {
      upgradePoolDifficulty(pool, sources, 1, 'Evasive Maneuvers');
    } else if (eff.moveId === 'boost-shields') {
      addSetbackToPool(pool, sources, 1, 'Boost Shields');
    } else if (eff.moveId === 'stay-on-target') {
      // Stay on Target: incoming attacks are downgraded — flying steady
      // makes the ship an easier target.
      downgradePoolDifficulty(pool, sources, 1);
    } else if (eff.moveId === 'gain-advantage') {
      // Target has the advantage on us: PDF p.51 — upgrade difficulty of
      // all combat checks made by the target vehicle against the pilot's
      // vehicle twice. The "target vehicle" here is the attacker.
      upgradePoolDifficulty(pool, sources, 2, "Target's advantage");
    }
  }
}

// When the attacker is aboard a vehicle with active Evasive / Stay on
// Target chips, those modify outgoing combat checks too — Evasive upgrades
// (the trade-off: my own shots get harder), Stay on Target downgrades (my
// gunners get an easier shot). PDF p.50–51.
function applyOwnVehicleAttackModifiers(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  attacker: Participant,
): void {
  const vehicleId = attacker.equippedVehicleId;
  if (!vehicleId) return;
  const vehicle = useActiveVehicleStore.getState().vehicles[vehicleId];
  if (!vehicle) return;
  for (const eff of vehicle.activeEffects ?? []) {
    if (eff.moveId === 'evasive-maneuvers') {
      upgradePoolDifficulty(pool, sources, 1, 'Own ship: Evasive');
    } else if (eff.moveId === 'stay-on-target') {
      downgradePoolDifficulty(pool, sources, 1);
    } else if (eff.moveId === 'gain-advantage') {
      // Have the advantage: own combat checks against the target are
      // ability-upgraded twice (PDF p.51).
      upgradePoolAbility(pool, sources, 2, 'Has the Advantage');
    } else if (eff.moveId === 'target-lock') {
      // Pilot adds a boost die to Gunnery checks vs the locked target.
      addBoostToPool(pool, sources, 1, 'Target Lock');
    }
  }
}

// Adversary N upgrades up to N existing Difficulty dice to Challenge dice.
// Per the rule, no new dice are added if there's nothing to upgrade.
// Mutates pool + sources in place; the upgraded dice are labelled
// "Adversary N" so the GM can see why and override in PoolBuilder if needed.
function applyAdversaryUpgrade(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  talents: string[] | undefined,
): void {
  const ranks = adversaryRanks(talents);
  if (ranks <= 0) return;
  const currentDifficulty = pool.difficulty ?? 0;
  const upgrades = Math.min(ranks, currentDifficulty);
  if (upgrades <= 0) return;

  const label = `Adversary ${ranks}`;

  const nextDifficulty = currentDifficulty - upgrades;
  if (nextDifficulty === 0) delete pool.difficulty;
  else pool.difficulty = nextDifficulty;
  pool.challenge = (pool.challenge ?? 0) + upgrades;

  const diffSources = sources.difficulty ?? [];
  const remainingDiffSources = diffSources.slice(0, nextDifficulty);
  if (remainingDiffSources.length === 0) delete sources.difficulty;
  else sources.difficulty = remainingDiffSources;

  const chalSources = sources.challenge ?? [];
  sources.challenge = [...chalSources, ...Array(upgrades).fill(label)];
}

export function buildAttackSnapshot(
  participant: Participant,
  weapon: WeaponLike,
  resolvedSkillRank: number,
  resolvedCharacteristic: string,
  resolvedCharValue: number,
): ModalSnapshot {
  const range = normaliseRange(weapon.range);
  const diff = RANGE_DIFFICULTY[range];
  const pool: DicePool = { ...skillPool(resolvedSkillRank, resolvedCharValue), difficulty: diff.count };
  const damageValue = typeof weapon.damage === 'string' ? parseInt(weapon.damage, 10) : weapon.damage;
  const critValue = typeof weapon.critical === 'string'
    ? parseInt(weapon.critical, 10)
    : (weapon.critical ?? (typeof weapon.crit === 'string' ? parseInt(weapon.crit, 10) : weapon.crit) ?? 0);

  // Auto-target = whoever is currently "Targeted" (selectedParticipantId).
  // Same source the Targeted panel reads, no equality filtering.
  const ps = useParticipantStore.getState();
  const selectedId = ps.selectedParticipantId;
  const selectedTarget = selectedId
    ? ps.participants.find((p) => p.id === selectedId)
    : undefined;

  const poolSources: Partial<Record<string, string[]>> = {
    ...skillSources(weapon.skill || 'weapon', resolvedSkillRank, resolvedCharValue),
    difficulty: Array(diff.count).fill('Difficulty'),
  };
  applyAdversaryUpgrade(pool, poolSources, selectedTarget?.stats?.talents);
  applyVehicleTargetModifiers(pool, poolSources);
  applyOwnVehicleAttackModifiers(pool, poolSources, participant);

  return {
    id: nanoid(),
    label: `${participant.name} — ${weapon.name}`,
    mode: 'combat',
    difficultyLabel: diff.label,
    attacker: snapshotAttackerFromParticipant(participant),
    attackerParticipantId: participant.id,
    targetParticipantId: selectedTarget?.id,
    target: selectedTarget ? snapshotTargetFromParticipant(selectedTarget) : undefined,
    skill: weapon.skill,
    characteristic: resolvedCharacteristic,
    weapon: {
      name: weapon.name,
      skill: weapon.skill,
      damage: Number.isFinite(damageValue) ? (damageValue as number) : 0,
      crit: Number.isFinite(critValue as number) ? (critValue as number) : 0,
      range,
      baseRange: range,
      qualities: parseQualities(weapon.qualities),
    },
    pool,
    poolSources: poolSources as ModalSnapshot['poolSources'],
    appliedPresets: [diff.presetId],
    appliedModifiers: [],
    result: null,
    spent: [],
  };
}
