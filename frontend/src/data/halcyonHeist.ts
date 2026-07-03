/**
 * The Halcyon Heist — bundled session-prep content.
 *
 * A complete solo *Star Wars* (FFG / Edge of the Empire) scenario aboard the
 * luxury star-cruiser *Halcyon* (~9 ABY). The player is Rodas Olo, a non-combat
 * Rodian slicer hiding from his old pirate crew — who are aboard, disguised as
 * stewards, running a vault heist. The engine of the whole thing is asymmetric
 * knowledge: Rodas recognises the crew on sight; they don't know he's aboard.
 *
 * The scenario's authoritative source lives in its own little repo as `data/
 * people.json` (34 NPCs) and `data/rooms.json` (26 rooms). We vendor those two
 * JSON files verbatim under `halcyon/` and transform them here into the
 * holocron's `EncounterTemplate` shape so they surface as read-only bundled
 * samples in the Session Prep panel — the same role the Gundark Gambit seed
 * plays. Re-importing an updated scenario is just dropping in fresh JSON.
 *
 * Two surfaces come out of it:
 *   - HALCYON_NPCS   — the 34-NPC roster as individual, cleaned records, tagged
 *                      by camp (Undertow / Ship's crew / The mark / Guests) so
 *                      the cast panel can tab between them and render one card
 *                      per NPC.
 *   - HALCYON_SCENES — the 26 rooms as scenes: read-aloud as the body, GM hints
 *                      and pressures as beats, the room's named cast as NPCs.
 */
import type { EncounterTemplate, NpcRef } from './encounterTemplates';
import peopleRaw from './halcyon/people.json';
import roomsRaw from './halcyon/rooms.json';

interface RawPerson {
  camp: 'undertow' | 'ship' | 'mark' | 'wild';
  name: string;
  species?: string;
  face?: string;
  seen?: string;
  truth?: string;
  want?: string;
  lever?: string;
  found?: string;
  ties?: string[];
  trail?: string;
}

interface RawRoom {
  zone?: string;
  name: string;
  deck?: string;
  access?: string;
  rhythm?: string;
  read?: string;
  people?: { t: string; m?: string }[];
  hints?: { w?: string; t: string }[];
  cast?: { n: string; s?: string }[];
  slicer?: string[];
  nudge?: string;
  exits?: string;
  links?: string[];
  comps?: { h?: number; t: string }[];
}

const people = peopleRaw as unknown as RawPerson[];
const rooms = roomsRaw as unknown as RawRoom[];

/** Source prose carries inline HTML (trail tags `<span class='trail'>[A]</span>`,
 * `<b>`/`<i>` emphasis, a `▸ now` marker). The template card renders plain
 * pre-wrapped text, so flatten tags to their inner text and tidy whitespace. */
