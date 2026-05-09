/**
 * Narrative die face tables for SWRPG (FFG Edge of the Empire / Age of Rebellion / Force and Destiny).
 *
 * Source: .claude/skills/swrpg-mechanics/references/dice.md (single source of truth).
 *
 * VERIFICATION STATUS
 * -------------------
 * d6  Boost, Setback       — face counts verified (6 faces each ✓)
 * d8  Ability, Difficulty  — face counts verified (8 faces each ✓)
 * d12 Proficiency, Challenge — skill file lists 10 entries for a 12-sided die; 2 faces are
 *     UNVERIFIED estimates (marked below). See flagged discrepancy in PR description.
 * d12 Force — dice.md defers to force.md; force.md gives only approximate pip totals
 *     (~7 light, ~9 dark). All 12 entries are UNVERIFIED estimates consistent with those totals.
 *     See flagged discrepancy in PR description.
 *
 * Do not edit d12/Force tables without confirming against the physical die or corrected skill file.
 */

export interface SymbolTotals {
  success:   number;
  failure:   number;
  advantage: number;
  threat:    number;
  triumph:   number;
  despair:   number;
  light:     number;
  dark:      number;
}

// ---------------------------------------------------------------------------
// Internal shorthand builders — not exported
// ---------------------------------------------------------------------------

const B: SymbolTotals = { success:0, failure:0, advantage:0, threat:0, triumph:0, despair:0, light:0, dark:0 };

const s  = (n = 1): SymbolTotals => ({ ...B, success: n });
const f  = (n = 1): SymbolTotals => ({ ...B, failure: n });
const a  = (n = 1): SymbolTotals => ({ ...B, advantage: n });
const t  = (n = 1): SymbolTotals => ({ ...B, threat: n });
const sa = (sv = 1, av = 1): SymbolTotals => ({ ...B, success: sv, advantage: av });
const ft = (fv = 1, tv = 1): SymbolTotals => ({ ...B, failure: fv, threat: tv });
const TR: SymbolTotals = { ...B, triumph: 1 };
const DS: SymbolTotals = { ...B, despair: 1 };
const li = (n = 1): SymbolTotals => ({ ...B, light: n });
const dk = (n = 1): SymbolTotals => ({ ...B, dark: n });

// ---------------------------------------------------------------------------
// Boost die — d6 — VERIFIED
// Skill: 2 blank, 1× ✶, 1× ✶⌒, 1× ⌒⌒, 1× ⌒  (6 faces ✓)
// ---------------------------------------------------------------------------
export const BOOST_FACES: readonly SymbolTotals[] = [
  B,    B,
  s(),  sa(), a(2), a(),
];

// ---------------------------------------------------------------------------
// Setback die — d6 — VERIFIED
// Skill: 2 blank, 2× ⊽, 2× ⌓  (6 faces ✓)
// ---------------------------------------------------------------------------
export const SETBACK_FACES: readonly SymbolTotals[] = [
  B,    B,
  f(),  f(),  t(),  t(),
];

// ---------------------------------------------------------------------------
// Ability die — d8 — VERIFIED
// Skill: 1 blank, 2× ✶, 1× ✶✶, 2× ⌒, 1× ✶⌒, 1× ⌒⌒  (8 faces ✓)
// ---------------------------------------------------------------------------
export const ABILITY_FACES: readonly SymbolTotals[] = [
  B,
  s(),  s(),  s(2),
  a(),  a(),  sa(), a(2),
];

// ---------------------------------------------------------------------------
// Difficulty die — d8 — VERIFIED
// Skill: 1 blank, 1× ⊽, 1× ⊽⊽, 3× ⌓, 1× ⌓⌓, 1× ⌓⊽  (8 faces ✓)
// ---------------------------------------------------------------------------
export const DIFFICULTY_FACES: readonly SymbolTotals[] = [
  B,
  f(),  f(2),
  t(),  t(),  t(),  t(2),
  ft(),
];

