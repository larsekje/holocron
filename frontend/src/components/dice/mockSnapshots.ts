import type { DicePool, RollResult, NetResult, SymbolTotals, DieType } from '@/engine/diceEngine';

export type DiceRollMode = 'basic' | 'opposed' | 'combat' | 'skillChallenge';

export interface SnapshotAttacker {
  name: string;
  characteristics: Record<string, number>;
  skills: Record<string, number>;
}

export interface SnapshotTarget {
  name: string;
  soak: number;
  meleeDef: number;
  rangedDef: number;
  wounds: number;
  woundThreshold: number;
}

export interface SnapshotWeapon {
  name: string;
  skill: string;
  damage: number;
  crit: number;
  range: 'engaged' | 'short' | 'medium' | 'long' | 'extreme';
  /** The weapon's natural maximum reach. Stable across shot-range changes —
   * `range` mutates as the GM picks a target band, but `baseRange` stays put
   * so the range list can dim tiers beyond the weapon's reach. */
  baseRange?: 'engaged' | 'short' | 'medium' | 'long' | 'extreme';
  qualities: { name: string; rank?: number }[];
}

export interface SnapshotDefender {
  name: string;
  characteristic: string;
  characteristicValue: number;
  skill: string;
  skillRank: number;
}

export interface ModalSnapshot {
  id: string;
  label: string;
  mode: DiceRollMode;
  difficultyLabel?: string;
  attacker?: SnapshotAttacker;
  /** Stable id of the attacker participant — used by spend callbacks
   * (recover strain, suffer strain, etc.) to mutate the right entry in
   * participantsStore. Optional for freestanding rolls with no character. */
  attackerParticipantId?: string;
  target?: SnapshotTarget;
  /** Stable id of the target participant. Optional for non-combat rolls.
   * Mutually exclusive with `targetVehicleId` — at most one is set. */
  targetParticipantId?: string;
  /** Stable id of the target vehicle when a vehicle weapon is fired at a
   * ship (either directly selected, or resolved from a character target who
   * is aboard a vehicle). When set, `target` is undefined and damage routes
   * to hull rather than wounds. */
  targetVehicleId?: string;
  /** Cheap denormalised vehicle name so the modal header doesn't have to
   * subscribe to the vehicle store on every render. */
  targetVehicleName?: string;
  /** 'vehicle' for vehicle-weapon attacks, 'personal' otherwise. Drives the
   * visibility of the [Pilot|Ship] target toggle in the modal header and
   * the re-derivation logic when the toggle flips. */
  weaponKind?: 'personal' | 'vehicle';
  /** Persistent linkage for the [Pilot|Ship] toggle. Populated once at build
   * time when a vehicle weapon resolves to a vehicle target *via* a selected
   * character (i.e. the GM clicked a person, we routed to their ship). The
   * toggle swaps `targetParticipantId` ↔ `targetVehicleId` between the
   * candidates without mutating these. Both undefined → no toggle. */
  targetCandidateParticipantId?: string;
  targetCandidateVehicleId?: string;
  defender?: SnapshotDefender;
  weapon?: SnapshotWeapon;
  skill?: string;
  characteristic?: string;
  pool: DicePool;
  /** Per-die source labels for tooltip provenance ("Skill (Streetwise)",
   * "Range: Medium", "Aim", "Pouch from Pash"). Each array's length is
   * expected to match pool[die] — i-th die of type X comes from i-th source. */
  poolSources?: Partial<Record<DieType, string[]>>;
  /** Raw symbols added to the roll without rolling a die — gifts from allies,
   * GM-granted bonuses, etc. Folded into the result on roll(). */
  bonusSymbols?: Partial<SymbolTotals>;
  appliedPresets: string[];
  /** IDs of toggled-on entries from the Modifiers popover (table 2-7 / 2-8). */
  appliedModifiers: string[];
  result: RollResult | null;
  spent: { optionId: string; recipientId?: string }[];
}

const EMPTY: SymbolTotals = {
  success: 0, failure: 0, advantage: 0, threat: 0,
  triumph: 0, despair: 0, light: 0, dark: 0,
};

