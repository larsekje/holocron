// Skill → primary characteristic. Keys are case-insensitive in lookups.
// Values use the new participantsStore characteristic key set
// (brawn/agility/intellect/cunning/willpower/presence — note `intellect`, not `intelligence`).
const skillMap: Record<string, string> = {
  "astrogation": "intellect",
  "athletics": "brawn",
  "brawl": "brawn",
  "charm": "presence",
  "coercion": "willpower",
  "computers": "intellect",
  "cool": "presence",
  "coordination": "agility",
  "deception": "cunning",
  "discipline": "willpower",
  "gunnery": "agility",
  "leadership": "presence",
  "mechanics": "intellect",
  "medicine": "intellect",
  "melee": "brawn",
  "negotiation": "presence",
  "perception": "cunning",
  "piloting: planetary": "agility",
  "piloting: space": "agility",
  "ranged: light": "agility",
  "ranged: heavy": "agility",
  "resilience": "brawn",
  "skulduggery": "cunning",
  "stealth": "agility",
  "streetwise": "cunning",
  "survival": "cunning",
  "vigilance": "willpower",
  "core worlds": "intellect",
  "education": "intellect",
  "lore": "intellect",
  "outer rim": "intellect",
  "underworld": "intellect",
  "xenology": "intellect",
};

const display: Record<string, string> = {
  "piloting: planetary": "Piloting: Planetary",
  "piloting: space": "Piloting: Space",
  "ranged: light": "Ranged: Light",
  "ranged: heavy": "Ranged: Heavy",
};

export function characteristicForSkill(skill: string): string | undefined {
  return skillMap[skill.toLowerCase()];
}

export function skillDisplayName(skill: string): string {
  const lower = skill.toLowerCase();
  if (display[lower]) return display[lower];
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

export function allSkills(): string[] {
  return Object.keys(skillMap);
}

export default skillMap;
