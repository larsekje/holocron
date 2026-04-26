// Autocomplete engine for Spotlight. Walks the user's input + caret position
// and returns the right suggestion list for "where the cursor is" — field
// names if the user is typing the prefix, value suggestions if past the colon.

import generatedIndex from './spotlightIndex.generated.json';
import extras from './spotlightExtras.json';
import { FIELDS, lookupField, SKILL_FIELDS } from './spotlightQuery';
import type { FieldDef } from './spotlightQuery';

export type SuggestionKind = 'field' | 'value';

export interface Suggestion {
  display: string; // shown in the popup
  insert: string;  // text inserted into the input
  hint?: string;   // optional small caption (e.g. count, tier)
}

export interface SuggestResult {
  // Slice of the input that should be replaced when a suggestion is accepted.
  replaceRange: [number, number];
  // Whether the rendered suggestion should append `:` (field) or ` ` (value).
  kind: SuggestionKind;
  field?: FieldDef; // present for value suggestions
  items: Suggestion[];
}

// ---------------------------------------------------------------------------
// Pre-built lists derived from the index — built once at module load.

interface IndexEntryShape {
  type: string;
  name: string;
  detail?: any;
  tags?: string[];
}

const indexEntries: IndexEntryShape[] = [
  ...(Array.isArray(generatedIndex) ? (generatedIndex as IndexEntryShape[]) : []),
  ...(Array.isArray(extras) ? (extras as IndexEntryShape[]) : []),
];

// Strip a trailing rank, e.g. "Adversary 4" → "Adversary", "Stalker 2" → "Stalker".
const stripRank = (s: string) => s.replace(/\s+\d+$/, '').trim();

const tagCounts = new Map<string, number>();
const talentNames = new Map<string, number>(); // name → entries containing it
const weaponNames = new Map<string, number>();
const abilityNames = new Map<string, number>();
const gearNames = new Map<string, number>();
const skillNamesAll = new Set<string>();

const bumpMap = (m: Map<string, number>, k: string) => {
  if (!k) return;
  m.set(k, (m.get(k) || 0) + 1);
};

for (const e of indexEntries) {
  for (const t of e.tags || []) bumpMap(tagCounts, String(t));
  if (e.type === 'adversary') {
    const d = e.detail || {};
    for (const t of (d.talents || []) as string[]) bumpMap(talentNames, stripRank(String(t)));
    for (const w of (d.weapons || []) as any[]) {
      if (typeof w === 'string') bumpMap(weaponNames, w);
      else if (w?.name) bumpMap(weaponNames, String(w.name));
    }
    for (const a of (d.abilities || []) as any[]) {
      if (typeof a === 'string') bumpMap(abilityNames, stripRank(String(a)));
      else if (a?.name) bumpMap(abilityNames, String(a.name));
    }
    for (const g of (d.gear || []) as any[]) {
      if (typeof g === 'string') bumpMap(gearNames, g);
      else if (g?.name) bumpMap(gearNames, String(g.name));
    }
    if (d.skills && typeof d.skills === 'object') {
      for (const k of Object.keys(d.skills)) skillNamesAll.add(k);
    }
  }
  if (e.type === 'talent') bumpMap(talentNames, String(e.name));
  if (e.type === 'weapon') bumpMap(weaponNames, String(e.name));
}

// Canonical SWRPG skills (from spotlightQuery) supplement anything we found.
for (const s of SKILL_FIELDS) skillNamesAll.add(s.full);

