/**
 * Hardcoded encounter templates for the session-prep panel.
 *
 * Currently loaded: a curated 6-scene subset of The Gundark Gambit (the
 * full toolkit had ~22 menu scenes + landings; the leaner pool here is
 * the load-bearing beats the GM can deploy as needed during one night).
 *
 * This is the seed for what eventually becomes a user-saved + bundled
 * template library. For now it's a static array — once we know what
 * actually feels useful in the UI we'll wire it to persistence.
 */

export type EncounterTag =
  | 'combat'
  | 'social'
  | 'chase'
  | 'investigation'
  | 'travel'
  | 'downtime';

/**
 * NPC entry. Plain strings still work for narrative-only NPCs ("The dead man
 * (has the PC's face)"); the structured form lets a row link to a spotlight
 * adversary so it can be one-click added to the encounter.
 */
export interface NpcRef {
  name: string;
  /** Shown muted on the row. If omitted and `name` contains a "( ... )"
   *  suffix, the suffix is auto-extracted as the descriptor. */
  descriptor?: string;
  /** Spotlight adversary id (e.g. `adversary_stormtrooper-patrol-troopers`).
   *  Surfaces a "+ add" button on the row. */
  adversaryId?: string;
  /** What they're after — the improv handle. Shown on play-surface cast rows
   *  so the GM can riff from motivation without opening anything. */
  want?: string;
  /** Multiplier — for minion groups this overrides the minion count; for
   *  non-minion entries the add button drops in `count` separate
   *  participants, each suffixed with " 1", " 2", … so they're distinct. */
  count?: number;
}

export type NpcEntry = string | NpcRef;

export interface RollTableRow {
  id: string;
  /** Matched against a roll — a single number ("3") or a range ("1-2"). */
  key: string;
  text: string;
}

export interface RollTable {
  id: string;
  title: string;
  /** PolyDie string ('d6', 'd20', …). When set the table is rollable and a
   * roll highlights the matching row; without it it's a static reference. */
  die?: string;
  rows: RollTableRow[];
}

/** An ambient one-liner — what's happening on the floor of a location scene.
 * Not a stat row: set dressing the GM narrates from. `watch` marks the ones
 * watching back (surveillance/pressure) so they get an amber dot. */
export interface FloorVignette {
  text: string;
  watch?: boolean;
}

export interface EncounterTemplate {
  id: string;
  title: string;
  /** Free-form body. Its first paragraph doubles as the collapsed hook, so
   * authored encounters have no separate hook field. */
  body?: string;
  /** Chosen accent-icon key (see encounterVisuals ICON_CHOICES); overrides the
   * tag-derived icon when set. */
  icon?: string;
  /** Explicit accent colour (CSS hex), overriding the tag-derived accent. Used
   * by the Halcyon scenes to colour-code rooms by ship access zone. */
  accentColor?: string;
  /** Legacy bundled-sample fields — still rendered when present. */
  blurb?: string;
  description?: string;
  tags?: EncounterTag[];
  /** NPC roster — plain strings (narrative NPCs) or NpcRef (linked to a
   *  Spotlight profile, quick-addable). */
  npcs?: NpcEntry[];
  beats?: string[];
  tables?: RollTable[];

  /* Structured location-scene fields (Halcyon rooms; optional everywhere).
   * When present the play surface renders them as their own sections instead
   * of prose packed into `description`. */
  /** Ambient people/business on the floor right now. */
  floor?: FloorVignette[];
  /** PC-specific approach options ("Slicer's eye" lines). May contain the
   * narrative-dice glyphs ♦ (difficulty) and ■ (boost) — rendered coloured. */
  angles?: string[];
  /** Heading for `angles` — e.g. "Slicer's eye". Defaults to "Angles". */
  anglesLabel?: string;
  /** One-liner to drop when the scene stalls. */
  nudge?: string;
  /** Freeform physical exits ("Grand stair up · guest lifts …"). */
  exits?: string;
  /** Titles of adjacent scenes — rendered as walk-to chips on the play
   * surface (resolved against the same library the scene came from). */
  links?: string[];
}