function expandRolls(pool: DicePool) {
  const rolls = [];
  for (const [die, count] of Object.entries(pool) as [DieType, number][]) {
    for (let i = 0; i < (count ?? 0); i++) {
      rolls.push({ die, faceIndex: 0, symbols: { ...EMPTY } });
    }
  }
  return rolls;
}

function netFromRaw(raw: SymbolTotals): NetResult {
  const netSuccess = (raw.success + raw.triumph) - (raw.failure + raw.despair);
  const netAdvantage = raw.advantage - raw.threat;
  return {
    netSuccess,
    netAdvantage,
    triumph: raw.triumph,
    despair: raw.despair,
    light: raw.light,
    dark: raw.dark,
    succeeded: netSuccess > 0,
  };
}

function makeResult(pool: DicePool, raw: Partial<SymbolTotals>): RollResult {
  const fullRaw: SymbolTotals = { ...EMPTY, ...raw };
  return {
    pool,
    rolls: expandRolls(pool),
    raw: fullRaw,
    net: netFromRaw(fullRaw),
  };
}

const PASH: SnapshotAttacker = {
  name: 'Pash',
  characteristics: { brawn: 2, agility: 3, intellect: 2, cunning: 3, willpower: 2, presence: 3 },
  skills: { streetwise: 2, deception: 2, rangedLight: 2, perception: 1, vigilance: 1 },
};

const STORMTROOPER: SnapshotTarget = {
  name: 'Stormtrooper',
  soak: 4,
  meleeDef: 0,
  rangedDef: 1,
  wounds: 0,
  woundThreshold: 5,
};

const HEAVY_BLASTER_PISTOL: SnapshotWeapon = {
  name: 'Heavy Blaster Pistol',
  skill: 'Ranged (Light)',
  damage: 7,
  crit: 3,
  range: 'medium',
  baseRange: 'medium',
  qualities: [{ name: 'Stun Setting' }],
};

const SERGEANT_DEFENDER: SnapshotDefender = {
  name: 'Imperial Sergeant',
  characteristic: 'willpower',
  characteristicValue: 3,
  skill: 'vigilance',
  skillRank: 2,
};

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

const basicPool: DicePool = { ability: 1, proficiency: 2, difficulty: 2 };

const basicUnrolled: ModalSnapshot = {
  id: 'basic-unrolled',
  label: 'Basic — unrolled (Streetwise, Average)',
  mode: 'basic',
  difficultyLabel: 'Average',
  attacker: PASH,
  skill: 'streetwise',
  characteristic: 'cunning',
  pool: basicPool,
  appliedPresets: ['difficulty-average'],
  appliedModifiers: [],
  result: null,
  spent: [],
};

const basicSuccess: ModalSnapshot = {
  ...basicUnrolled,
  id: 'basic-success',
  label: 'Basic — rolled, 2 successes + 1 advantage',
  result: makeResult(basicPool, { success: 3, failure: 1, advantage: 2, threat: 1 }),
};

const basicFailureAdv: ModalSnapshot = {
  ...basicUnrolled,
  id: 'basic-failure-with-advantages',
  label: 'Basic — failed but 3 advantages',
  result: makeResult(basicPool, { success: 1, failure: 2, advantage: 3 }),
};

const basicTriumph: ModalSnapshot = {
  ...basicUnrolled,
  id: 'basic-triumph',
  label: 'Basic — success + triumph',
  result: makeResult(basicPool, { success: 1, triumph: 1, advantage: 0 }),
};

const basicMidSpend: ModalSnapshot = {
  ...basicSuccess,
  id: 'basic-mid-spend',
  label: 'Basic — mid-spend (2 strain recovered)',
  spent: [{ optionId: 'recover-strain' }, { optionId: 'recover-strain' }],
};

// Freestanding rolls — no character / skill context attached. Validates that the
// modal renders cleanly when opened without a triggering entity (e.g. GM scratch roll).
const basicFreestanding: ModalSnapshot = {
  id: 'basic-freestanding',
  label: 'Basic — freestanding (no character)',
  mode: 'basic',
  difficultyLabel: 'Average',
  pool: { ability: 2, difficulty: 2 },
  appliedPresets: ['difficulty-average'],
  appliedModifiers: [],
  result: null,
  spent: [],
};

const basicEmpty: ModalSnapshot = {
  id: 'basic-empty',
  label: 'Basic — empty pool',
  mode: 'basic',
  pool: {},
  appliedPresets: [],
  appliedModifiers: [],
  result: null,
  spent: [],
};