// Sort suggestions by frequency descending, then alphabetically.
function rank(m: Map<string, number>): Array<{ name: string; count: number }> {
  return Array.from(m.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
}

const RANKED_TAGS = rank(tagCounts);
const RANKED_TALENTS = rank(talentNames);
const RANKED_WEAPONS = rank(weaponNames);
const RANKED_ABILITIES = rank(abilityNames);
const RANKED_GEAR = rank(gearNames);
const RANKED_SKILLS = Array.from(skillNamesAll).sort();

// ---------------------------------------------------------------------------
// Caret-aware suggestions

function currentWord(input: string, caret: number): { start: number; end: number; text: string } | null {
  if (caret < 0 || caret > input.length) return null;
  let start = caret;
  while (start > 0 && !/\s/.test(input[start - 1])) start--;
  let end = caret;
  while (end < input.length && !/\s/.test(input[end])) end++;
  if (start === end) return null;
  return { start, end, text: input.slice(start, end) };
}

function fieldSuggestions(prefix: string): Suggestion[] {
  const lower = prefix.toLowerCase();
  // For each field, prefer the canonical name; show aliases as separate rows so
  // the user discovers shorthand like `t:` and `br:`.
  const items: Suggestion[] = [];
  const seen = new Set<string>();
  for (const f of FIELDS) {
    const candidates = [f.name, ...(f.aliases || [])];
    for (const c of candidates) {
      if (seen.has(c)) continue;
      if (lower && !c.startsWith(lower)) continue;
      seen.add(c);
      items.push({
        display: `${c}:`,
        insert: `${c}:`,
        hint: f.description,
      });
    }
  }
  return items.slice(0, 30);
}

function filterByPrefix<T extends { name: string }>(list: T[], prefix: string): T[] {
  if (!prefix) return list;
  const lower = prefix.toLowerCase();
  return list.filter((x) => x.name.toLowerCase().includes(lower));
}

function valueSuggestions(field: FieldDef, valuePrefix: string): Suggestion[] {
  const lower = valuePrefix.toLowerCase();
  switch (field.kind) {
    case 'type-scope':
      return [];
    case 'bool':
      return ['true', 'false']
        .filter((v) => v.startsWith(lower))
        .map((v) => ({ display: v, insert: v }));
    case 'enum':
      return (field.enumValues || [])
        .filter((v) => v.toLowerCase().startsWith(lower))
        .map((v) => ({ display: v, insert: v.toLowerCase() }));
    case 'tag':
      return filterByPrefix(RANKED_TAGS, valuePrefix)
        .slice(0, 30)
        .map((t) => ({ display: t.name, insert: t.name, hint: `${t.count} ${t.count === 1 ? 'entry' : 'entries'}` }));
    case 'lookup-name': {
      const arrayPath = (field.arrayPath || []).join('.');
      const list =
        arrayPath === 'talents'
          ? RANKED_TALENTS
          : arrayPath === 'abilities'
          ? RANKED_ABILITIES
          : arrayPath === 'gear'
          ? RANKED_GEAR
          : arrayPath === 'weapons'
          ? RANKED_WEAPONS
          : [];
      return filterByPrefix(list, valuePrefix)
        .slice(0, 30)
        .map((t) => ({ display: t.name, insert: t.name, hint: `${t.count} ${t.count === 1 ? 'use' : 'uses'}` }));
    }
    case 'numeric': {
      // Operator-only stubs if user hasn't typed an op yet (caller already
      // strips a typed op before we get here, so this is the empty-value case).
      return [
        { display: '>=3', insert: '>=3' },
        { display: '>=4', insert: '>=4' },
        { display: '>=5', insert: '>=5' },
        { display: '<3', insert: '<3' },
        { display: '<5', insert: '<5' },
      ].filter((s) => !lower || s.display.startsWith(lower));
    }
    case 'text':
      return [];
  }
  return [];
}

export function getSuggestions(input: string, caret: number): SuggestResult | null {
  const word = currentWord(input, caret);
  if (!word) return null;
  const colon = word.text.indexOf(':');
  if (colon === -1) {
    // Completing the field name.
    const items = fieldSuggestions(word.text);
    if (items.length === 0) return null;
    return { replaceRange: [word.start, word.end], kind: 'field', items };
  }

  const fieldName = word.text.slice(0, colon).toLowerCase();
  const def = lookupField(fieldName);
  if (!def) return null;

  // Skip the operator if the user already typed one — it stays in the input.
  const after = word.text.slice(colon + 1);
  const opMatch = /^(>=|<=|!=|>|<|=)/.exec(after);
  const opLen = opMatch ? opMatch[0].length : 0;
  const valuePrefix = after.slice(opLen);

  const items = valueSuggestions(def, valuePrefix);
  if (items.length === 0) return null;
  return {
    replaceRange: [word.start + colon + 1 + opLen, word.end],
    kind: 'value',
    field: def,
    items,
  };
}

// Apply an accepted suggestion, returning the new input string and the caret
// position after the inserted text.
export function applySuggestion(
  input: string,
  result: SuggestResult,
  item: Suggestion,
): { next: string; caret: number } {
  const [start, end] = result.replaceRange;
  // Field suggestions already include the colon; value suggestions get a trailing
  // space so the user can immediately type the next token.
  const trail = result.kind === 'value' ? ' ' : '';
  const inserted = item.insert + trail;
  const next = input.slice(0, start) + inserted + input.slice(end);
  return { next, caret: start + inserted.length };
}
