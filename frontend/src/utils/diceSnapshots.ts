import {nanoid} from 'nanoid';
import type {Participant} from '@/state/participantsStore';
import useParticipantStore from '@/state/participantsStore';
import useActiveVehicleStore, {type ActiveVehicle} from '@/state/activeVehicleStore';
import {useEffectStore} from '@/state/effectStore';
import {speedBandFor} from '@/data/vehicleActions';
import type {ModalSnapshot, SnapshotAttacker, SnapshotTarget, SnapshotWeapon} from '@components/dice/mockSnapshots';
import type {DicePool, DieType, SymbolTotals} from '@/engine/diceEngine';

/** Labels written by `applyVehicleTargetModifiers` that *upgrade* difficulty
 * dice into challenge dice. Reversing these on a target flip means
 * decrementing challenge and adding the difficulty back (with a 'Difficulty'
 * source). Stay-on-target's downgrade isn't in this set — it removes a die
 * rather than adding one, so it isn't reversible from labels alone; flipping
 * a target with stay-on-target active leaves the previous downgrade in
 * place. The GM can re-tune manually if it matters. */
const VEHICLE_TARGET_UPGRADE_LABELS = new Set<string>([
  'Target speed',
  'Evasive Maneuvers',
  "Target's advantage",
]);

/** Labels that *add* a setback die (the only "add" vehicle-target modifier
 * today). Per-die maps would expand here if more add-style modifiers land. */
const VEHICLE_TARGET_ADD_SETBACK_LABELS = new Set<string>(['Boost Shields']);

export function snapshotTargetFromParticipant(p: Participant): SnapshotTarget {
  const stats = (p.stats ?? {}) as Record<string, any>;
  // Only PCs and Nemeses keep a strain pool; Minions/Rivals fold strain into
  // wounds (see Stun routing in CombatDamagePanel).
  const tracksStrain = p.isPC || stats.type === 'Nemesis';
  return {
    name: p.name,
    soak: stats.soak ?? 0,
    meleeDef: stats.meleeDefense ?? 0,
    rangedDef: stats.rangedDefense ?? 0,
    wounds: stats.wounds ?? 0,
    woundThreshold: stats.woundThreshold ?? (p.isPC ? 12 : 8),
    strain: stats.strain ?? 0,
    strainThreshold: stats.strainThreshold ?? (p.isPC ? 12 : 10),
    tracksStrain,
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
  const poolSources: Partial<Record<string, string[]>> = {
    ...skillSources(skillName, rank, charValue),
    difficulty: ['Difficulty', 'Difficulty'],
  };
  applyRollerStatusDice(pool, poolSources, participant.id);
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
    poolSources: poolSources as ModalSnapshot['poolSources'],
    appliedPresets: ['difficulty-average'],
    appliedModifiers: [],
    result: null,
    spent: [],
  };
}

export interface WeaponLike {
  name: string;
  skill: string;
  // For NPC stat-block weapons `damage` is the FINAL value (already includes
  // Brawn for melee). For PC-style entries the underlying bonus is in
  // `plusDamage` and the final value is `wielder.brawn + plusDamage`. Keep
  // both fields so callers can pick the right one for display / rolls.
  damage: number | string;
  plusDamage?: number;
  critical?: number | string;
  crit?: number | string;
  range: string;
  qualities?: string[];
  notes?: string;
}

// Melee skills under SWRPG. Lightsaber's characteristic is variable but it's
// always a "Brawn-class" melee weapon for damage purposes (override may use
// Willpower for the attack roll, but the weapon's damage still adds Brawn).
const MELEE_SKILLS = ['brawl', 'melee', 'lightsaber'];
export function isMeleeWeaponSkill(skill: string | undefined): boolean {
  const s = (skill ?? '').toLowerCase();
  return MELEE_SKILLS.some((m) => s.includes(m));
}

