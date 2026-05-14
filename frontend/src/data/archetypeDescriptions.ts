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
  "ace pilot": "Vehicle/starship specialist. Strongest contribution is in chases and dogfights.",
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
  "mount / beast of burden": "Riding/transport animal. Defines a scene through mobility, not threat.",
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
  'Ace Pilot',
  'Soldier',
  'Enforcer',
  'Grunt',
  'Guns for Hire',
  'Persistent Pest',
  'Critter',
  'Nasty Beast',
  'Mount / Beast of Burden',
  'Technician',
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

// Faction descriptions for the closed set used in adversaries.json.
export const FACTION_DESCRIPTIONS: Record<string, string> = {
  imperial: "Galactic Empire and its security/military apparatus.",
  rebel: "Rebel Alliance and affiliated cells working against the Empire.",
  "separatist/cis": "Confederacy of Independent Systems forces (Clone Wars era).",
  underworld: "Criminal syndicates, smugglers, bounty hunters, and pirates.",
  corporate: "Megacorps and their private security — profit-driven, often above the law.",
  civilian: "Non-affiliated populace. Bystanders, shopkeepers, settlers.",
  "local law": "Planetary or station police; works for whoever holds the local writ.",
  droid: "Independent or autonomous droids without a clear allegiance to organics.",
  creature: "Non-sentient species — environmental threats and beasts.",
  other: "Doesn't fit the standard factions cleanly.",
};

export function describeFaction(name: string): string | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return FACTION_DESCRIPTIONS[lower];
}
