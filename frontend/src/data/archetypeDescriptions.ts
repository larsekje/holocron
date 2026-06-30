// Brief one-liners for the OggDude broad role tags (used in `archetypes`).
// Not from a published source — terse summaries of how each role plays.
export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  bruiser: "Front-line melee combatant. Brawn-heavy, high soak, closes the distance.",
  shooter: "Ranged combatant. Agility-driven, contributes from cover at range.",
  scout: "Stealth and reconnaissance. Perception, Stealth, Survival.",
  operative: "Skirmisher / spy. Mixes infiltration with quick combat.",
  pilot: "Vehicle and starship operator. Piloting, Astrogation, Gunnery.",
  tech: "Gadgeteer / mechanic. Computers, Mechanics, Cybernetics.",
  "force-user": "Force-sensitive character with Force powers. Force Rating ≥ 1.",
  "force‑user": "Force-sensitive character with Force powers. Force Rating ≥ 1.",
  social: "Negotiation and manipulation. Charm, Coercion, Deception, Leadership.",
  leader: "Commander / buffer. Leadership talents that aid allies.",
  "beast/creature": "Non-sentient creature; uses instincts rather than gear or talents.",
  beast: "Non-sentient creature; uses instincts rather than gear or talents.",
  creature: "Non-sentient creature; uses instincts rather than gear or talents.",
  droid: "Mechanical character; immune to mind-influencing effects, no strain.",
  security: "Enforcer / guard. Trained for crowd control and apprehension.",
  medic: "Healer / support. Medicine, Resilience, recovery talents.",
};

export function describeArchetype(name: string): string | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  if (ARCHETYPE_DESCRIPTIONS[lower]) return ARCHETYPE_DESCRIPTIONS[lower];
  // strip stylistic non-word chars (the data sometimes has non-breaking hyphens)
  const cleaned = lower.replace(/[^a-z/]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return ARCHETYPE_DESCRIPTIONS[cleaned];
}

// Tighter summaries for the `coreArchetype` values produced by the data classification.
// These describe a *playstyle pattern*, not a single talent — coreArchetype is what kind of
// scene the NPC tends to drive (combatant flavour, info-broker, lieutenant, etc.).
export const CORE_ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
  "pilot": "Vehicle/starship operator — shuttle drivers through to aces. Contribution is in chases and dogfights.",
  "medic": "Healer / field support. Medicine skill and healing abilities; keeps allies alive.",
  bureaucrat: "Information-broker / official. Drives social encounters, holds keys to other scenes.",
  "bureaucrat / enforcer": "Mid-tier authority figure. Mix of social pressure and decisive use of force.",
  civilian: "Non-combatant baseline. Use as colour, hostage, or witness — not a threat alone.",
  commander: "Battlefield lieutenant. Buffs allied NPCs, coordinates fire and movement.",
  critter: "Small non-sentient pest or vermin. Scene flavour or environmental hazard.",
  enforcer: "Generalist hired muscle. Decent attack + intimidation, expects backup.",
  fixer: "Mid-game broker. Mixes social and tech, knows how to make problems disappear.",
  "force adept": "Limited Force user. A handful of Force powers, otherwise relies on mundane skills.",
  "force duelist": "Lightsaber-focused Force user. Built for melee Force engagements.",
  "force savant": "High-end Force user. Multiple Force powers, broad reach beyond combat.",
  "grunt": "Standard rank-and-file. Numerous, replaceable, group threat.",
  "guns for hire": "Mercenary specialist. Disciplined, bring their own gear, paid to finish the job.",
  "gunslinger": "Sidearm-focused shooter. Quick draw + Ranged Light specialist.",
  "heavy hitter": "Damage-dealing brute. High wound threshold + a big weapon.",
  kingpin: "Top of an organisation. Rarely shows up alone — runs the encounter at distance.",
  "marksman": "Long-range shooter. Patient, accurate, bad to ignore.",
  "melee bruiser": "Pure close-combat threat. Wades in, soaks hits, swings hard.",
  mentor: "Veteran teacher. Source of wisdom + occasional intervention; high soft power.",
  "beast of burden": "Riding/transport animal. Defines a scene through mobility, not threat.",
  mystic: "Force or quasi-Force adept who relies on knowledge, divination, or ritual.",
  "nasty beast": "Dangerous creature. Significant combat threat with claws, teeth, or worse.",
  "persistent pest": "Recurring antagonist. Never the boss; never quite gone.",
  "power broker": "Top-tier social/political player. Drives plots, surrounded by lieutenants.",
  saboteur: "Demolition / disabling specialist. Strikes infrastructure rather than people.",
  schemer: "Cunning planner. Plays the long game; expects to outwit, not out-fight.",
  "shadow operative": "Stealth-and-blade. Strikes from concealment, vanishes after.",
  smooth_talker: "Manipulator. Wins encounters via Charm, Negotiation, Deception.",
  "smooth talker": "Manipulator. Wins encounters via Charm, Negotiation, Deception.",
  socialite: "High-society mover. Influence peddler, party-circuit fixer.",
  soldier: "Disciplined military combatant. Cover, focused fire, Leadership presence.",
  sycophant: "Toady to a stronger NPC. Conduit to the boss, rarely a threat alone.",
  technician: "Mechanics + Computers specialist. Keeps the gear running for everyone else.",
  "techno wizard": "Eccentric tech-savant. Builds, breaks, and improvises with rare gear.",
};

export function describeCoreArchetype(name: string): string | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return CORE_ARCHETYPE_DESCRIPTIONS[lower];
}