function strip(s: string | undefined): string {
  if (!s) return '';
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/▸\s*now/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mirrors the Rooms/People tool's slug() so ids stay stable and recognisable. */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[‘’“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Cast: the 34-NPC roster, one cleaned record per NPC ─────────────────────

export type HalcyonCamp = 'undertow' | 'ship' | 'mark' | 'wild';

export interface HalcyonNpc {
  id: string;
  camp: HalcyonCamp;
  name: string;
  species: string;
  /** One-line physical tag / cover identity. */
  face: string;
  /** Read-aloud: what the player perceives (often from Rodas's recognition). */
  seen: string;
  /** GM-only: who they really are. */
  truth: string;
  want: string;
  lever: string;
  found: string;
  ties: string[];
  /** Investigation trail this NPC feeds: 'A' | 'B' | 'C' | '' (none). */
  trail: string;
}

/** Camp display metadata, in the order the tabs should appear. */
export interface HalcyonCampMeta {
  camp: HalcyonCamp;
  /** Short tab label. */
  label: string;
  /** One-line gloss for the section/tooltip. */
  blurb: string;
}

export const HALCYON_CAMPS: HalcyonCampMeta[] = [
  {
    camp: 'undertow',
    label: 'Undertow',
    blurb: "Rodas's old pirate crew, aboard as stewards. He knows them on sight; they don't know he's here.",
  },
  {
    camp: 'ship',
    label: 'Crew',
    blurb: "The Halcyon's own people — the captain, the ISB security chief, the keys to the vault.",
  },
  {
    camp: 'mark',
    label: 'Mark',
    blurb: 'The nervous Muun courier, his quantum-locked chip, and the Houk you route around — never fight.',
  },
  {
    camp: 'wild',
    label: 'Guests',
    blurb: "The gala's passengers: assets, red herrings, and weather that goes loud at zero hour.",
  },
];

export const HALCYON_NPCS: HalcyonNpc[] = people.map((p) => ({
  id: `halcyon-npc-${slug(p.name)}`,
  camp: p.camp,
  name: p.name,
  species: p.species ?? '',
  face: strip(p.face),
  seen: strip(p.seen),
  truth: strip(p.truth),
  want: strip(p.want),
  lever: strip(p.lever),
  found: strip(p.found),
  ties: p.ties ?? [],
  trail: p.trail ?? '',
}));

// ── Scenes: the 26 rooms ────────────────────────────────────────────────────

/** Ship access zones used to both colour-code and tab the scenes — matching the
 * original tool's map-dot colours / the Halcyon palette. */
export interface HalcyonSceneZone {
  key: string;
  label: string;
  color: string;
}

export const HALCYON_SCENE_ZONES: HalcyonSceneZone[] = [
  { key: 'guest', label: 'Guest', color: '#D9B36C' }, // brass
  { key: 'crew', label: 'Crew', color: '#5FD0F0' }, // signal cyan
  { key: 'officer', label: 'Officer', color: '#A893C9' }, // violet
  { key: 'engineering', label: 'Engineering', color: '#E0915F' }, // amber — the keel
  { key: 'covert', label: 'Covert', color: '#6FBF8F' }, // green — the slicer's walls
  { key: 'ship', label: 'Ship', color: '#8A8F98' }, // neutral — orientation / unzoned
];

const ZONE_COLOR: Record<string, string> = Object.fromEntries(
  HALCYON_SCENE_ZONES.map((z) => [z.key, z.color]),
);

/** Categorise a room's freeform `access` (e.g. "crew · engineering", "guest at
 * bars") into a zone key — order matters: engineering and officer win over a
 * bare "crew"/"guest". */
function sceneZoneKey(access: string): string {
  const a = access.toLowerCase();
  if (a.includes('officer')) return 'officer';
  if (a.includes('engineering')) return 'engineering';
  if (a.includes('wall')) return 'covert';
  if (a.includes('crew') || a.includes('staff')) return 'crew';
  if (a.includes('guest') || a.includes('invitation')) return 'guest';
  return 'ship';
}

function roomBeats(r: RawRoom): string[] {
  const hints = (r.hints ?? []).map((h) =>
    [h.w ? `[${h.w}]` : '', strip(h.t)].filter(Boolean).join(' '),
  );
  const comps = (r.comps ?? []).map((c) =>
    `Pressure${c.h ? ` ${c.h}` : ''}: ${strip(c.t)}`,
  );
  return [...hints, ...comps];
}

/** A room's named cast member inherits the person's `want` from people.json —
 * that's what the play surface's cast rows lead with. */
const wantByName = new Map(HALCYON_NPCS.map((n) => [n.name, n.want]));

const scenesWithZone = rooms.map((r) => {
  const npcs: NpcRef[] = (r.cast ?? []).map((c) => ({
    name: c.n,
    descriptor: strip(c.s) || undefined,
    want: wantByName.get(c.n) || undefined,
  }));
  const blurb = [r.deck, strip(r.rhythm)].filter(Boolean).join(' · ');
  const zoneKey = sceneZoneKey(r.access ?? '');
  const scene: EncounterTemplate = {
    id: `halcyon-room-${slug(r.name)}`,
    title: r.name,
    blurb,
    accentColor: ZONE_COLOR[zoneKey],
    // Just the read-aloud — everything else is structured below.
    description: strip(r.read),
    npcs: npcs.length ? npcs : undefined,
    beats: roomBeats(r),
    floor: (r.people ?? []).map((pp) => ({ text: strip(pp.t), watch: pp.m === 'h' || undefined })),
    angles: (r.slicer ?? []).map(strip),
    anglesLabel: "Slicer's eye",
    nudge: strip(r.nudge) || undefined,
    exits: strip(r.exits) || undefined,
    links: r.links && r.links.length ? r.links : undefined,
  };
  return { scene, zoneKey };
});

export const HALCYON_SCENES: EncounterTemplate[] = scenesWithZone.map((x) => x.scene);

/** Scenes grouped by ship zone, in `HALCYON_SCENE_ZONES` order, dropping any
 * zone with no rooms — drives the Scenes panel's tabs. */
export const HALCYON_SCENE_GROUPS = HALCYON_SCENE_ZONES.map((z) => ({
  ...z,
  scenes: scenesWithZone.filter((x) => x.zoneKey === z.key).map((x) => x.scene),
})).filter((g) => g.scenes.length > 0);