// ---------------------------------------------------------------------------
// Proficiency die — d12 — PARTIALLY UNVERIFIED
// Skill lists 10 entries; 2 are missing. Verified 10 below; 2 marked UNVERIFIED.
//   Verified: 1 blank, 1× ✶, 2× ✶✶, 2× ✶⌒, 2× ⌒⌒, 1× ⌒, 1× 🏆  (10 faces)
//   UNVERIFIED: 1× ✶ and 1× ✶⌒  (estimated from most common community tables: 2×✶ + 3×✶⌒)
// ---------------------------------------------------------------------------
export const PROFICIENCY_FACES: readonly SymbolTotals[] = [
  // --- verified (10) ---
  B,
  s(),                 // 1× ✶
  s(2),  s(2),        // 2× ✶✶
  sa(),  sa(),        // 2× ✶⌒
  a(2),  a(2),        // 2× ⌒⌒
  a(),                 // 1× ⌒
  TR,                  // 1× 🏆
  // --- UNVERIFIED estimates (2 — fill d12 to 12 faces) ---
  s(),                 // UNVERIFIED: extra ✶
  sa(),                // UNVERIFIED: extra ✶⌒
];

// ---------------------------------------------------------------------------
// Challenge die — d12 — PARTIALLY UNVERIFIED
// Skill lists 10 entries; 2 are missing. Verified 10 below; 2 marked UNVERIFIED.
//   Verified: 1 blank, 1× ⊽, 2× ⊽⊽, 2× ⊽⌓, 2× ⌓⌓, 1× ⌓, 1× 💀  (10 faces)
//   UNVERIFIED: 1× ⊽ and 1× ⊽⌓  (estimated to mirror Proficiency pattern)
// ---------------------------------------------------------------------------
export const CHALLENGE_FACES: readonly SymbolTotals[] = [
  // --- verified (10) ---
  B,
  f(),                 // 1× ⊽
  f(2),  f(2),        // 2× ⊽⊽
  ft(),  ft(),        // 2× ⊽⌓
  t(2),  t(2),        // 2× ⌓⌓
  t(),                 // 1× ⌓
  DS,                  // 1× 💀
  // --- UNVERIFIED estimates (2) ---
  f(),                 // UNVERIFIED: extra ⊽
  ft(),                // UNVERIFIED: extra ⊽⌓
];

// ---------------------------------------------------------------------------
// Force die — d12 — UNVERIFIED
// dice.md incomplete; force.md gives ~7 light pips + ~9 dark pips.
// Table below is mathematically consistent with those totals:
//   6 light-pip faces: 5× {light:1} + 1× {light:2} → 7 light pips
//   6 dark-pip  faces: 3× {dark:1}  + 3× {dark:2}  → 9 dark pips
// TODO: verify face-by-face breakdown against physical die or corrected skill.
// ---------------------------------------------------------------------------
export const FORCE_FACES: readonly SymbolTotals[] = [
  // --- light faces (UNVERIFIED) ---
  li(), li(), li(), li(), li(),  // 5× {light:1}
  li(2),                          // 1× {light:2}
  // --- dark faces (UNVERIFIED) ---
  dk(), dk(), dk(),              // 3× {dark:1}
  dk(2), dk(2), dk(2),           // 3× {dark:2}
];

// ---------------------------------------------------------------------------
// Lookup table — indexed by DieType string (imported by diceEngine.ts)
// ---------------------------------------------------------------------------
export const FACE_TABLES = {
  boost:       BOOST_FACES,
  setback:     SETBACK_FACES,
  ability:     ABILITY_FACES,
  difficulty:  DIFFICULTY_FACES,
  proficiency: PROFICIENCY_FACES,
  challenge:   CHALLENGE_FACES,
  force:       FORCE_FACES,
} as const;

export type DieType = keyof typeof FACE_TABLES;