export const ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── The Gundark Gambit — Nar Shaddaa solo-session toolkit. Tone: Blade
  //    Runner meets Peralez. Recurring threads (Name/Face/Symbol/Phrase)
  //    are GM-picked at the start of the night and seeded into each
  //    scene's Broker Touch moment.
  {
    id: 'gundark-cold-open',
    title: 'Cold Open — The Howling Gundark',
    blurb:
      'A stranger staggers in, points at the PC, dies. Then the roof comes down.',
    description:
      'Nar Shaddaa. Third gallery of the Kelro Heights, in a cantina called The Howling Gundark. Rain seeps from twenty levels up as oily mist; a four-piece Bith ensemble plays a slow brassy number called "Two Suns, One Bottle." Spice smoke, fried nuna, wet duracrete, Corellian ale soaked into the floor planks.\n\nThe band misses a note. The walkway outside goes all-the-way quiet. The door swings open and a man the PC has never seen staggers in, soaked through with rain and something darker, eyes wild. He scans the room. His eyes land on the PC. They stop. He raises a shaking hand, points, and dies on his feet.\n\nThree seconds later a four-operator black-armored unit drops through the skylight on grav-lines. Suppressed carbines. No insignia. They shoot the kloo-horn Bith first, then a Rodian dock worker, then turn on the PC. The PC\'s job is to escape, not win.',
    tags: ['combat', 'social'],
    npcs: [
      'Maza Tann (Mirialan bartender, cyber arm)',
      'Old Ennis (hooded human, back booth)',
      "Nera (Twi'lek, not surprised)",
      {
        name: 'Karra Doss',
        descriptor: 'Weequay merc, 500cr for hire',
        adversaryId: 'adversary_ak-mal-weequay-hunter',
      },
      {
        name: '"Six"',
        descriptor: "one-eyed Aqualish, helper if Karra wasn't hired",
        adversaryId: 'adversary_aqualish-thug',
      },
      'Skitter Vox (Sullustan, knows the freight-tube route)',
      'C-7X (yellow protocol droid dealer)',
      'The Bith band',
      {
        name: 'The Gamorrean',
        descriptor: 'asleep in stew, will NOT wake',
        adversaryId: 'adversary_gamorrean-thug',
      },
      'Spec-Force Unit × 4 (Nemesis, coordinated)',
    ],
    beats: [
      'Settle in (3–5 min). Let the PC eavesdrop, order, drop one recurring thread (Old Ennis murmuring a phrase, holovid glitch on a face).',
      'The Runner. Stranger bursts in soaked with blood, points at PC, dies. Carried nothing; chrono wrong by three minutes.',
      'The Rappel. Spec-Force breaches through the skylight + front window. Kill 2–3 NPCs the PC noticed in narration to make it land.',
      'The helper (if hired Karra: she drops one operator and dies covering the escape — "that\'s the easiest 500 I never spent"; otherwise Six breaks his stool across a helmet and goes down with relief in his eyes).',
      'Escape routes: maintenance door (Maza throws the key), the vent above the rear booth (Hard Athletics), the freight-tube hatch (drops 14 levels), front window with a Triumph. Front door is suicide.',
    ],
  },
  {
    id: 'gundark-stranger-knows-name',
    title: 'The Person Who Knows Their Name',
    blurb: 'A total stranger walks up and says hello, by name.',
    description:
      'Public space. A quiet moment. A total stranger walks up to the PC and says hello using their name. Calm. Friendly. Like old acquaintances.\n\n"It\'s been a long time. You look good. How\'s the [thing the PC actually does for a living]?"\n\nHuman, mid-50s, well-dressed but unremarkable. The PC has never seen them before. The stranger is patient and will chat for as long as the PC lets them. If pushed — "Who are you?" — they laugh gently: "It\'s me. We met after the — well. You know." And they trail off, watching the PC\'s face. Waiting for recognition that does not arrive.\n\nAfter about a minute the stranger checks their chrono and excuses themselves: "Take care of yourself. And listen — if you start remembering things, write them down. The first hour is the most important." They walk away into the crowd. The PC will not find them again. As they go, the PC sees them touch their ear once. Like ending a call.\n\nReading: Amnesia. The hardest tilt toward it.',
    tags: ['social', 'investigation'],
    npcs: ['The Stranger (Human, mid-50s, neutral, trained)'],
    beats: [
      'Hard Charm — one more detail. "Your real name. You used to use it. I\'m sorry — I shouldn\'t have said that. Forget I did."',
      'Daunting Vigilance — the stranger isn\'t looking at the PC\'s face when they "recognize" them. They\'re looking past, at a reflection in a window or a screen.',
      'Hard Streetwise — something about the stranger is too neutral. Trained.',
    ],
  },
  {
    id: 'gundark-spec-force-recurrence',
    title: 'The Spec-Force Rappel (Recurrence)',
    blurb: 'They\'ve followed. The PC\'s job is to break line of sight.',
    description:
      'Wherever the PC is, the Spec-Force unit finds them. They drop through skylights, breach through walls, rappel down from overpasses, or simply walk in. No warnings. No demands.\n\nSame unit as the cantina. If Karra dropped one, the unit is down to three. If Six only winded them, full four.\n\nUse this scene 1–2 times across the night. No more. Each use raises the dread but loses its punch if overused.\n\nBroker Touch: they don\'t shout. They don\'t communicate visibly. They flow. The PC may notice — if they have a quiet second to look — that none of them has ever spoken aloud all night.',
    tags: ['combat', 'chase'],
    npcs: ['Spec-Force Unit (returning, possibly down 1)'],
    beats: [
      'No skill checks. Run. Break line of sight; disappear into chaos.',
      'Average Streetwise (in a crowd) to lose them.',
      'Hard Athletics — cross a structural gap (jump, climb, swing).',
      'Hard Stealth — even with cover, stealth against this unit is Hard.',
    ],
  },
  {
    id: 'gundark-empty-apartment',
    title: 'The Empty Apartment',
    blurb: 'A dead man in the kitchen chair has the PC\'s face.',
    description:
      'A modest apartment on an upper gallery. Lights low. Rain on the window. The door is unlocked.\n\nIn the kitchen chair, facing the door, posed carefully — a dead man. Fresh. Eyes open. Hands folded. He has been dead less than an hour. He has the PC\'s face. Not similar — the PC\'s face. Same scars, same coloring, same hairline. He wears different clothes; his hands are unscarred where the PC\'s are scarred; there is a small surgical mark behind one of his ears that the PC does not have.\n\nThe room is otherwise clean. No struggle, no killer\'s traces. A datapad rests screen-down on the table. When picked up, it shows a single Aurebesh word: the recurring phrase. The chrono on the dead man\'s wrist matches the chrono of the runner in the cantina — both wrong by three minutes.\n\nThis scene is the spine of the night\'s mystery if you use it. Don\'t use it lightly. It will define the session.',
    tags: ['investigation'],
    npcs: ['The dead man (has the PC\'s face)'],
    beats: [
      'Hard Medicine — single clean stunbolt to the chest at close range. Mercy kill or execution.',
      'Daunting Knowledge — clone tech, surgical mimicry, something stranger. No conclusion is satisfying.',
      'Search the apartment. It is lived-in. Someone has been here for weeks. Notes in a handwriting almost the PC\'s own.',
    ],
  },
  {
    id: 'gundark-rooftop-standoff',
    title: 'The Rooftop Standoff',
    blurb: 'A three-way moment. A comm chirps. Both sides lower their weapons.',
    description:
      'A rooftop. Rain. Neon glow from below painting everything magenta and green. The PC arrives at the edge — and so does the Spec-Force unit. From the other side, a third figure: the rescuer. Hood down for the first time. Their face is — GM\'s pick. The recurring face. Or someone else who looks like the PC. Or someone the PC actually knows.\n\nA three-way moment. The unit raises weapons. The rescuer raises theirs.\n\n"Don\'t make me," the rescuer says. To whom is unclear.\n\nThen a comm chirps. Both the unit and the rescuer hear it. Both react. Both lower their weapons.\n\n"It\'s over for tonight. Go home. Sleep. Tomorrow\'s a different problem."\n\nThe rescuer leaves. The unit leaves. The rooftop is empty except for the PC and the rain.\n\nBroker Touch: the comm chirp. Both sides obeyed. They were both taking orders from the same source.\n\nThis scene can be a Landing.',
    tags: ['combat', 'social'],
    npcs: [
      'Spec-Force Unit (full strength or reduced)',
      'The Rescuer (hood finally down — GM\'s pick on the face)',
    ],
    beats: [
      'Hard Cool/Discipline — keep their head and read the room.',
      'Daunting Charm/Coercion — talk through the standoff: to the unit, to the rescuer, to themselves.',
      'Hard Vigilance — the Spec-Force operators are waiting for something. They have not fired. They have not moved.',
      'The comm chirp lands. Both sides lower weapons. Use the Rainy Rooftop landing here or improvise an exit.',
    ],
  },
  {
    id: 'gundark-landing-rainy-rooftop',
    title: 'Landing — The Rainy Rooftop',
    blurb: 'A stranger on the railing. "Hell of a night."',
    description:
      'After a long chase or the Rooftop Standoff. Quiet. Cold. Almost peaceful.\n\nThe PC finds themselves on a rooftop alone, in the rain, the neon canyon below. Someone is already up there — a stranger, leaning on the railing, not turning around. They do not speak. The PC can sit, stand, leave.\n\nAfter a long moment, still not turning: "Hell of a night. You\'ll sleep tonight, you know. They\'ll let you. Probably won\'t remember most of it tomorrow either. You\'ll go to work. You\'ll have your coffee. You\'ll think it was a dream. Until something reminds you."\n\nThey turn. Their face is something the PC has seen tonight — the recurring face, or themselves, or someone they never identified. Briefly. And then they walk away across the rooftop and are gone. The PC is alone with the rain.\n\nEnd session.',
    tags: ['social'],
    npcs: ['The stranger on the rooftop'],
  },
];
