// Autocomplete engine for Spotlight. Walks the user's input + caret position
// and returns the right suggestion list for "where the cursor is" — field
// names if the user is typing the prefix, value suggestions if past the colon.

import generatedIndex from './spotlightIndex.generated.json';
import extras from './spotlightExtras.json';
import { computeNumericStats, evaluate, FIELDS, getNumericStats, lookupField, SKILL_FIELDS } from './spotlightQuery';
import type { FieldDef, Token } from './spotlightQuery';

const getPath = (obj: any, path: string[]): any => {
  let cur = obj;
  for (const k of path) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
};

export type SuggestionKind = 'field' | 'value';

export interface Suggestion {
  display: string; // shown in the popup
  insert: string;  // text inserted into the input
  hint?: string;   // optional small caption (e.g. count, tier)
  /** When true, accepting this suggestion produces a complete token (inserts a
   *  trailing space, which the parent extractor turns into a chip). Used for
   *  smart suggestions like `type:minion` from a bare `mini` prefix. */
  complete?: boolean;
  /** When true, clicking this item toggles it into a multi-select set instead
   *  of immediately committing. Tab/Enter commits the accumulated set as a
   *  single chip (comma-list, collapsing to dash-range when contiguous). */
  multiSelectable?: boolean;
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
// Counts the v4.2 `coreArchetype` per adversary so `archetype:` autocompletes
// against the 30 archetype names.
const archetypeCounts = new Map<string, number>();
// Counts OggDude broad role tags (Shooter, Bruiser, Scout, ...) for `role:`.
const roleCounts = new Map<string, number>();
const factionCounts = new Map<string, number>();
const traitCounts = new Map<string, number>();
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
    if (typeof d.coreArchetype === 'string' && d.coreArchetype) bumpMap(archetypeCounts, d.coreArchetype);
    if (typeof d.archetype === 'string' && d.archetype) bumpMap(roleCounts, d.archetype);
    for (const f of (d.factions || []) as string[]) bumpMap(factionCounts, String(f));
    for (const t of (d.traits || []) as string[]) bumpMap(traitCounts, String(t));
  }
  if (e.type === 'talent') bumpMap(talentNames, String(e.name));
  if (e.type === 'weapon') bumpMap(weaponNames, String(e.name));
}

// Canonical SWRPG skills (from spotlightQuery) supplement anything we found.
for (const s of SKILL_FIELDS) skillNamesAll.add(s.full);

// (Numeric range/quartile stats live in spotlightQuery.ts now and are accessed
// via getNumericStats so both the popup hints and the predicate evaluator share
// a single source of truth.)

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
const RANKED_ARCHETYPES = rank(archetypeCounts);
const RANKED_ROLES = rank(roleCounts);
const RANKED_FACTIONS = rank(factionCounts);
const RANKED_TRAITS = rank(traitCounts);
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

function fieldSuggestions(prefix: string, contextTokens: Token[] = []): Suggestion[] {
  const lower = prefix.toLowerCase();
  const items: Suggestion[] = [];
  const seen = new Set<string>();

  // 1. Field-name completions. Aliases get their own row so shorthand like
  //    `t:` and `br:` is discoverable.
  for (const f of FIELDS) {
    const candidates = [f.name, ...(f.aliases || [])];
    for (const c of candidates) {
      const key = `f:${c}`;
      if (seen.has(key)) continue;
      if (lower && !c.startsWith(lower)) continue;
      seen.add(key);
      items.push({
        display: `${c}:`,
        insert: `${c}:`,
        hint: f.description,
      });
    }
  }

  // 2. Smart value matches across `smart`-flagged fields. Lets the user type
  //    `mini` and pick `type:minion`, or `creat` and pick `archetype:Beast/Creature`,
  //    without remembering the field name first. Substring match for lookup-name
  //    fields (so "creature" matches "Beast/Creature") and prefix for enum/bool.
  for (const f of FIELDS) {
    if (!f.smart) continue;
    if (f.kind === 'enum' && f.enumValues) {
      for (const v of f.enumValues) {
        const lv = v.toLowerCase();
        const key = `v:${f.name}:${lv}`;
        if (seen.has(key)) continue;
        if (lower && !lv.startsWith(lower)) continue;
        seen.add(key);
        items.push({
          display: `${f.name}:${lv}`,
          insert: `${f.name}:${lv}`,
          hint: f.description,
          complete: true,
        });
      }
    } else if (f.kind === 'bool') {
      for (const v of ['true', 'false']) {
        const key = `v:${f.name}:${v}`;
        if (seen.has(key)) continue;
        if (lower && !v.startsWith(lower)) continue;
        seen.add(key);
        items.push({
          display: `${f.name}:${v}`,
          insert: `${f.name}:${v}`,
          hint: f.description,
          complete: true,
        });
      }
    } else if (f.kind === 'lookup-name' && f.arrayPath) {
      // Smart suggestions use the same context-aware counts as the value
      // popup, so typing `imp` while `archetype:soldier` is active surfaces
      // `faction:Imperial · 23 entries` rather than the global tally.
      const list = contextualCounts(f, contextTokens);
      for (const v of list) {
        const lv = v.name.toLowerCase();
        const key = `v:${f.name}:${lv}`;
        if (seen.has(key)) continue;
        if (lower && !lv.includes(lower)) continue;
        seen.add(key);
        items.push({
          display: `${f.name}:${v.name}`,
          insert: `${f.name}:${v.name.toLowerCase()}`,
          hint: `${v.count} ${v.count === 1 ? 'entry' : 'entries'}`,
          complete: true,
        });
      }
    }
  }

  return items.slice(0, 30);
}

