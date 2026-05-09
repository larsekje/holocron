// Sourced from Holocron v2 (PDF pages 34-36):
//  - Table 2-2: Maneuvers
//  - Table 2-7: Combat Modifiers
//  - Table 2-8: Environmental Effects
// Each entry's `effect` describes what toggling it does to the current pool.
// Modifiers with empty `effect` are informational reminders only (no pool
// change) — included so the GM has the full reference at the table.

import type { DiceRollMode } from './mockSnapshots';

export type ModifierCategory = 'maneuver' | 'combat' | 'environmental';

export interface ModifierEntry {
  id: string;
  label: string;
  description: string;
  category: ModifierCategory;
  /** Which roll modes this modifier is relevant to. 'any' shows everywhere. */
  modes: (DiceRollMode | 'any')[];
  /** Pool delta applied when toggled on, reversed when toggled off. */
  effect: {
    boost?: number;
    setback?: number;
    difficulty?: number;
    ability?: number;
  };
}

export const MODIFIERS: ModifierEntry[] = [
  // ---- Maneuvers (table 2-2) -------------------------------------------
  {
    id: 'aim-1',
    label: 'Aim (1 maneuver)',
    description: 'Add 1 Boost to next combat check.',
    category: 'maneuver',
    modes: ['combat'],
    effect: { boost: 1 },
  },
  {
    id: 'aim-2',
    label: 'Aim (2 maneuvers)',
    description: 'Two consecutive Aim maneuvers add 2 Boost to next combat check.',
    category: 'maneuver',
    modes: ['combat'],
    effect: { boost: 2 },
  },
  {
    id: 'aim-specific',
    label: 'Aim — specific part / item',
    description: 'Target a specific part of target or item carried. Adds 2 Setback to your check.',
    category: 'maneuver',
    modes: ['combat'],
    effect: { setback: 2 },
  },
  {
    id: 'assist',
    label: 'Assisted by ally',
    description: 'Add 1 Boost per engaged ally that used the Assist maneuver.',
    category: 'maneuver',
    modes: ['any'],
    effect: { boost: 1 },
  },
  {
    id: 'guarded-stance',
    label: 'You are in Guarded Stance',
    description: 'Add 1 Setback to all combat checks until end of next turn (you gain +1 melee defense).',
    category: 'maneuver',
    modes: ['combat'],
    effect: { setback: 1 },
  },

  // ---- Combat modifiers (table 2-7) ------------------------------------
  {
    id: 'prone-target-ranged',
    label: 'Prone target — ranged attack',
    description: 'Add 1 Setback when shooting a prone target.',
    category: 'combat',
    modes: ['combat'],
    effect: { setback: 1 },
  },
  {
    id: 'prone-target-melee',
    label: 'Prone target — melee attack',
    description: 'Add 1 Boost to melee attacks against a prone target.',
    category: 'combat',
    modes: ['combat'],
    effect: { boost: 1 },
  },
  {
    id: 'prone-attacker',
    label: 'You are prone',
    description: 'Add 1 Setback to your melee combat checks while prone.',
    category: 'combat',
    modes: ['combat'],
    effect: { setback: 1 },
  },
  {
    id: 'engaged-ranged-attacker',
    label: 'Engaged with a ranged attacker',
    description: 'Add 1 Boost to next melee check against a ranged attacker remaining engaged.',
    category: 'combat',
    modes: ['combat'],
    effect: { boost: 1 },
  },
  {
    id: 'target-guarded-stance',
    label: 'Target in Guarded Stance',
    description: 'Add 1 Setback to melee checks against the target.',
    category: 'combat',
    modes: ['combat'],
    effect: { setback: 1 },
  },
  {
    id: 'two-weapon',
    label: 'Attack with two weapons',
    description: 'Use the higher difficulty of the two weapons; add 1 Difficulty (or 2 if different skills).',
    category: 'combat',
    modes: ['combat'],
    effect: { difficulty: 1 },
  },
  {
    id: 'attack-engaged-ally',
    label: 'Attack into engaged ally',
    description: 'Upgrade difficulty by 1 (rendered here as +1 Difficulty for simplicity).',
    category: 'combat',
    modes: ['combat'],
    effect: { difficulty: 1 },
  },
  {
    id: 'silhouette-large',
    label: 'Target 2+ silhouettes larger',
    description: 'Removes 1 Difficulty when attacking a much larger target.',
    category: 'combat',
    modes: ['combat'],
    effect: { difficulty: -1 },
  },
  {
    id: 'silhouette-small',
    label: 'Target 2+ silhouettes smaller',
    description: 'Adds 1 Difficulty when attacking a much smaller target.',
    category: 'combat',
    modes: ['combat'],
    effect: { difficulty: 1 },
  },

  // ---- Environmental effects (table 2-8) -------------------------------
  {
    id: 'cover',
    label: 'Target has cover',
    description: 'Cover increases ranged defense by 1 (or more for sturdy cover).',
    category: 'environmental',
    modes: ['combat'],
    effect: { setback: 1 },
  },
  {
    id: 'concealment-1',
    label: 'Concealment — light',
    description: 'Mist, shadow, waist-high grass. Add 1 Setback to ranged & Perception checks.',
    category: 'environmental',
    modes: ['any'],
    effect: { setback: 1 },
  },
  {
    id: 'concealment-2',
    label: 'Concealment — medium',
    description: 'Fog, twilight, shoulder-high grass. Add 2 Setback to ranged & Perception checks.',
    category: 'environmental',
    modes: ['any'],
    effect: { setback: 2 },
  },
  {
    id: 'concealment-3',
    label: 'Concealment — heavy',
    description: 'Heavy fog, choking smoke, night, dense underbrush. Add 3 Setback to ranged & Perception.',
    category: 'environmental',
    modes: ['any'],
    effect: { setback: 3 },
  },
  {
    id: 'difficult-terrain',
    label: 'Difficult terrain',
    description: 'Movement costs double maneuvers.',
    category: 'environmental',
    modes: ['any'],
    effect: {},
  },
  {
    id: 'heavy-gravity',
    label: 'Heavy gravity',
    description: 'Up to 3 Setback to Brawn-based skill checks (except Resilience) and Coordination.',
    category: 'environmental',
    modes: ['any'],
    effect: { setback: 1 },
  },
  {
    id: 'light-gravity',
    label: 'Light gravity',
    description: 'Up to 4 Boost to Brawn-based skill checks (except Resilience) and Coordination.',
    category: 'environmental',
    modes: ['any'],
    effect: { boost: 1 },
  },
  {
    id: 'zero-gravity',
    label: 'Zero gravity',
    description: '3D movement, but counts as Difficult Terrain.',
    category: 'environmental',
    modes: ['any'],
    effect: {},
  },
  {
    id: 'dangerous-atmosphere',
    label: 'Dangerous atmosphere',
    description: 'Suffer wounds at the start of each turn equal to atmosphere rating (table 2-11). Hold breath if able.',
    category: 'environmental',
    modes: ['any'],
    effect: {},
  },
  {
    id: 'water',
    label: 'Water / submerged',
    description: 'Counts as Difficult or Impassable Terrain at GM discretion. Hold breath or suffocate if submerged.',
    category: 'environmental',
    modes: ['any'],
    effect: {},
  },
];

export const CATEGORY_LABEL: Record<ModifierCategory, string> = {
  maneuver: 'Maneuvers',
  combat: 'Combat',
  environmental: 'Environment',
};
