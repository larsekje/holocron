import drinkingEstablishment from './drinking_establishment.json';
import skinProfilesData from './skin-profiles.json';

export type JuiceSlot = 'sensory' | 'npc' | 'environmental' | 'complication';
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

export type JuiceNpcType = 'featured' | 'background';

export interface JuiceEntry {
  slot: JuiceSlot;
  archetype: JuiceArchetype;
  skin: string;
  text: string;
  tone: JuiceTone;
  heat: number[];
  bias: string[];
  npc_type?: JuiceNpcType;
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

export const SLOT_DISTRIBUTION: Record<JuiceArchetype, Partial<Record<JuiceSlot, number>>> = {
  drinking_establishment: { sensory: 3, npc: 3, complication: 1 },
  public_crowd_space: { sensory: 3, npc: 2, environmental: 1, complication: 1 },
  stronghold_of_power: { sensory: 2, npc: 3, environmental: 1, complication: 1 },
  negotiation_room: { sensory: 2, npc: 3, complication: 1 },
  vehicle_transit: { sensory: 2, npc: 2, environmental: 1, complication: 1 },
  wilderness: { sensory: 2, npc: 1, environmental: 3, complication: 1 },
};

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