function filterByPrefix<T extends { name: string }>(list: T[], prefix: string): T[] {
  if (!prefix) return list;
  const lower = prefix.toLowerCase();
  return list.filter((x) => x.name.toLowerCase().includes(lower));
}

// Walk the index filtered by the active context (chip tokens minus any token
// on the field being completed) and count how many entries each candidate
// value of `field` appears in. Lets the popup show "Imperial · 23" instead
// of "Imperial · 148" when the user has already restricted to e.g.
// `archetype:soldier`. Sorted by count descending.
function contextualCounts(field: FieldDef, contextTokens: Token[]): Array<{ name: string; count: number }> {
  const others = contextTokens.filter((t) => !t.order && t.field !== field.name);
  const counts = new Map<string, number>();
  const bump = (k: string | undefined | null) => {
    if (!k) return;
    counts.set(k, (counts.get(k) || 0) + 1);
  };
  for (const e of indexEntries) {
    if (field.appliesTo && !field.appliesTo.includes(e.type as any)) continue;
    if (others.length > 0 && !evaluate(e, others)) continue;
    if (field.kind === 'lookup-name' && field.arrayPath) {
      const v = getPath(e.detail, field.arrayPath);
      if (Array.isArray(v)) {
        for (const x of v) bump(typeof x === 'string' ? x : x?.name);
      } else if (typeof v === 'string' && v) {
        bump(v);
      }
    } else if (field.kind === 'tag') {
      for (const t of e.tags || []) bump(String(t));
      const detailTags = (e.detail as any)?.tags;
      if (Array.isArray(detailTags)) for (const t of detailTags) bump(String(t));
    } else if (field.kind === 'enum' && field.detailPath) {
      const v = getPath(e.detail, field.detailPath);
      if (v != null) bump(String(v));
    } else if (field.kind === 'bool' && field.detailPath) {
      const v = getPath(e.detail, field.detailPath);
      if (v === true) bump('true');
      else if (v === false) bump('false');
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function valueSuggestions(field: FieldDef, valuePrefix: string, contextTokens: Token[] = []): Suggestion[] {
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
    case 'lookup-name': {
      // Counts are recomputed against whatever filters are already active
      // (e.g. with `archetype:soldier` chipped, `faction:` shows how many
      // soldiers are in each faction rather than the global numbers).
      const list = contextualCounts(field, contextTokens);
      return filterByPrefix(list, valuePrefix)
        .slice(0, 30)
        .map((t) => ({
          display: t.name,
          insert: t.name,
          hint: `${t.count} ${t.count === 1 ? 'entry' : 'entries'}`,
        }));
    }
    case 'numeric': {
      // Human-named buckets, anchored on the field's actual distribution
      // (contextually scoped so `wounds:` under `type:nemesis` uses nemesis
      // stats, not the union). For small-distinct fields like clout (1–5),
      // we list every individual value plus the natural "≥N" ranges instead
      // of percentile buckets, since percentiles don't make sense there.
      const stats = computeNumericStats(field.name, contextTokens) ?? getNumericStats(field.name);
      const items: Suggestion[] = [];
      items.push({
        display: 'Sort only',
        insert: '',
        hint: 'Add a sort arrow without filtering',
        complete: true,
      });
      if (stats?.uniqueValues && stats.uniqueValues.length > 1 && stats.uniqueValues.length <= 7) {
        const u = stats.uniqueValues;
        // Each discrete value as a multi-selectable pick, highest first.
        // Click to toggle multiple values; Tab/Enter commits the accumulated
        // set as a single chip (comma-list, collapsed to dash-range when
        // contiguous). Ranges (≥/≤/A–B) are reachable by selecting multiple
        // values rather than as separate options.
        for (let i = u.length - 1; i >= 0; i--) {
          const v = u[i];
          items.push({
            display: `${field.name} = ${v}`,
            insert: `${v}`,
            multiSelectable: true,
          });
        }
      } else if (stats) {
        const { p25, p50, p75, min, max } = stats;
        items.push({
          display: 'Low',
          insert: 'low',
          hint: `${field.name} ≤ ${p25} (bottom 25%, min ${min})`,
          complete: true,
        });
        if (p50 > p25) {
          items.push({
            display: 'Below average',
            insert: `<${p50}`,
            hint: `${field.name} < ${p50}`,
          });
        }
        if (p75 > p50) {
          items.push({
            display: 'Above average',
            insert: `>=${p50}`,
            hint: `${field.name} ≥ ${p50}`,
          });
        }
        items.push({
          display: 'High',
          insert: 'high',
          hint: `${field.name} ≥ ${p75} (top 25%, max ${max})`,
          complete: true,
        });
      } else {
        items.push({ display: 'Low', insert: 'low', hint: 'sort ascending', complete: true });
        items.push({ display: 'High', insert: 'high', hint: 'sort descending', complete: true });
      }
      return items;
    }
    case 'text':
      return [];
  }
  return [];
}

export function getSuggestions(
  input: string,
  caret: number,
  contextTokens: Token[] = [],
): SuggestResult | null {
  const word = currentWord(input, caret);
  if (!word) return null;
  const colon = word.text.indexOf(':');
  if (colon === -1) {
    // Completing the field name.
    const items = fieldSuggestions(word.text, contextTokens);
    if (items.length === 0) return null;
    return { replaceRange: [word.start, word.end], kind: 'field', items };
  }

  const fieldName = word.text.slice(0, colon).toLowerCase();
  const def = lookupField(fieldName);
  if (!def) return null;

  const after = word.text.slice(colon + 1);
  // For numeric fields, replace the whole value half (operator included) so a
  // user editing `soak:<5` can pick `low` / `high` / `>=4` and have it cleanly
  // overwrite. For other kinds, an operator doesn't apply — replace from `:`.
  const replaceStart = word.start + colon + 1;

  // Compute the prefix to filter suggestions by. Strip a leading operator for
  // numeric so `>=` doesn't kill the suggestion list when the user reopens
  // the popup on an existing chip.
  let valuePrefix = after;
  if (def.kind === 'numeric') {
    const opMatch = /^(>=|<=|!=|>|<|=)/.exec(after);
    if (opMatch) valuePrefix = after.slice(opMatch[0].length);
  }

  const items = valueSuggestions(def, valuePrefix, contextTokens);
  if (items.length === 0) return null;
  return {
    replaceRange: [replaceStart, word.end],
    kind: 'value',
    field: def,
    items,
  };
}

// Apply an accepted suggestion, returning the new input string and the caret
// position after the inserted text. Trailing space is added when the suggestion
// is a complete token (value-half completions, or smart matches like
// `type:minion` from a bare prefix), so the parent extractor can immediately
// commit it as a chip.
export function applySuggestion(
  input: string,
  result: SuggestResult,
  item: Suggestion,
): { next: string; caret: number } {
  const [start, end] = result.replaceRange;
  const wantsSpace = result.kind === 'value' || item.complete === true;
  const trail = wantsSpace ? ' ' : '';
  const inserted = item.insert + trail;
  const next = input.slice(0, start) + inserted + input.slice(end);
  return { next, caret: start + inserted.length };
}
