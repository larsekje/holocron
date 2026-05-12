import drinkingEstablishment from './drinking_establishment.json';
import skinProfilesData from './skin-profiles.json';

export type JuiceSlot = 'atmosphere' | 'npc' | 'environmental' | 'complication';
export type JuiceArchetype =
  | 'drinking_establishment'
  | 'public_crowd_space'
  | 'stronghold_of_power'
  | 'negotiation_room'
  | 'vehicle_transit'
  | 'wilderness';
export type JuiceBias = 'imperial' | 'rebel' | 'underworld' | 'corporate' | 'mystical' | 'frontier' | 'noble';

export interface JuiceTone {
  pulpy: number;
  seedy: number;
  intrigue: number;
  refined: number;
}

export type JuiceNpcType = 'featured' | 'background' | 'dual_extreme';
export type JuiceNpcComposition = 'single' | 'pair' | 'group';
export type JuiceNpcMode = 'description' | 'action';

export interface JuiceEntry {
  slot: JuiceSlot;
  archetype: JuiceArchetype;
  skin: string;
  text: string;
  tone: JuiceTone;
  heat: number;
  bias: string[];
  npc_type?: JuiceNpcType;
  npc_composition?: JuiceNpcComposition;
  npc_mode?: JuiceNpcMode;
}

// Time-invariant entries (atmosphere; description-mode NPCs) treat heat as
// authoring preference, not a runtime filter — they surface at any active
// heat. Moment-bound entries (action NPCs, environmental, complications)
// require a strict heat match.
export function isTimeInvariant(e: JuiceEntry): boolean {
  if (e.slot === 'atmosphere') return true;
  if (e.slot === 'npc' && e.npc_mode === 'description') return true;
  return false;
}

const banks: Partial<Record<JuiceArchetype, JuiceEntry[]>> = {
  drinking_establishment: drinkingEstablishment as JuiceEntry[],
};

export function getBank(archetype: JuiceArchetype): JuiceEntry[] {
  return banks[archetype] ?? [];
}

export function listAvailableArchetypes(): JuiceArchetype[] {
  return Object.keys(banks) as JuiceArchetype[];
}

// Atmosphere is a single pre-composed scene anchor (2–3 sentences).
export const ATMOSPHERE_COUNT = 1;

export interface NpcMix {
  anchor: number;
  featured: number;
  background: number;
}

export interface NpcModeMix {
  description: number;
  action: number;
}

// NPC count is constant (3) but the mix shifts with heat. At Heat 3 the
// scene gets an anchor (a dual_extreme NPC); the matcher falls back to
// 2 featured + 1 background when no anchor candidate exists in the bank.
export function getNpcMixForHeat(heat: 1 | 2 | 3): NpcMix {
  if (heat === 1) return { anchor: 0, featured: 1, background: 2 };
  if (heat === 2) return { anchor: 0, featured: 2, background: 1 };
  return { anchor: 1, featured: 1, background: 1 };
}

// Mode budget per scene. The anchor (when present) takes the action slot —
// anchors are almost always mid-verb, so the rest of the room can lean
// description-heavy.
export function getNpcModeMixForHeat(heat: 1 | 2 | 3): NpcModeMix {
  if (heat === 1) return { description: 2, action: 1 };
  if (heat === 2) return { description: 1, action: 2 };
  return { description: 2, action: 1 };
}

// Per-archetype × heat environmental card counts. Bars and negotiation
// rooms have none; wilderness is environmental-heavy.
const ENV_COUNTS: Record<JuiceArchetype, Record<1 | 2 | 3, number>> = {
  drinking_establishment: { 1: 0, 2: 0, 3: 0 },
  public_crowd_space: { 1: 1, 2: 1, 3: 2 },
  stronghold_of_power: { 1: 1, 2: 1, 3: 2 },
  wilderness: { 1: 3, 2: 4, 3: 5 },
  vehicle_transit: { 1: 2, 2: 3, 3: 3 },
  negotiation_room: { 1: 0, 2: 0, 3: 0 },
};

