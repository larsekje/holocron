/**
 * rosterVisuals — display facts derived from a roster entry's linked Spotlight
 * adversary, plus the colour/letter vocabularies the roster row reads from.
 *
 * Faction and tier are NOT stored on the RosterEntry; they're derived live from
 * the linked adversary detail via getDetail. That keeps the roster data model a
 * thin pointer (name + adversaryId + note) while still letting a linked NPC
 * render its faction accent and threat tier.
 */
import { getDetail } from '@/data/spotlightIndex';

export type Tier = 'Minion' | 'Rival' | 'Nemesis';

/**
 * Faction → accent colour, keyed on the closed 14-value set used in the
 * adversary data (see FACTION_DESCRIPTIONS in archetypeDescriptions). Keys are
 * lowercased to match how describeFaction normalises before lookup.
 */
export const FACTION_COLOR: Record<string, string> = {
  imperial: '#5a6e80',
  rebel: '#b03030',
  'galactic republic': '#a4453a',
  'separatist/cis': '#7a4fb0',
  'first order': '#454b54',
  resistance: '#d39939',
  'jedi order': '#4db6a8',
  sith: '#7a1f1f',
  underworld: '#c8a23a',
  'local law': '#5a7fb0',
  corporate: '#3a7e57',
  independent: '#8a8f98',
  nature: '#4d7d3a',
  other: '#6f6f6f',
};

/** Accent for entries with no resolvable faction (freeform NPCs, cast). */
export const NEUTRAL_ACCENT = '#52555b';

export function factionColor(faction?: string): string {
  if (!faction) return NEUTRAL_ACCENT;
  return FACTION_COLOR[faction.toLowerCase()] ?? '#5a7fb0';
}

export interface RosterProfile {
  found: boolean;
  /** The stat block's own name — lets a renamed entry show which block it uses. */
  sourceName?: string;
  /** Threat tier — rendered as the matching narrative-die icon (Minion=Setback,
   *  Rival=Difficulty, Nemesis=Challenge), consistent with the target cards. */
  tier?: Tier;
  /** Drives the row's left accent colour only — faction text isn't shown (the
   *  roster is about access + fluff, not stats). */
  faction?: string;
}

const EMPTY: RosterProfile = { found: false };

/**
 * Derive display facts for a linked roster entry from the Spotlight adversary
 * detail. Field shapes vary across the index, so every read is defensive and we
 * surface only what resolves. `found:false` means the id didn't resolve (stale
 * link) — the row falls back to a plain freeform NPC.
 */
export function deriveProfile(adversaryId?: string): RosterProfile {
  if (!adversaryId) return EMPTY;
  const d = getDetail('adversary', adversaryId) as any;
  if (!d) return EMPTY;

  const rawTier = d.adversaryType ?? d.type;
  const tier: Tier | undefined =
    rawTier === 'Minion' || rawTier === 'Rival' || rawTier === 'Nemesis' ? rawTier : undefined;
  const factions: string[] = Array.isArray(d.factions) ? d.factions : [];

  return {
    found: true,
    sourceName: d.name ?? undefined,
    tier,
    faction: factions[0],
  };
}
