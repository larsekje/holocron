/**
 * Hardcoded sample entries for the "Tonight's roster" card.
 *
 * Stand-in until we wire up a real per-session roster store. The shape
 * intentionally mirrors what a roster entry will look like once it's
 * editable: name, optional faction tag, one-line note. `spotlightId` is
 * the eventual hook for binding to a statblock from the spotlight index.
 */

export interface RosterSample {
  id: string;
  name: string;
  faction?: string;
  note?: string;
  /** Future: spotlight detail id to drop in as Participant on demand. */
  spotlightId?: string;
}

export const TONIGHTS_ROSTER_SAMPLES: RosterSample[] = [
  {
    id: 'sample-greedo',
    name: 'Greedo',
    faction: 'Jabba',
    note: 'Lisps when nervous. Will overplay his hand if cornered.',
  },
  {
    id: 'sample-trooper-patrol',
    name: 'Stormtrooper patrol',
    faction: 'Empire',
    note: 'Four-pack. Sergeant talks; the rest just shoot.',
  },
  {
    id: 'sample-cantina-bartender',
    name: 'Wuher (bartender)',
    note: 'Hates droids. Knows everyone. Will not sell out a regular.',
  },
];
