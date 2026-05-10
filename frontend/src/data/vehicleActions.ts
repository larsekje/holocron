/**
 * Vehicle/starship maneuvers and actions — GM cheat-sheet data.
 *
 * Sourced from the homebrew **Holocron v2** PDF, chapter "Starships and
 * Speeders" (pp. 50-52). The homebrew diverges from FFG canon — it omits
 * Stay on Target / Punch It / Manage Energy and adds Brace for Impact,
 * Reposition, Increase Power, Dangerous Driving, Going Dark, Blanket
 * Barrage, and Concentrated Barrage. Source-of-truth is the PDF; if these
 * disagree with FFG core, the PDF wins for this campaign.
 *
 * These are reminders, not enforcement. The holocron tool doesn't gate the
 * action economy; the GM reads, decides, narrates. Keep summaries terse —
 * one-line nudges that bring the rule back to mind.
 */

export type CrewRole = 'Pilot' | 'Astromech' | 'Anyone';

/** Functional category of the move, used as a secondary filter on the cheat
 * sheet. Orthogonal to role — a move can be Pilot+Movement (Accelerate),
 * Anyone+Combat (Attack), Astromech+Defense (Watch Your Back), etc. */
export type MoveCategory =
  | 'Movement'   // change position or speed
  | 'Combat'     // directly contributes to an attack
  | 'Defense'    // reduces incoming damage / harder to hit
  | 'Repair'     // restores hull / system strain
  | 'Sensors'    // info-gathering or electronic warfare
  | 'Support';   // boost a crewmate's roll

export const MOVE_CATEGORIES: MoveCategory[] = [
  'Movement',
  'Combat',
  'Defense',
  'Repair',
  'Sensors',
  'Support',
];

export interface VehicleMove {
  id: string;
  name: string;
  /** Hard role gate. PDF "Pilot Only: Yes" → 'Pilot'; "Astromech Only" →
   * 'Astromech'; otherwise 'Anyone' (anyone with the right skill). */
  role: CrewRole;
  /** Functional grouping for the cheat-sheet category filter. */
  category: MoveCategory;
  /** One-line reminder rendered inline. */
  summary: string;
  /** Optional fuller description rendered in a hover tooltip. */
  description?: string;
  /** Number of purple Difficulty dice when the check has a single fixed
   * difficulty (e.g. Boost Shields = 3, Copilot = 2). Variable-difficulty
   * moves (Dangerous Driving = silhouette, Gain the Advantage = speed diff,
   * Damage Control = current strain) leave this unset — the tooltip
   * explains. */
  difficulty?: number;
  /** Skill key used to roll this check, e.g. "Gunnery", "Piloting (Space)",
   * "Computers". Must match the key participants use in
   * `stats.skills`. Omitted for free maneuvers / incidentals that don't
   * involve a roll (Accelerate, Brace for Impact, Snap Roll). */
  skill?: string;
  /** Characteristic key paired with the skill (lowercase: "agility",
   * "intellect", "cunning", etc.). */
  characteristic?: string;
  /** Minimum current speed (inclusive). PDF "Current Speed: N+". */
  minSpeed?: number;
  /** Maximum current speed (inclusive). PDF "Current Speed: 0-3". */
  maxSpeed?: number;
  /** Minimum silhouette (inclusive). PDF "Silhouette: 5+". */
  minSilhouette?: number;
  /** Maximum silhouette (inclusive). PDF "Silhouette: 1-4". */
  maxSilhouette?: number;
}

/** Returns a reason string when `move` is unavailable for the given vehicle
 * state, or null when it is available. Silhouette is checked first because
 * it's a structural restriction (the ship will never qualify at this scale)
 * — speed-based reasons can change turn-to-turn. */
export function moveUnavailableReason(
  move: VehicleMove,
  currentSpeed: number,
  silhouette: number,
): string | null {
  if (move.minSilhouette != null && silhouette < move.minSilhouette) {
    return `Requires Silhouette ≥ ${move.minSilhouette} (this ship is Sil ${silhouette}).`;
  }
  if (move.maxSilhouette != null && silhouette > move.maxSilhouette) {
    return `Requires Silhouette ≤ ${move.maxSilhouette} (this ship is Sil ${silhouette}).`;
  }
  if (move.minSpeed != null && currentSpeed < move.minSpeed) {
    return `Requires speed ≥ ${move.minSpeed} (current speed ${currentSpeed}).`;
  }
  if (move.maxSpeed != null && currentSpeed > move.maxSpeed) {
    return `Requires speed ≤ ${move.maxSpeed} (current speed ${currentSpeed}).`;
  }
  return null;
}

