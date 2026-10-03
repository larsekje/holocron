// Table-side rules reference: the skill list and the maneuver / range-band
// rules, phrased for a GM mid-session. Skill names, characteristics and
// groups match OggDude's Skills.xml; the one-liners and "opposed by" hints
// are summaries of the Edge of the Empire core rules, not rulebook text.

export type SkillGroup = 'General' | 'Combat' | 'Knowledge';
export type CharacteristicKey = 'Brawn' | 'Agility' | 'Intellect' | 'Cunning' | 'Willpower' | 'Presence';

export interface SkillRef {
  name: string;
  characteristic: CharacteristicKey;
  group: SkillGroup;
  use: string;
  /** Typical opposing skill when the check is against a person. */
  opposedBy?: string;
  /** For defensive skills: what they're rolled to resist. */
  resists?: string;
}

export const SKILLS: SkillRef[] = [
  // General
  { name: 'Astrogation', characteristic: 'Intellect', group: 'General', use: 'Plot hyperspace jumps, read star charts, know the routes.' },
  { name: 'Athletics', characteristic: 'Brawn', group: 'General', use: 'Climb, swim, jump, run hard, force something open.', opposedBy: 'Athletics (contests of strength)' },
  { name: 'Charm', characteristic: 'Presence', group: 'General', use: 'Flatter, seduce, win someone over honestly.', opposedBy: 'Cool' },
  { name: 'Coercion', characteristic: 'Willpower', group: 'General', use: 'Threaten, intimidate, interrogate.', opposedBy: 'Discipline' },
  { name: 'Computers', characteristic: 'Intellect', group: 'General', use: 'Slice systems, dig through records, bypass security programs.', opposedBy: 'Computers (rival slicer)' },
  { name: 'Cool', characteristic: 'Presence', group: 'General', use: 'Keep calm under pressure; initiative when ready.', resists: 'Charm' },
  { name: 'Coordination', characteristic: 'Agility', group: 'General', use: 'Balance, squeeze through, escape bonds, land a fall.' },
  { name: 'Deception', characteristic: 'Cunning', group: 'General', use: 'Lie, bluff, disguise, misdirect.', opposedBy: 'Discipline' },
  { name: 'Discipline', characteristic: 'Willpower', group: 'General', use: 'Hold it together against fear, pain, lies and threats.', resists: 'Coercion, Deception' },
  { name: 'Leadership', characteristic: 'Presence', group: 'General', use: 'Rally allies, give orders, inspire a crowd.', opposedBy: 'Discipline' },
  { name: 'Mechanics', characteristic: 'Intellect', group: 'General', use: 'Repair and modify droids, ships, gear; jury-rig.' },
  { name: 'Medicine', characteristic: 'Intellect', group: 'General', use: 'Heal wounds and critical injuries, treat poison.' },
  { name: 'Negotiation', characteristic: 'Presence', group: 'General', use: 'Haggle, make deals, buy and sell.', opposedBy: 'Negotiation' },
  { name: 'Perception', characteristic: 'Cunning', group: 'General', use: 'Notice things, search a room, spot someone hiding.', resists: 'Stealth, Skulduggery' },
  { name: 'Piloting - Planetary', characteristic: 'Agility', group: 'General', use: 'Fly or drive anything in atmosphere — speeders, airspeeders.', opposedBy: 'Piloting (chases)' },
  { name: 'Piloting - Space', characteristic: 'Agility', group: 'General', use: 'Fly starships and starfighters.', opposedBy: 'Piloting (chases)' },
  { name: 'Resilience', characteristic: 'Brawn', group: 'General', use: 'Endure poison, hunger, heat, sleeplessness.' },
  { name: 'Skulduggery', characteristic: 'Cunning', group: 'General', use: 'Pick locks and pockets, set traps, sneak contraband.', opposedBy: 'Perception' },
  { name: 'Stealth', characteristic: 'Agility', group: 'General', use: 'Sneak, hide, tail someone unseen.', opposedBy: 'Perception / Vigilance' },
  { name: 'Streetwise', characteristic: 'Cunning', group: 'General', use: 'Find a fence, read the street, know who runs what.' },
  { name: 'Survival', characteristic: 'Cunning', group: 'General', use: 'Track, forage, navigate wilds, handle animals.' },
  { name: 'Vigilance', characteristic: 'Willpower', group: 'General', use: 'Stay alert; initiative when surprised.', resists: 'Stealth' },
  // Combat
  { name: 'Brawl', characteristic: 'Brawn', group: 'Combat', use: 'Unarmed fighting.' },
  { name: 'Gunnery', characteristic: 'Agility', group: 'Combat', use: 'Vehicle- and emplacement-mounted weapons.' },
  { name: 'Lightsaber', characteristic: 'Brawn', group: 'Combat', use: 'Lightsaber attacks (form talents can swap the characteristic).' },
  { name: 'Melee', characteristic: 'Brawn', group: 'Combat', use: 'Melee weapons — vibroknives, staffs, improvised weapons.' },
  { name: 'Ranged - Heavy', characteristic: 'Agility', group: 'Combat', use: 'Rifles, carbines, heavy repeaters, launchers.' },
  { name: 'Ranged - Light', characteristic: 'Agility', group: 'Combat', use: 'Pistols, holdouts, thrown weapons.' },
  // Knowledge
  { name: 'Core Worlds', characteristic: 'Intellect', group: 'Knowledge', use: 'Customs, politics and places of the Core.' },
  { name: 'Education', characteristic: 'Intellect', group: 'Knowledge', use: 'Academic learning, science, history.' },
  { name: 'Lore', characteristic: 'Intellect', group: 'Knowledge', use: 'Myths, ancient history, the Jedi and Sith.' },
  { name: 'Outer Rim', characteristic: 'Intellect', group: 'Knowledge', use: 'Worlds, peoples and dangers of the Rim.' },
  { name: 'Underworld', characteristic: 'Intellect', group: 'Knowledge', use: 'Crime syndicates, smugglers, the black market.' },
  { name: 'Warfare', characteristic: 'Intellect', group: 'Knowledge', use: 'Tactics, military history, unit organisation.' },
  { name: 'Xenology', characteristic: 'Intellect', group: 'Knowledge', use: 'Alien species, biology and cultures.' },
];

