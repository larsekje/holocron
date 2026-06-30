/**
 * Type definitions for adversary data from the JSON file
 */

export interface Adversary {
  name: string;
  type: 'Minion' | 'Rival' | 'Nemesis';
  // True for unique/named characters (Mace Windu, Han Solo). The random-add buttons
  // skip these and only surface generic profiles.
  named?: boolean;
  description?: string;
  notes?: string;
  /** Classification taxonomy (v5), present in adversaries.json:
   *  - factions: allegiance bloc(s) — the 14-value list
   *  - archetype: broad 6-bucket roll-up (Combatant / Social / Creature /
   *    Specialist / Force / Civilian), derived from coreArchetype
   *  - coreArchetype: Role — the specific job (31 values)
   *  - traits: Profile — behavioural flavor (partially derived) */
  factions?: string[];
  archetype?: string;
  coreArchetype?: string;
  traits?: string[];
  characteristics: {
    Brawn: number;
    Agility: number;
    Intellect: number;
    Cunning: number;
    Willpower: number;
    Presence: number;
  };
  derived: {
    soak: number;
    wounds: number;
    strain?: number;
    defense?: [number, number]; // [melee, ranged]
  };
  skills: Record<string, number>;
  talents?: string[];
  abilities?: string[];
  weapons?: string[];
  gear?: string[];
  tags?: string[];
}