/** Maneuvers/actions that produce a tracked, time-windowed effect on the
 * vehicle (Evasive Maneuvers active until pilot's next turn, Boost Shields
 * +1 defense until next turn, etc.). Keyed by move id; absent ids don't
 * spawn an effect. The effect chip is a GM reminder — no rules-engine
 * enforcement, per the holocron scope. */
export const MOVE_EFFECT_SPECS: Record<string, {name: string; note: string}> = {
  'evasive-maneuvers': {
    name: 'Evasive Maneuvers',
    note: 'Until pilot’s next turn: upgrade attacks against the ship and against characters in it.',
  },
  'brace-for-impact': {
    name: 'Brace for Impact',
    note: 'Until pilot’s next turn: may take system strain (≤ silhouette) to reduce incoming damage or crit severity.',
  },
  'boost-shields': {
    name: 'Boost Shields',
    note: '+1 defense until the start of the activating player’s next turn (extends per ✶).',
  },
  'going-dark': {
    name: 'Going Dark',
    note: 'Halved max speed; no weapons/comms/active sensors. Ends when the pilot spends an action to re-enable systems.',
  },
  'increase-power': {
    name: 'Increase Power',
    note: '+1 max speed for N rounds (= astromech Intellect); −2 handling. Ship suffered 2 system strain.',
  },
  'stay-on-target': {
    name: 'Stay on Target',
    note: 'Until pilot’s next turn: gunner combat checks downgraded; combat checks against the ship downgraded.',
  },
  'gain-advantage': {
    name: 'Has the Advantage',
    note: 'Until pilot’s next turn: ship’s combat checks vs target upgraded ×2; target’s checks vs ship upgraded ×2.',
  },
  'target-lock': {
    name: 'Target Lock',
    note: 'Pilot adds ☐ to Gunnery vs declared target (1 round + 1 per ⌒⌒).',
  },
};

/** Compact label(s) for the move's gating requirements. Multiple labels
 * are returned in render order (silhouette first, then speed). Empty when
 * the move has no gating. */
export function moveRequirementLabels(move: VehicleMove): string[] {
  const labels: string[] = [];
  // Silhouette
  if (move.minSilhouette != null && move.maxSilhouette != null) {
    labels.push(`Sil ${move.minSilhouette}–${move.maxSilhouette}`);
  } else if (move.minSilhouette != null) {
    labels.push(`Sil ≥ ${move.minSilhouette}`);
  } else if (move.maxSilhouette != null) {
    labels.push(`Sil ≤ ${move.maxSilhouette}`);
  }
  // Speed
  if (move.minSpeed != null && move.maxSpeed != null) {
    labels.push(`speed ${move.minSpeed}–${move.maxSpeed}`);
  } else if (move.minSpeed != null) {
    labels.push(`speed ≥ ${move.minSpeed}`);
  } else if (move.maxSpeed != null) {
    labels.push(`speed ≤ ${move.maxSpeed}`);
  }
  return labels;
}

/** Per-speed forced-move bands and ambient effects (PDF p.50, "Vehicle
 * Speeds in Encounters"). Vehicle movement is a *forced move*: the ship
 * automatically advances this many range bands each round. The pilot
 * doesn't choose to move — they pick the direction (Reposition) or attempt
 * something fancier (Dangerous Driving). */
export interface SpeedBand {
  /** Lower-bound of the band (inclusive). */
  speedFrom: number;
  /** Upper-bound (inclusive). `null` means "no upper bound". */
  speedTo: number | null;
  /** Range bands the vehicle is forced to move per round. */
  rangeBands: number;
  /** Ambient effects active while in this band (empty for 0 / 1-2). */
  effects: string[];
  /** Mechanical effects, applied automatically to relevant rolls. */
  /** Number of upgrades to add to outgoing Piloting checks. */
  pilotUpgrades: number;
  /** Number of upgrades to add to combat checks targeting the vehicle. */
  attackedUpgrades: number;
  /** Bonus added to the result of any Critical Hits suffered from a
   * collision (informational; the GM rolls crits manually). */
  collisionCritBonus: number;
}