export interface ManeuverRef {
  name: string;
  effect: string;
}

export const MANEUVERS: ManeuverRef[] = [
  { name: 'Move', effect: 'Change range band, engage/disengage, or move to a new spot within Short. See the range table.' },
  { name: 'Aim', effect: '+1 Boost on your next combat check this turn (two Aims: +2).' },
  { name: 'Assist', effect: 'Help an engaged ally: they add +1 Boost to their next check.' },
  { name: 'Guarded Stance', effect: '+1 melee defense until your next turn; your combat checks add +1 Setback meanwhile.' },
  { name: 'Interact with the environment', effect: 'Open a door, duck into cover, press a button, pick something up.' },
  { name: 'Manage gear', effect: 'Draw, holster, reload or swap a weapon; dig an item out of a pack.' },
  { name: 'Drop prone / stand up', effect: 'Prone: ranged attacks at you add +1 Setback, melee attacks at you add +1 Boost.' },
  { name: 'Mount / dismount', effect: 'Get on or off a vehicle or beast.' },
  { name: 'Preparation', effect: 'Ready for something — some talents and Prepare-quality weapons need it first.' },
];

export const MANEUVER_RULES: string[] = [
  'One maneuver is free each turn. A second costs 2 strain (or trade your action for it).',
  'Hard cap: 2 maneuvers per turn from all sources — except downgrading your action, which can make 3.',
  'Advantage can buy a free maneuver, but it still counts toward the cap.',
];

export interface RangeMove {
  from: string;
  to: string;
  maneuvers: number;
  note?: string;
}

export const RANGE_MOVES: RangeMove[] = [
  { from: 'Short', to: 'Engaged', maneuvers: 1, note: 'engage or disengage' },
  { from: 'Short', to: 'Short', maneuvers: 1, note: 'a new spot within Short' },
  { from: 'Short', to: 'Medium', maneuvers: 1 },
  { from: 'Medium', to: 'Long', maneuvers: 2, note: 'a whole turn of moving' },
  { from: 'Long', to: 'Extreme', maneuvers: 2 },
];

export const RANGE_EXAMPLES: string[] = [
  'Engaged → Medium: 2 maneuvers (disengage, then Short → Medium).',
  'Short → Long: 3 maneuvers — more than one turn.',
  'Moving costs the same in either direction.',
];