// Resolve the displayed damage for a weapon, given the wielder's Brawn.
// Melee weapons add Brawn to their plusDamage; ranged weapons return their
// damage as-is. Returns a number or, when neither field is set, the string
// "—" so callers can drop it directly into the UI.
export function finalWeaponDamage(weapon: WeaponLike, brawn: number): number | string {
  if (isMeleeWeaponSkill(weapon.skill) && weapon.plusDamage !== undefined) {
    return brawn + weapon.plusDamage;
  }
  if (typeof weapon.damage === 'number') return weapon.damage;
  if (typeof weapon.damage === 'string' && weapon.damage.trim() !== '') return weapon.damage;
  if (weapon.plusDamage !== undefined) return brawn + weapon.plusDamage;
  return '—';
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
export function upgradePoolDifficulty(
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
export function upgradePoolAbility(
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

// Add N difficulty dice to the pool with the given source label.
function addDifficultyToPool(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  count: number,
  label: string,
): void {
  if (count <= 0) return;
  pool.difficulty = (pool.difficulty ?? 0) + count;
  sources.difficulty = [...(sources.difficulty ?? []), ...Array(count).fill(label)];
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

// Statuses on the roller that change their own dice. Disoriented N adds N
// Setback to every check the participant makes (CRB p. 220 / Disorient
// quality). Labelled per status so the pool tooltip says why.
function applyRollerStatusDice(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  participantId: string,
): void {
  for (const e of useEffectStore.getState().effects) {
    if (e.target.type !== 'character' || e.target.participantId !== participantId) continue;
    if (e.effect.status === 'disoriented') {
      const rank = e.effect.rank ?? 1;
      addSetbackToPool(pool, sources, rank, `Disoriented ${rank}`);
    }
  }
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
  targetVehicleId: string | null,
): void {
  if (!targetVehicleId) return;
  const vehicle = useActiveVehicleStore.getState().vehicles[targetVehicleId];
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

type ResolvedAttackTarget =
  | { kind: 'vehicle'; vehicle: ActiveVehicle; viaParticipant?: Participant }
  | { kind: 'character'; participant: Participant }
  | { kind: 'none' };

/** Decide what the attack actually points at, given the GM's selection state
 * and the kind of weapon being fired. Vehicle weapons prefer the vehicle:
 * direct vehicle selection wins; otherwise a selected character's
 * `equippedVehicleId` is followed; otherwise fall back to the character.
 * Personal weapons always target the selected character (or nothing). */
export function resolveAttackTarget(weaponKind: 'personal' | 'vehicle'): ResolvedAttackTarget {
  const ps = useParticipantStore.getState();
  const avs = useActiveVehicleStore.getState();
  const selectedParticipant = ps.selectedParticipantId
    ? ps.participants.find((p) => p.id === ps.selectedParticipantId)
    : undefined;

  if (weaponKind === 'vehicle') {
    if (avs.selectedVehicleId) {
      const vehicle = avs.vehicles[avs.selectedVehicleId];
      if (vehicle) return { kind: 'vehicle', vehicle };
    }
    if (selectedParticipant?.equippedVehicleId) {
      const vehicle = avs.vehicles[selectedParticipant.equippedVehicleId];
      if (vehicle) return { kind: 'vehicle', vehicle, viaParticipant: selectedParticipant };
    }
    if (selectedParticipant) return { kind: 'character', participant: selectedParticipant };
    return { kind: 'none' };
  }

  // personal: only character targets are meaningful.
  if (selectedParticipant) return { kind: 'character', participant: selectedParticipant };
  return { kind: 'none' };
}

/** Reverse "upgrade" entries (difficulty → challenge) labeled by `isLabel`:
 * for each matching entry in `sources.challenge`, decrement `pool.challenge`
 * and re-add a difficulty die (with a generic 'Difficulty' source). Used to
 * undo `applyVehicleTargetModifiers` upgrades and `applyAdversaryUpgrade`. */
function reverseUpgradeBy(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  isLabel: (label: string) => boolean,
): void {
  const chalArr = sources.challenge ?? [];
  if (chalArr.length === 0) return;
  const kept: string[] = [];
  let restored = 0;
  for (const label of chalArr) {
    if (isLabel(label)) restored++;
    else kept.push(label);
  }
  if (restored === 0) return;
  if (kept.length === 0) delete sources.challenge;
  else sources.challenge = kept;
  const nextChal = Math.max(0, (pool.challenge ?? 0) - restored);
  if (nextChal === 0) delete pool.challenge;
  else pool.challenge = nextChal;
  pool.difficulty = (pool.difficulty ?? 0) + restored;
  sources.difficulty = [
    ...(sources.difficulty ?? []),
    ...Array(restored).fill('Difficulty'),
  ];
}

/** Reverse "add" entries (free-standing dice of a given type) labeled by
 * `isLabel`: drops matching source entries and decrements the pool count. */
function reverseAddBy(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  dieKey: DieType,
  isLabel: (label: string) => boolean,
): void {
  const arr = sources[dieKey] ?? [];
  if (arr.length === 0) return;
  const kept = arr.filter((l) => !isLabel(l));
  const removed = arr.length - kept.length;
  if (removed === 0) return;
  if (kept.length === 0) delete sources[dieKey];
  else sources[dieKey] = kept;
  const next = Math.max(0, (pool[dieKey] ?? 0) - removed);
  if (next === 0) delete pool[dieKey];
  else pool[dieKey] = next;
}

/** Fold automatic weapon-quality effects into the attack pool (SWRPG CRB
 * Ch. 5). These are the passive/always-on qualities the GM would otherwise
 * have to remember to apply by hand:
 *   - Accurate N    → +N Boost dice
 *   - Inaccurate N  → +N Setback dice
 *   - Auto-fire     → +1 Difficulty die (the attack is harder to land)
 *   - Cumbersome N  → +(N − wielder Brawn) Setback when underbrawned
 *   - Superior      → an auto-Advantage and +1 damage
 *   - Inferior      → an auto-Threat and -1 damage
 * Pierce / Breach are handled later, at the damage step. Active qualities
 * (Stun, Blast, Knockdown, …) stay in the SpendPanel — they cost symbols.
 * Mutates `pool` / `sources`; returns the damage shift and any auto-symbols. */
function applyWeaponQualityModifiers(
  pool: DicePool,
  sources: Partial<Record<string, string[]>>,
  qualities: SnapshotWeapon['qualities'],
  wielderBrawn: number,
): {damageDelta: number; bonusSymbols: Partial<SymbolTotals>} {
  let damageDelta = 0;
  const bonusSymbols: Partial<SymbolTotals> = {};
  for (const q of qualities) {
    const name = q.name.toLowerCase();
    const rank = q.rank ?? 1;
    if (name === 'accurate') {
      addBoostToPool(pool, sources, rank, `Accurate ${rank}`);
    } else if (name === 'inaccurate') {
      addSetbackToPool(pool, sources, rank, `Inaccurate ${rank}`);
    } else if (name === 'auto-fire') {
      addDifficultyToPool(pool, sources, 1, 'Auto-fire');
    } else if (name === 'cumbersome') {
      const shortfall = Math.max(0, rank - wielderBrawn);
      if (shortfall > 0) {
        addSetbackToPool(pool, sources, shortfall, `Cumbersome ${rank} (Brawn ${wielderBrawn})`);
      }
    } else if (name === 'superior') {
      bonusSymbols.advantage = (bonusSymbols.advantage ?? 0) + 1;
      damageDelta += 1;
    } else if (name === 'inferior') {
      bonusSymbols.threat = (bonusSymbols.threat ?? 0) + 1;
      damageDelta -= 1;
    }
  }
  return {damageDelta, bonusSymbols};
}

export function buildAttackSnapshot(
  participant: Participant,
  weapon: WeaponLike,
  resolvedSkillRank: number,
  resolvedCharacteristic: string,
  resolvedCharValue: number,
  weaponKind: 'personal' | 'vehicle' = 'personal',
): ModalSnapshot {
  const range = normaliseRange(weapon.range);
  const diff = RANGE_DIFFICULTY[range];
  const pool: DicePool = { ...skillPool(resolvedSkillRank, resolvedCharValue), difficulty: diff.count };
  // Melee weapons add the wielder's Brawn to their `plusDamage` to produce
  // the value that goes on the snapshot. finalWeaponDamage handles the
  // ranged-as-is path too, so we always go through it.
  const wielderBrawn = (participant.stats as any)?.brawn ?? 2;
  const finalDmg = finalWeaponDamage(weapon, wielderBrawn);
  const damageValue = typeof finalDmg === 'string' ? parseInt(finalDmg, 10) : finalDmg;
  const critValue = typeof weapon.critical === 'string'
    ? parseInt(weapon.critical, 10)
    : (weapon.critical ?? (typeof weapon.crit === 'string' ? parseInt(weapon.crit, 10) : weapon.crit) ?? 0);

  let resolved = resolveAttackTarget(weaponKind);
  // The selection often still points at the attacker (the GM just clicked
  // them to act). Attacking yourself is never the intent — start untargeted
  // and let the GM pick in the roller header.
  if (resolved.kind === 'character' && resolved.participant.id === participant.id) {
    resolved = { kind: 'none' };
  }

  const poolSources: Partial<Record<string, string[]>> = {
    ...skillSources(weapon.skill || 'weapon', resolvedSkillRank, resolvedCharValue),
    difficulty: Array(diff.count).fill('Difficulty'),
  };

  // Fold the weapon's automatic qualities into the pool before target-side
  // modifiers — they're properties of the weapon itself. Cumbersome reads
  // the wielder's Brawn, so pass it through.
  const parsedQualities = parseQualities(weapon.qualities);
  const {damageDelta, bonusSymbols} = applyWeaponQualityModifiers(
    pool,
    poolSources,
    parsedQualities,
    wielderBrawn,
  );

  // Target-side modifiers depend on which kind of target we resolved to.
  // Adversary upgrade reads talents, so it only fires for character targets.
  if (resolved.kind === 'character') {
    applyAdversaryUpgrade(pool, poolSources, resolved.participant.stats?.talents);
  } else if (resolved.kind === 'vehicle') {
    applyVehicleTargetModifiers(pool, poolSources, resolved.vehicle.id);
  }
  applyOwnVehicleAttackModifiers(pool, poolSources, participant);
  applyRollerStatusDice(pool, poolSources, participant.id);

  // Compose the target id / display fields from the resolved kind.
  const targetParticipantId = resolved.kind === 'character' ? resolved.participant.id : undefined;
  const targetVehicleId = resolved.kind === 'vehicle' ? resolved.vehicle.id : undefined;
  const targetVehicleName = resolved.kind === 'vehicle' ? resolved.vehicle.name : undefined;
  const target = resolved.kind === 'character'
    ? snapshotTargetFromParticipant(resolved.participant)
    : undefined;

  // Persistent toggle candidates: only populated when the resolution included
  // both a participant *and* their vehicle (the GM selected a person aboard a
  // ship, we routed to the ship). Lets the modal flip between the two
  // without re-querying selection state.
  const targetCandidateParticipantId = resolved.kind === 'vehicle' && resolved.viaParticipant
    ? resolved.viaParticipant.id
    : undefined;
  const targetCandidateVehicleId = resolved.kind === 'vehicle' && resolved.viaParticipant
    ? resolved.vehicle.id
    : undefined;

  return {
    id: nanoid(),
    label: `${participant.name} — ${weapon.name}`,
    mode: 'combat',
    difficultyLabel: diff.label,
    attacker: snapshotAttackerFromParticipant(participant),
    attackerParticipantId: participant.id,
    targetParticipantId,
    targetVehicleId,
    targetVehicleName,
    weaponKind,
    targetCandidateParticipantId,
    targetCandidateVehicleId,
    target,
    skill: weapon.skill,
    characteristic: resolvedCharacteristic,
    weapon: {
      name: weapon.name,
      skill: weapon.skill,
      damage: Number.isFinite(damageValue)
        ? Math.max(0, (damageValue as number) + damageDelta)
        : 0,
      crit: Number.isFinite(critValue as number) ? (critValue as number) : 0,
      range,
      baseRange: range,
      qualities: parsedQualities,
    },
    pool,
    poolSources: poolSources as ModalSnapshot['poolSources'],
    ...(Object.keys(bonusSymbols).length > 0 ? {bonusSymbols} : {}),
    appliedPresets: [diff.presetId],
    appliedModifiers: [],
    result: null,
    spent: [],
  };
}

/** Flip the resolved attack target between the vehicle and the character it
 * carries (when both candidates are stored on the snapshot). Strips the
 * vehicle-target modifier dice contributed for the previous target, then
 * re-applies target-side modifiers for the new target. The GM's manual
 * additions, applied modifier toggles, range presets, and bonus symbols are
 * left untouched. Returns a new snapshot; pass it to `update` or `set`. */
export function flipAttackTarget(
  snapshot: ModalSnapshot,
  newKind: 'vehicle' | 'character',
): ModalSnapshot {
  const candidateParticipantId = snapshot.targetCandidateParticipantId;
  const candidateVehicleId = snapshot.targetCandidateVehicleId;
  if (!candidateParticipantId || !candidateVehicleId) return snapshot;

  const ps = useParticipantStore.getState();
  const avs = useActiveVehicleStore.getState();
  const candidateParticipant = ps.participants.find((p) => p.id === candidateParticipantId);
  const candidateVehicle = avs.vehicles[candidateVehicleId];
  if (!candidateParticipant || !candidateVehicle) return snapshot;

  const pool: DicePool = { ...snapshot.pool };
  const sources: Partial<Record<string, string[]>> = {};
  for (const k of Object.keys(snapshot.poolSources ?? {}) as DieType[]) {
    const arr = (snapshot.poolSources ?? {})[k];
    if (arr) sources[k] = [...arr];
  }

  // Reverse whichever target-side modifiers were in the pool. Both the
  // vehicle-target and adversary upgrades are difficulty→challenge upgrades,
  // so they both unwind via `reverseUpgradeBy`. Boost Shields is the lone
  // free-add modifier and unwinds with `reverseAddBy`.
  reverseUpgradeBy(pool, sources, (l) => VEHICLE_TARGET_UPGRADE_LABELS.has(l));
  reverseAddBy(pool, sources, 'setback', (l) => VEHICLE_TARGET_ADD_SETBACK_LABELS.has(l));
  reverseUpgradeBy(pool, sources, (l) => /^Adversary\s+\d+$/i.test(l));

  if (newKind === 'character') {
    applyAdversaryUpgrade(pool, sources, candidateParticipant.stats?.talents);
  } else {
    applyVehicleTargetModifiers(pool, sources, candidateVehicle.id);
  }

  return {
    ...snapshot,
    pool,
    poolSources: sources as ModalSnapshot['poolSources'],
    targetParticipantId: newKind === 'character' ? candidateParticipant.id : undefined,
    targetVehicleId: newKind === 'vehicle' ? candidateVehicle.id : undefined,
    targetVehicleName: newKind === 'vehicle' ? candidateVehicle.name : undefined,
    target: newKind === 'character' ? snapshotTargetFromParticipant(candidateParticipant) : undefined,
    // Editing target invalidates any prior roll — same convention as pool edits.
    result: null,
    spent: [],
  };
}

/** Point an attack at a different participant (or at nobody). Unwinds every
 * target-side modifier the previous target contributed — Adversary upgrades
 * and vehicle-target dice — then applies the new target's Adversary talent.
 * Manual additions, modifier toggles and range presets stay. Any prior roll
 * is invalidated, same as a pool edit. */
export function retargetAttack(
  snapshot: ModalSnapshot,
  participantId: string | null,
): ModalSnapshot {
  const ps = useParticipantStore.getState();
  const next = participantId ? ps.participants.find((p) => p.id === participantId) : undefined;
  if (participantId && !next) return snapshot;

  const pool: DicePool = { ...snapshot.pool };
  const sources: Partial<Record<string, string[]>> = {};
  for (const k of Object.keys(snapshot.poolSources ?? {}) as DieType[]) {
    const arr = (snapshot.poolSources ?? {})[k];
    if (arr) sources[k] = [...arr];
  }
  reverseUpgradeBy(pool, sources, (l) => VEHICLE_TARGET_UPGRADE_LABELS.has(l));
  reverseAddBy(pool, sources, 'setback', (l) => VEHICLE_TARGET_ADD_SETBACK_LABELS.has(l));
  reverseUpgradeBy(pool, sources, (l) => /^Adversary\s+\d+$/i.test(l));

  if (next) applyAdversaryUpgrade(pool, sources, next.stats?.talents);

  return {
    ...snapshot,
    pool,
    poolSources: sources as ModalSnapshot['poolSources'],
    targetParticipantId: next?.id,
    target: next ? snapshotTargetFromParticipant(next) : undefined,
    // A hand-picked character target drops any ship routing and the
    // [Ship|Pilot] toggle that came with it.
    targetVehicleId: undefined,
    targetVehicleName: undefined,
    targetCandidateParticipantId: undefined,
    targetCandidateVehicleId: undefined,
    result: null,
    spent: [],
  };
}