export const VEHICLE_SPEED_BANDS: SpeedBand[] = [
  {
    speedFrom: 0,
    speedTo: 0,
    rangeBands: 0,
    effects: [],
    pilotUpgrades: 0,
    attackedUpgrades: 0,
    collisionCritBonus: 0,
  },
  {
    speedFrom: 1,
    speedTo: 2,
    rangeBands: 2,
    effects: [],
    pilotUpgrades: 0,
    attackedUpgrades: 0,
    collisionCritBonus: 0,
  },
  {
    speedFrom: 3,
    speedTo: 4,
    rangeBands: 3,
    effects: [
      'Upgrade difficulty of Piloting checks once.',
      '+20 to collision Critical Hits.',
    ],
    pilotUpgrades: 1,
    attackedUpgrades: 0,
    collisionCritBonus: 20,
  },
  {
    speedFrom: 5,
    speedTo: null,
    rangeBands: 4,
    effects: [
      'Upgrade difficulty of attacks targeting the vehicle once.',
      'Upgrade difficulty of Piloting checks twice.',
      '+40 to collision Critical Hits.',
    ],
    pilotUpgrades: 2,
    attackedUpgrades: 1,
    collisionCritBonus: 40,
  },
];

/** Look up the speed band that contains `currentSpeed`. */
export function speedBandFor(currentSpeed: number): SpeedBand {
  return (
    VEHICLE_SPEED_BANDS.find(
      (b) =>
        currentSpeed >= b.speedFrom &&
        (b.speedTo == null || currentSpeed <= b.speedTo),
    ) ?? VEHICLE_SPEED_BANDS[0]
  );
}

export const VEHICLE_MANEUVERS: VehicleMove[] = [
  {
    id: 'decelerate',
    name: 'Decelerate',
    role: 'Pilot',
    category: 'Movement',
    summary: 'Decrease current speed by N. Suffer system strain = N − 1.',
    description:
      'Mirror of Accelerate. The pilot may decrease the vehicle’s current speed by one or more. The vehicle suffers a number of system strain equal to the amount its speed decreased minus 1, to a minimum of 0.',
    minSpeed: 1,
  },
  {
    id: 'accelerate',
    name: 'Accelerate',
    role: 'Pilot',
    category: 'Movement',
    summary: 'Increase current speed by N (up to max). Suffer system strain = N − 1.',
    description:
      'The pilot may increase the vehicle’s current speed by one or more, to a maximum of the vehicle’s maximum speed. The vehicle suffers a number of system strain equal to the amount its speed increased minus 1, to a minimum of 0.',
  },
  {
    id: 'brace-for-impact',
    name: 'Brace for Impact',
    role: 'Pilot',
    category: 'Defense',
    summary: 'Once per round — convert hull damage (or a crit) to system strain (up to silhouette).',
    description:
      'Until the start of the pilot’s next turn, when the vehicle is dealt damage the pilot may take system strain (up to the ship’s silhouette) to reduce the damage by that amount. Same trade reduces a Critical Hit result by 10 per strain (cancels at 0). Once per round.',
    minSpeed: 1,
  },
  {
    id: 'reposition',
    name: 'Reposition',
    role: 'Pilot',
    category: 'Movement',
    summary: 'Move the vehicle one range band (minor positioning).',
    description:
      'Minor repositioning to dodge obstacles, close or widen distance in a chase, or shift within the environment in small ways.',
    minSpeed: 1,
  },
  {
    id: 'evasive-maneuvers',
    name: 'Evasive Maneuvers',
    role: 'Pilot',
    category: 'Defense',
    summary: 'Once per round — upgrade attacks against the ship until pilot’s next turn.',
    description:
      'Until the start of the pilot’s next turn, upgrade the difficulty of all attacks made against the vehicle and characters in the vehicle. Once per round.',
    minSpeed: 3,
    maxSilhouette: 4,
  },
  {
    id: 'increase-power',
    name: 'Increase Power',
    role: 'Astromech',
    category: 'Movement',
    summary: '2 system strain → +1 max speed for several rounds; −2 handling. No stacking.',
    description:
      'The ship takes 2 system strain and increases its top speed by 1 for a number of rounds equal to the astromech’s Intellect, at the cost of reducing the craft’s handling by 2. May not perform a Boost Shields action in the same turn. Multiple uses on the same ship do not stack.',
    maxSilhouette: 3,
  },
];

export const VEHICLE_INCIDENTALS: VehicleMove[] = [
  {
    id: 'snap-roll',
    name: 'Snap Roll',
    role: 'Pilot',
    category: 'Defense',
    summary:
      'Out-of-turn — when hit by Gunnery, reduce damage by Handling + Piloting ranks. Costs 3 system strain + 3 strain.',
    description:
      'When the ship is successfully hit by a Gunnery combat check, the pilot may take this incidental and reduce the damage of the attack by (Handling + the pilot’s Ranks in Piloting Planetary/Space, whichever applies). The high-G maneuver costs the ship 3 system strain (bypassing armor) and the pilot 3 strain (bypassing soak). Flight suit reduces pilot strain to 1; droids in a socket are immune to the personal strain.',
    minSpeed: 2,
    maxSilhouette: 4,
    minSilhouette: 1,
  },
];