// The 30 canonical coreArchetype names, in taxonomy order — the `### ` headers
// of references/archetypes.md (19 combat/action then 11 social/noncombat).
// Display-cased; the single source for the Classification Review suggestion
// dropdown. Keep in sync with archetypes.md if the taxonomy changes.
export const CORE_ARCHETYPE_NAMES: string[] = [
  'Gunslinger',
  'Marksman',
  'Heavy Hitter',
  'Melee Bruiser',
  'Pilot',
  'Soldier',
  'Enforcer',
  'Grunt',
  'Guns for Hire',
  'Persistent Pest',
  'Critter',
  'Nasty Beast',
  'Beast of Burden',
  'Technician',
  'Medic',
  'Commander',
  'Shadow Operative',
  'Force Duelist',
  'Force Savant',
  'Force Adept',
  'Sycophant',
  'Smooth Talker',
  'Bureaucrat',
  'Fixer',
  'Schemer',
  'Power Broker',
  'Kingpin',
  'Socialite',
  'Mentor',
  'Mystic',
  'Civilian',
];

// One-liners for the 6 derived Archetype buckets — the broad roll-up over the
// 31 Roles. Used for the Archetype chip tooltip.
export const ARCHETYPE_BUCKET_DESCRIPTIONS: Record<string, string> = {
  creature: "Non-sentient beasts and animals — instinct, not gear or talents.",
  combatant: "General-purpose violence — soldiers, brawlers, shooters, leaders.",
  specialist: "A precision tool deployed for a specific skilled job — pilots, techs, medics.",
  force: "Force-sensitives whose defining trait is the Force.",
  social: "Power through people and politics — talkers, brokers, bosses.",
  civilian: "Non-combatant background — bystanders, hostages, witnesses.",
};

export function describeArchetypeBucket(name: string): string | undefined {
  if (!name) return undefined;
  return ARCHETYPE_BUCKET_DESCRIPTIONS[name.toLowerCase()];
}

/** The 6 derived Archetype buckets, properly cased (for suggestion dropdowns). */
export const ARCHETYPE_BUCKET_NAMES: string[] = [
  'Combatant',
  'Specialist',
  'Force',
  'Social',
  'Creature',
  'Civilian',
];

// One-liners for the 12 Profile values — behavioural flavors. Profile fires
// on a multi-signal pattern as a defining flavor (not deviation, not threshold).
// Used for the Profile chip tooltips.
export const PROFILE_DESCRIPTIONS: Record<string, string> = {
  "glass cannon": "Hits hard, folds fast — high offense + low durability as a defining tradeoff.",
  tough: "Primarily durable — soaks punishment, modest offense; built to endure.",
  elite: "A cut above its kind — stats/kit a clear step above the norm for its tier and Role.",
  terrifying: "A morale threat — Terrifying/Fearsome abilities; can break a scene without a hit.",
  ambusher: "Front-loaded — dangerous on the opening, stealth + opening-strike kit.",
  stealthy: "Operates undetected — sneaks, hides, infiltrates; stealth as a defining tool.",
  controller: "Shuts you down rather than damaging — built on Ensnare/Disorient/Stun/Knockdown.",
  swarm: "A numbers threat — individually weak, deployed in combat groups (Minion tier).",
  charismatic: "Wins hearts — persuasion is the defining tool; multi-signal social pattern.",
  "iron-fisted": "Wins by fear — intimidation is the defining tool; Coercion-dominant.",
  manipulative: "Wins by deceit — guile is the defining tool; Deception/Skulduggery + Cunning.",
  "force-sensitive": "Force-touched, regardless of Role — Force Rating, powers, or Force-flavored talents.",
};

export function describeProfile(name: string): string | undefined {
  if (!name) return undefined;
  return PROFILE_DESCRIPTIONS[name.toLowerCase()];
}

/** The 12 Profile values, properly cased (for suggestion dropdowns). */
export const PROFILE_NAMES: string[] = [
  'Glass Cannon',
  'Tough',
  'Elite',
  'Terrifying',
  'Ambusher',
  'Stealthy',
  'Controller',
  'Swarm',
  'Charismatic',
  'Iron-fisted',
  'Manipulative',
  'Force-Sensitive',
];

// Faction descriptions for the closed set used in adversaries.json (v5: 14 values).
export const FACTION_DESCRIPTIONS: Record<string, string> = {
  imperial: "Galactic Empire and its security/military apparatus.",
  rebel: "Rebel Alliance and affiliated cells working against the Empire.",
  "galactic republic": "The Old/Clone Wars Republic — clones, Republic military and officials.",
  "separatist/cis": "Confederacy of Independent Systems forces (Clone Wars era).",
  "first order": "Successor military state to the Empire (sequel era).",
  resistance: "Resistance cells opposing the First Order (sequel era).",
  "jedi order": "The Jedi — as an organisation, across eras.",
  sith: "Sith order/lineage and unaligned dark-side adepts.",
  underworld: "Criminal syndicates, smugglers, bounty hunters, and pirates.",
  "local law": "Planetary or station police; works for whoever holds the local writ.",
  corporate: "Megacorps and their private security — profit-driven, often above the law.",
  independent: "Unaffiliated people and groups — villagers, free agents, the local populace.",
  nature: "Wild creatures — no allegiance; part of the ecosystem.",
  other: "Doesn't fit the standard factions cleanly.",
};

export function describeFaction(name: string): string | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return FACTION_DESCRIPTIONS[lower];
}

/** The 14 Faction values, properly cased (for suggestion dropdowns). */
export const FACTION_NAMES: string[] = [
  'Imperial',
  'Rebel',
  'Galactic Republic',
  'Separatist/CIS',
  'First Order',
  'Resistance',
  'Jedi Order',
  'Sith',
  'Underworld',
  'Local Law',
  'Corporate',
  'Independent',
  'Nature',
  'Other',
];