export function getEnvCount(archetype: JuiceArchetype, heat: 1 | 2 | 3): number {
  return ENV_COUNTS[archetype]?.[heat] ?? 0;
}

export const SKINS_BY_ARCHETYPE: Record<JuiceArchetype, string[]> = {
  drinking_establishment: ['spaceport_dive', 'backwater_hole', 'coruscant_club', 'hutt_parlor', 'sabacc_den', 'smugglers_haunt'],
  public_crowd_space: ['market_bazaar', 'concourse_terminal', 'festival', 'slum_street', 'arena', 'pilgrimage_site'],
  stronghold_of_power: ['imperial', 'hutt_crimelord', 'corporate', 'noble_royal', 'religious_sacred', 'warlord_pirate'],
  negotiation_room: ['back_room', 'audience_chamber', 'diplomatic_suite', 'high_society_function', 'tribunal', 'parley_field'],
  vehicle_transit: ['starship_interior', 'space_dogfight', 'speeder_chase', 'magnatrain', 'convoy', 'hyperspace'],
  wilderness: ['desert', 'swamp_jungle', 'ice_tundra', 'mountain_rocky', 'aquatic_coastal', 'volcanic', 'toxic_dead'],
};

export const ALL_BIASES: JuiceBias[] = ['imperial', 'rebel', 'underworld', 'corporate', 'mystical', 'frontier', 'noble'];

// ─── Skin profiles ─────────────────────────────────────────────────────────
// Each skin has a baseline tone (mean per axis), heat deltas (applied at heat
// 2/3; heat 1 is baseline), and bias deltas (applied per active bias tag).
// The computed target drives both the display dials and the matcher.

export interface SkinToneAxisProfile {
  mean: number;
  spread: number;
}

export interface SkinProfile {
  display_name: string;
  blurb: string;
  tone_profile: Record<keyof JuiceTone, SkinToneAxisProfile>;
  heat_adjustments: Record<string, Partial<Record<keyof JuiceTone, number>>>;
  bias_adjustments?: Partial<Record<JuiceBias, Partial<Record<keyof JuiceTone, number>>>>;
}

type SkinProfilesFile = {
  _meta?: unknown;
} & Record<JuiceArchetype, Record<string, SkinProfile>>;

export const SKIN_PROFILES = skinProfilesData as unknown as SkinProfilesFile;

export const TONE_RANGE: readonly [number, number] = [-1, 2];

const TONE_AXES_LIST: (keyof JuiceTone)[] = ['pulpy', 'seedy', 'intrigue', 'refined'];

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function getSkinProfile(
  archetype: JuiceArchetype,
  skinKey: string | null,
): SkinProfile | null {
  if (!skinKey) return null;
  return SKIN_PROFILES[archetype]?.[skinKey] ?? null;
}

export function computeToneTarget(
  archetype: JuiceArchetype,
  skinKey: string | null,
  heat: number,
  biases: JuiceBias[],
): JuiceTone {
  const profile = getSkinProfile(archetype, skinKey);
  const target: JuiceTone = { pulpy: 0, seedy: 0, intrigue: 0, refined: 0 };
  if (!profile) return target;

  for (const axis of TONE_AXES_LIST) {
    target[axis] = profile.tone_profile[axis]?.mean ?? 0;
  }

  const heatAdj = profile.heat_adjustments[String(heat)] ?? {};
  for (const axis of TONE_AXES_LIST) {
    target[axis] += heatAdj[axis] ?? 0;
  }

  if (profile.bias_adjustments) {
    for (const bias of biases) {
      const adj = profile.bias_adjustments[bias] ?? {};
      for (const axis of TONE_AXES_LIST) {
        target[axis] += adj[axis] ?? 0;
      }
    }
  }

  for (const axis of TONE_AXES_LIST) {
    target[axis] = clamp(target[axis], TONE_RANGE[0], TONE_RANGE[1]);
  }

  return target;
}