export const VEHICLE_ACTIONS: VehicleMove[] = [
  {
    id: 'attack-vehicle-weapon',
    name: 'Attack Using Vehicle Weapons',
    role: 'Anyone',
    category: 'Combat',
    skill: 'Gunnery',
    characteristic: 'agility',
    summary: 'Gunnery check; ship-vs-ship damage is planetary scale (×10 vs personal).',
    description:
      'Each weapon may only be fired once per round. Targets must be within the firing arc of the weapon. Difficulty is by silhouette difference (smaller ship = harder to hit). Most weapons deal damage on a planetary scale, where 1 hull point ≈ 10 personal-scale damage.',
  },
  {
    id: 'dangerous-driving',
    name: 'Dangerous Driving',
    role: 'Pilot',
    category: 'Movement',
    skill: 'Piloting (Space)',
    characteristic: 'agility',
    summary: 'Piloting (difficulty = silhouette) to weave through hazards or pull off a stunt.',
    description:
      'The pilot makes a Piloting check at difficulty equal to the vehicle’s silhouette. Higher current speed amplifies the consequences of failure (collisions, etc.).',
    minSpeed: 1,
  },
  {
    id: 'gain-advantage',
    name: 'Gain the Advantage',
    role: 'Pilot',
    category: 'Combat',
    skill: 'Piloting (Space)',
    characteristic: 'agility',
    summary: 'Opposed Piloting; on success, upgrade your attacks vs target ×2 and theirs vs you ×2.',
    description:
      'Difficulty is set by relative speeds: 1+ faster than target = ♦; same speed = ♦♦; 1 slower = ♦♦♦; 2+ slower = ♦♦♦♦. With success, while the pilot has the advantage, upgrade the ability of all combat checks made from the pilot’s vehicle against the target’s vehicle twice, and upgrade the difficulty of all combat checks made by the target vehicle against the pilot’s vehicle twice.',
    minSilhouette: 1,
    maxSilhouette: 4,
    minSpeed: 4,
  },
  {
    id: 'ramming-speed',
    name: 'Ramming Speed',
    role: 'Pilot',
    category: 'Combat',
    skill: 'Piloting (Space)',
    characteristic: 'agility',
    summary: 'Action — Piloting at Gain-the-Advantage difficulty; on success, resolve a collision.',
    description:
      'Spend an action and succeed at a Piloting check (difficulty determined the same way as Gain the Advantage). If successful, resolve a collision against the target. Requires being at close range to the target.',
  },
  {
    id: 'damage-control',
    name: 'Damage Control',
    role: 'Anyone',
    category: 'Repair',
    skill: 'Mechanics',
    characteristic: 'intellect',
    summary: 'Mechanics — recover system strain (no cap) or 1 hull (1 per encounter total).',
    description:
      'Difficulty scales with current strain: < ½ thresh = ♦; ≥ ½ thresh = ♦♦; ≥ thresh = ♦♦♦. There’s no limit to how many times this can be performed (1 action per PC per turn). Hull recovery is limited to 1 hull per encounter total.',
  },
  {
    id: 'going-dark',
    name: 'Going Dark',
    role: 'Anyone',
    category: 'Sensors',
    skill: 'Skulduggery',
    characteristic: 'cunning',
    summary: 'Halve max speed, no weapons / comms / active sensors. Stays dark until reactivated.',
    description:
      'Halves the ship’s max speed (round up) and reduces life support to 0. The ship cannot use weapons, communications, or active sensors. While dark and within sensor range of another vessel, opposed Skulduggery vs Perception modified by silhouette difference (and ☐ per point of speed if moving) determines whether the ship stays hidden.',
    minSilhouette: 1,
    maxSilhouette: 5,
  },
  {
    id: 'blanket-barrage',
    name: 'Blanket Barrage',
    role: 'Anyone',
    category: 'Combat',
    difficulty: 2,
    skill: 'Gunnery',
    characteristic: 'agility',
    summary: 'Capital scale — Average Gunnery; curtain of fire upgrades incoming attacks once.',
    description:
      'Selects all weapons of a single type within one or more of the ship’s firing arcs (those weapons count as firing this round). Until the end of the character’s next turn, vehicles silhouette 4 or smaller upgrade combat checks against this ship once. 🏆 = an extra hit; ⌓⌓ = automatic hit on the firing ship at half base damage; 💀 = automatic hit on the firing ship at base damage.',
    minSilhouette: 5,
    maxSpeed: 3,
  },
  {
    id: 'concentrated-barrage',
    name: 'Concentrated Barrage',
    role: 'Anyone',
    category: 'Combat',
    skill: 'Gunnery',
    characteristic: 'agility',
    summary: 'Capital scale — concentrate fire of multiple same-type weapons; spend ⌒ to add damage.',
    description:
      'Fires all weapons of a single type within a single firing arc; requires at least 2 weapons of the same type. Make a single combat check as normal. On success, may spend ⌒ once to add damage equal to the number of weapons in the attack to one hit of the attack.',
    minSilhouette: 5,
    maxSpeed: 3,
  },
  // Table 3-4 — additional ship and vehicle actions. No explicit silhouette
  // or speed gates per the PDF; left ungated here (the GM enforces context).
  {
    id: 'plot-course',
    name: 'Plot Course',
    role: 'Anyone',
    category: 'Support',
    skill: 'Astrogation',
    characteristic: 'intellect',
    difficulty: 2,
    summary: 'Astrogation (♦♦) or Perception (♦♦♦) — each ✶ reduces strain from difficult terrain by 1.',
  },
  {
    id: 'copilot',
    name: 'Copilot',
    role: 'Anyone',
    category: 'Support',
    skill: 'Piloting (Space)',
    characteristic: 'agility',
    difficulty: 2,
    summary: 'Piloting (♦♦) — each ✶ downgrades the pilot’s next Piloting check by 1.',
  },
  {
    id: 'jamming',
    name: 'Jamming',
    role: 'Anyone',
    category: 'Sensors',
    skill: 'Computers',
    characteristic: 'intellect',
    difficulty: 2,
    summary: 'Computers (♦♦) — disrupt enemy comms; +1 difficulty for each ⌒⌒ spent on extra targets.',
    description:
      'Each enemy must make an Average (♦♦) Computers check to use their communication systems. Difficulty increases by 1 for each additional ⌒⌒ spent, and the jamming affects an additional target for each ⌒⌒ spent.',
  },
  {
    id: 'boost-shields',
    name: 'Boost Shields',
    role: 'Anyone',
    category: 'Defense',
    skill: 'Mechanics',
    characteristic: 'intellect',
    difficulty: 3,
    summary: 'Mechanics (♦♦♦) — vehicle suffers 1 system strain; +1 defense until next turn (extends per ✶).',
  },
  {
    id: 'manual-repairs',
    name: 'Manual Repairs',
    role: 'Anyone',
    category: 'Repair',
    skill: 'Athletics',
    characteristic: 'brawn',
    difficulty: 3,
    summary: 'Athletics (♦♦♦) — alternative to Damage Control; remove 1 hull per ✶ (1 per encounter).',
  },
  {
    id: 'fire-discipline',
    name: 'Fire Discipline',
    role: 'Anyone',
    category: 'Support',
    skill: 'Leadership',
    characteristic: 'presence',
    difficulty: 3,
    summary: 'Leadership / Discipline (♦♦♦) — next gunner adds ☐ to their check (more per ⌒⌒).',
  },
  {
    id: 'scan-enemy',
    name: 'Scan the Enemy',
    role: 'Anyone',
    category: 'Sensors',
    skill: 'Perception',
    characteristic: 'cunning',
    difficulty: 3,
    summary: 'Perception (♦♦♦) — learn target ship’s weapons, mods, thresholds. ⌒⌒ for current values.',
  },
  {
    id: 'slice-enemy',
    name: 'Slice Enemy Systems',
    role: 'Anyone',
    category: 'Sensors',
    skill: 'Computers',
    characteristic: 'intellect',
    difficulty: 3,
    summary: 'Computers (♦♦♦) — reduce target defense by 1 per ✶; spend ⌒⌒ for system strain or 🏆 for weapon downtime.',
  },
  {
    id: 'spoof-missiles',
    name: 'Spoof Missiles',
    role: 'Anyone',
    category: 'Defense',
    skill: 'Computers',
    characteristic: 'intellect',
    summary: 'Computers (♦♦♦) / Gunnery (♦♦) / Vigilance (♦♦) — upgrade incoming Guided attacks.',
  },
  {
    id: 'watch-your-back',
    name: 'Watch Your Back',
    role: 'Astromech',
    category: 'Defense',
    skill: 'Computers',
    characteristic: 'intellect',
    difficulty: 2,
    summary: 'Computers — each ✶ provides ship +1 defense.',
  },
  {
    id: 'target-lock',
    name: 'Target Lock',
    role: 'Astromech',
    category: 'Combat',
    skill: 'Computers',
    characteristic: 'intellect',
    summary: 'Computers — pilot adds ☐ to Gunnery vs declared target; lock lasts 1 round + 1 per ⌒⌒.',
  },
];