// ---------------------------------------------------------------------------
// Opposed
// ---------------------------------------------------------------------------

const opposedPool: DicePool = {
  ability: 1, proficiency: 2,
  difficulty: 1, challenge: 2,
};

const opposedUnrolled: ModalSnapshot = {
  id: 'opposed-unrolled',
  label: 'Opposed — Pash Deception vs Sergeant Vigilance',
  mode: 'opposed',
  attacker: PASH,
  skill: 'deception',
  characteristic: 'cunning',
  defender: SERGEANT_DEFENDER,
  pool: opposedPool,
  appliedPresets: [],
  appliedModifiers: [],
  result: null,
  spent: [],
};

const opposedRolledSuccess: ModalSnapshot = {
  ...opposedUnrolled,
  id: 'opposed-rolled-success',
  label: 'Opposed — rolled, narrow success + threat',
  result: makeResult(opposedPool, { success: 2, failure: 1, advantage: 1, threat: 2 }),
};

// ---------------------------------------------------------------------------
// Combat
// ---------------------------------------------------------------------------

const combatPool: DicePool = {
  ability: 1, proficiency: 2,
  difficulty: 2,
  setback: 1,
};

const combatUnrolled: ModalSnapshot = {
  id: 'combat-unrolled',
  label: 'Combat — unrolled (heavy blaster pistol vs Stormtrooper)',
  mode: 'combat',
  attacker: PASH,
  weapon: HEAVY_BLASTER_PISTOL,
  target: STORMTROOPER,
  skill: 'rangedLight',
  characteristic: 'agility',
  difficultyLabel: 'Average',
  pool: combatPool,
  appliedPresets: ['difficulty-average', 'range-medium'],
  appliedModifiers: [],
  result: null,
  spent: [],
};

const combatHit: ModalSnapshot = {
  ...combatUnrolled,
  id: 'combat-hit',
  label: 'Combat — hit (3 success, 2 advantage)',
  result: makeResult(combatPool, { success: 3, advantage: 2, threat: 0 }),
};

const combatMiss: ModalSnapshot = {
  ...combatUnrolled,
  id: 'combat-miss',
  label: 'Combat — miss (1 threat)',
  result: makeResult(combatPool, { success: 1, failure: 2, threat: 1 }),
};

const combatCritEligible: ModalSnapshot = {
  ...combatUnrolled,
  id: 'combat-crit-eligible',
  label: 'Combat — hit + triumph (crit eligible)',
  result: makeResult(combatPool, { success: 2, triumph: 1, advantage: 1 }),
};

const combatMidSpend: ModalSnapshot = {
  ...combatHit,
  id: 'combat-mid-spend',
  label: 'Combat — mid-spend (Stun Setting activated)',
  spent: [{ optionId: 'activate-stun-setting' }],
};

// ---------------------------------------------------------------------------
// Skill challenge placeholder
// ---------------------------------------------------------------------------

const skillChallengePlaceholder: ModalSnapshot = {
  id: 'skill-challenge-placeholder',
  label: 'Skill Challenge — placeholder',
  mode: 'skillChallenge',
  attacker: PASH,
  pool: {},
  appliedPresets: [],
  appliedModifiers: [],
  result: null,
  spent: [],
};

export const SNAPSHOTS: ModalSnapshot[] = [
  basicUnrolled,
  basicSuccess,
  basicFailureAdv,
  basicTriumph,
  basicMidSpend,
  basicFreestanding,
  basicEmpty,
  opposedUnrolled,
  opposedRolledSuccess,
  combatUnrolled,
  combatHit,
  combatMiss,
  combatCritEligible,
  combatMidSpend,
  skillChallengePlaceholder,
];

export const SNAPSHOTS_BY_MODE: Record<DiceRollMode, ModalSnapshot[]> = {
  basic: SNAPSHOTS.filter((s) => s.mode === 'basic'),
  opposed: SNAPSHOTS.filter((s) => s.mode === 'opposed'),
  combat: SNAPSHOTS.filter((s) => s.mode === 'combat'),
  skillChallenge: SNAPSHOTS.filter((s) => s.mode === 'skillChallenge'),
};
