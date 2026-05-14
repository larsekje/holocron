import React from 'react';
import {
  GiCrossedSwords,
  GiThreeFriends,
  GiRunningShoe,
  GiPuzzle,
  GiMagnifyingGlass,
  GiSpaceShuttle,
} from 'react-icons/gi';
import type { EncounterTag } from '@/data/encounterTemplates';

/** Tag → accent colour. Same hex values used in the badge form earlier;
 *  reused here as the row accent. */
export const TAG_COLOR: Record<EncounterTag, string> = {
  combat: '#b03030',
  social: '#3a7e57',
  chase: '#d39939',
  'skill-challenge': '#5a7fb0',
  transit: '#6f6f6f',
  investigation: '#7a4fb0',
};

/** Tag → icon. One glyph per kind so a row can be read at a glance
 *  without leaning on the text. */
export const TAG_ICON: Record<EncounterTag, React.ReactNode> = {
  combat: <GiCrossedSwords />,
  social: <GiThreeFriends />,
  chase: <GiRunningShoe />,
  'skill-challenge': <GiPuzzle />,
  transit: <GiSpaceShuttle />,
  investigation: <GiMagnifyingGlass />,
};

/** Pick the primary tag — first in the array. Encounters can have multiple
 *  tags but a row only has room for one accent + icon; we use the first
 *  authoritative one and the rest become secondary badges if needed. */
export function primaryTag(tags?: EncounterTag[]): EncounterTag | undefined {
  return tags && tags.length > 0 ? tags[0] : undefined;
}
