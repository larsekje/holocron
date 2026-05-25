import React from 'react';
import {
  GiCrossedSwords,
  GiThreeFriends,
  GiRunningShoe,
  GiMagnifyingGlass,
  GiSpaceShuttle,
  GiCampfire,
  GiMartini,
  GiDeathSkull,
  GiTwoCoins,
  GiCargoCrate,
  GiRingedPlanet,
  GiLockedDoor,
} from 'react-icons/gi';
import type { EncounterTag, EncounterTemplate } from '@/data/encounterTemplates';

/** Tag → accent colour. */
export const TAG_COLOR: Record<EncounterTag, string> = {
  combat: '#b03030',
  social: '#3a7e57',
  chase: '#d39939',
  investigation: '#7a4fb0',
  travel: '#5a7fb0',
  downtime: '#4db6a8',
};

/** Tag → icon, so a row reads at a glance without leaning on the text. */
export const TAG_ICON: Record<EncounterTag, React.ReactNode> = {
  combat: <GiCrossedSwords />,
  social: <GiThreeFriends />,
  chase: <GiRunningShoe />,
  investigation: <GiMagnifyingGlass />,
  travel: <GiSpaceShuttle />,
  downtime: <GiCampfire />,
};

export const ALL_TAGS: EncounterTag[] = [
  'combat',
  'social',
  'chase',
  'investigation',
  'travel',
  'downtime',
];

/** Icons the GM can pick per-encounter (overrides the tag-derived icon).
 * Keyed by a stable string stored on the encounter. */
export const ICON_CHOICES: Record<string, React.ReactNode> = {
  swords: <GiCrossedSwords />,
  people: <GiThreeFriends />,
  run: <GiRunningShoe />,
  search: <GiMagnifyingGlass />,
  ship: <GiSpaceShuttle />,
  cantina: <GiMartini />,
  skull: <GiDeathSkull />,
  credits: <GiTwoCoins />,
  cargo: <GiCargoCrate />,
  planet: <GiRingedPlanet />,
  door: <GiLockedDoor />,
  camp: <GiCampfire />,
};

export const ICON_KEYS = Object.keys(ICON_CHOICES);

/** Pick the primary tag — first in the array. A row only has room for one
 *  accent + icon; the rest become secondary badges if needed. */
export function primaryTag(tags?: EncounterTag[]): EncounterTag | undefined {
  return tags && tags.length > 0 ? tags[0] : undefined;
}

/** Resolve an encounter's display icon + accent colour. A chosen `icon` key
 * wins; otherwise fall back to the primary tag; otherwise a neutral default. */
export function resolveEncounterVisual(encounter: Pick<EncounterTemplate, 'icon' | 'tags'>): {
  icon: React.ReactNode;
  color: string;
} {
  const tag = primaryTag(encounter.tags);
  const color = tag ? TAG_COLOR[tag] : '#5a7fb0';
  if (encounter.icon && ICON_CHOICES[encounter.icon]) {
    return { icon: ICON_CHOICES[encounter.icon], color };
  }
  return { icon: tag ? TAG_ICON[tag] : <GiSpaceShuttle />, color };
}
