/**
 * npcDescriptors — a curated pool of "quick little something" bits for fleshing
 * out a one-off roster NPC on the fly. No grand generator; just a dice the GM
 * taps when an unnamed face needs a hook.
 *
 * Spread deliberately across the kinds of people a roster tends to hold:
 * ordinary civilians, cantina/spaceport regulars, and the shadier underworld
 * crowd — plus generic looks/quirks that fit anyone. `rollNpcDescriptor()`
 * returns a quirk, a physical descriptor, or a "descriptor; quirk" combo so
 * repeated rolls feel fresh.
 */

// Physical / at-a-glance looks.
const DESCRIPTORS = [
  // generic
  'scarred jaw, careful smile',
  'cybernetic eye that whirs',
  'missing two fingers',
  'augmetic arm, an older model',
  'one milky, blind eye',
  'a limp from a job gone wrong',
  'rebreather rasp to the voice',
  'sun-cracked skin, off-world accent',
  'braided beard, beads from a dozen worlds',
  'prosthetic leg that clicks when they walk',
  // civilian
  'tired eyes, work-callused hands',
  'patched coveralls, smells of solvent',
  'a child’s drawing folded in a pocket',
  'a datapad never out of their hand',
  'fraying but carefully mended clothes',
  'flour on the apron, kind face',
  // cantina / spaceport
  'spice-stained fingertips',
  'smells of engine grease and caf',
  'glitter-paint from last night still on the collar',
  'a half-finished drink they nurse for hours',
  'pilot’s jacket, too many squadron patches',
  'a sabacc deck they shuffle one-handed',
  // underworld
  'faded gang tattoo on the neck',
  'an old blaster burn they don’t explain',
  'far too many rings for an honest trade',
  'fine clothes, cheap boots — or the reverse',
  'a holdout blaster they keep touching',
  'knuckle-tats spelling something in Huttese',
];

// Behaviour / tells.
const QUIRKS = [
  // generic
  'won’t meet your eye',
  'talks too fast, repeats themselves',
  'hums when they’re lying',
  'flinches at loud noises',
  'taps the table when thinking',
  'forgets your name on purpose',
  'too friendly, too quickly',
  'keeps glancing at a chrono',
  // civilian
  'apologizes for things that aren’t their fault',
  'desperate to be helpful',
  'complains about the local authorities, quietly',
  'mentions their family within a minute',
  'terrified of getting involved',
  'overshares when nervous',
  // cantina / spaceport
  'always counting credits under their breath',
  'name-drops people you’ve never heard of',
  'sizes up everyone who walks in',
  'tells the same story differently each time',
  'buys a round to dodge a question',
  'knows a guy who knows a guy',
  // underworld
  'never sits with their back to the door',
  'loudly distrusts droids',
  'pockets small things that aren’t theirs',
  'prices everything, including you',
  'goes very still when threatened',
  'lies smoothly — except about one thing',
  'speaks almost in a whisper',
];

// Names for a quick one-off NPC — a mix of human-ish full names, single alien
// names, and the odd droid designation. Evocative, not canon.
const NAMES = [
  'Senna Voss', 'Daro Vance', 'Mira Kessel', 'Jovan Tarn', 'Orla Vey',
  'Cael Brun', 'Lira Sann', 'Rax Tovo', 'Nima Drell', 'Bron Vask',
  'Sela Marn', 'Tane Orris', 'Vey Locke', 'Ria Solenne', 'Pax Greeve',
  'Yara Tann', 'Marn Devis', 'Kessa Ru', 'Drev Sako', 'Hessa Quill',
  'Greeve', 'Sklar', 'Bokk', 'Threed', 'Nok-Tal', 'Vexa', 'Zuhl',
  'Honce', 'Sooka', 'Bibo', "Gex'l", 'Mun Tooka', 'Aril', 'Sabba Doxo',
  'Trell', 'Yumo', 'Ekkri', 'Wadda', 'Olun the Lesser', 'Crix Bole',
  'C1-9X', 'TX-44', 'R7-Dox', 'B0-LT', 'Threek (droid)',
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollNpcDescriptor(): string {
  const r = Math.random();
  if (r < 0.4) return pick(QUIRKS);
  if (r < 0.7) return pick(DESCRIPTORS);
  return `${pick(DESCRIPTORS)}; ${pick(QUIRKS)}`;
}

export function rollNpcName(): string {
  return pick(NAMES);
}
