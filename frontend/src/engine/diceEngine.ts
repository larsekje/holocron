/**
 * SWRPG narrative dice engine — pure TypeScript, no React, no stores.
 *
 * Public API:
 *   mulberry32(seed)           — seeded RNG for deterministic tests
 *   rollDie(die, rng?)         — roll one die, return face + symbols
 *   rollPool(pool, rng?)       — roll a full dice pool, return raw + net result
 *   resolveNet(raw)            — cancellation math only (no randomness)
 */

import { DieType, FACE_TABLES, SymbolTotals } from './dieFaces';

export type { DieType, SymbolTotals };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RNG = () => number;

/** Counts of each die type in a pool.  Any omitted key = 0 dice of that type. */
export type DicePool = Partial<Record<DieType, number>>;

/** One die's outcome: which face landed plus the symbols it produced. */
export interface DieRoll {
  die:       DieType;
  faceIndex: number;
  symbols:   SymbolTotals;
}

/**
 * Net result after cancellation.
 * - netSuccess > 0  → check succeeds (Triumph/Despair still present regardless)
 * - netAdvantage < 0 → net Threat (abs value is threat count)
 * - triumph / despair pass through uncanceled
 */
export interface NetResult {
  netSuccess:   number;
  netAdvantage: number;
  triumph:      number;
  despair:      number;
  light:        number;
  dark:         number;
  succeeded:    boolean;
}

export interface RollResult {
  pool:  DicePool;
  rolls: DieRoll[];
  raw:   SymbolTotals;
  net:   NetResult;
}

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32)
// ---------------------------------------------------------------------------

/**
 * Returns a deterministic RNG seeded by `seed`.
 * Use in tests: `rollPool(pool, mulberry32(42))` is reproducible across runs.
 */
export function mulberry32(seed: number): RNG {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

// ---------------------------------------------------------------------------
// Engine functions
// ---------------------------------------------------------------------------

/** Roll a single die and return the face that landed. */
export function rollDie(die: DieType, rng: RNG = Math.random): DieRoll {
  const faces = FACE_TABLES[die];
  const faceIndex = Math.floor(rng() * faces.length);
  return { die, faceIndex, symbols: faces[faceIndex] };
}

/**
 * Roll a full dice pool and return raw symbol totals plus the net result.
 * Entry point for the roller UI.
 */
export function rollPool(pool: DicePool, rng: RNG = Math.random): RollResult {
  const rolls: DieRoll[] = [];

  for (const [die, count] of Object.entries(pool) as [DieType, number][]) {
    for (let i = 0; i < count; i++) {
      rolls.push(rollDie(die, rng));
    }
  }

  const raw = sumSymbols(rolls.map(r => r.symbols));
  const net = resolveNet(raw);
  return { pool, rolls, raw, net };
}

/**
 * Pure cancellation math — no randomness involved.
 *
 * Rules (from dice.md):
 *   1. Triumph counts as a Success for cancellation, but its trigger is uncanceled.
 *   2. Despair counts as a Failure for cancellation, but its trigger is uncanceled.
 *   3. Success vs Failure cancel 1-for-1; net >= 1 = check succeeds.
 *   4. Advantage vs Threat cancel 1-for-1.
 *   5. Light / Dark Force pips do not cancel each other.
 */
export function resolveNet(raw: SymbolTotals): NetResult {
  const netSuccess   = (raw.success + raw.triumph) - (raw.failure + raw.despair);
  const netAdvantage = raw.advantage - raw.threat;
  return {
    netSuccess,
    netAdvantage,
    triumph:   raw.triumph,
    despair:   raw.despair,
    light:     raw.light,
    dark:      raw.dark,
    succeeded: netSuccess > 0,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sumSymbols(all: SymbolTotals[]): SymbolTotals {
  return all.reduce(
    (acc, s) => ({
      success:   acc.success   + s.success,
      failure:   acc.failure   + s.failure,
      advantage: acc.advantage + s.advantage,
      threat:    acc.threat    + s.threat,
      triumph:   acc.triumph   + s.triumph,
      despair:   acc.despair   + s.despair,
      light:     acc.light     + s.light,
      dark:      acc.dark      + s.dark,
    }),
    { success:0, failure:0, advantage:0, threat:0, triumph:0, despair:0, light:0, dark:0 },
  );
}
