/**
 * Polyhedral (plain numbered) dice — d4 … d100.
 *
 * Deliberately separate from `diceEngine.ts`, which is the SWRPG *narrative*
 * symbol engine. These dice produce flat 1..N integers with no symbols, no
 * cancellation — a GM convenience for random tables, loot, ad-hoc d20/d100
 * rolls, etc. Reuses `diceEngine`'s RNG type so a seeded RNG can drive both.
 */
import type { RNG } from './diceEngine';

export type PolyDie = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

/** Canonical display/iteration order. */
export const POLY_DICE: PolyDie[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

export const POLY_SIDES: Record<PolyDie, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

/** Counts of each die in the pool. Omitted key = 0 dice of that type. */
export type PolyPool = Partial<Record<PolyDie, number>>;

export interface PolyDieRoll {
  die: PolyDie;
  value: number;
}

export interface PolyRollResult {
  rolls: PolyDieRoll[];
  total: number;
}

/** Roll one die: a uniform integer in [1, sides]. The "d100" is a percentile
 * (tens) d10 — its faces are 00, 10, … 90, so it rolls a multiple of ten. */
export function rollPolyDie(die: PolyDie, rng: RNG = Math.random): number {
  if (die === 'd100') return Math.floor(rng() * 10) * 10;
  return Math.floor(rng() * POLY_SIDES[die]) + 1;
}

/** Roll a whole pool, grouped in canonical die order, returning each die's
 * value plus the summed total. */
export function rollPolyPool(pool: PolyPool, rng: RNG = Math.random): PolyRollResult {
  const rolls: PolyDieRoll[] = [];
  for (const die of POLY_DICE) {
    const count = pool[die] ?? 0;
    for (let i = 0; i < count; i++) {
      rolls.push({ die, value: rollPolyDie(die, rng) });
    }
  }
  const total = rolls.reduce((sum, r) => sum + r.value, 0);
  return { rolls, total };
}
