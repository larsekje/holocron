// Query language for Spotlight: parses tokens like `type:minion`, `soak:>=5`,
// `talent:adversary`, `tag:imperial` out of the raw input string and produces
// predicates that filter the spotlight index. Anything that isn't a recognised
// field token stays in the residual, which gets fuzzy-matched against names.
//
// Tokens AND together; there's no OR/NOT/parens. That keeps the grammar small
// and the autocomplete tractable.

import type { SpotlightEntityType } from '@/state/spotlightStore';
import generatedIndex from './spotlightIndex.generated.json';
import extras from './spotlightExtras.json';

export type Op = '=' | '!=' | '>' | '>=' | '<' | '<=';

export type FieldKind =
  | 'type-scope' // adv:, t:, weapon:, rule:, quality: — value-less, scopes results to an entity type
  | 'enum'       // type:minion, type:rival, type:nemesis
  | 'bool'       // named:true|false
  | 'numeric'    // soak:>=5, brawn:>=3
  | 'tag'        // tag:imperial — substring against entry.tags / detail.tags
  | 'lookup-name' // talent:adversary — substring against an array of names on the entry detail
  | 'text';      // desc:cybernetic — substring against description

export interface FieldDef {
  name: string;            // canonical name as the user types it (without the colon)
  aliases?: string[];
  kind: FieldKind;
  description: string;     // shown in the help overlay
  examples: string[];      // shown in the help overlay
  group: string;           // grouping for the help overlay
  enumValues?: string[];   // for kind === 'enum'
  entityType?: SpotlightEntityType; // for kind === 'type-scope'
  detailPath?: string[];   // path into entry.detail for numeric / bool / text fields
  arrayPath?: string[];    // path into entry.detail for lookup-name (array of strings or {name})
  appliesTo?: SpotlightEntityType[]; // narrow which entity types this field applies to
  // When true, this field's values participate in bare-prefix smart autocomplete
  // (typing `creat` suggests `archetype:Beast/Creature`). Only enable for
  // fields with a small, bounded value set — talents/weapons would explode the
  // popup with hundreds of options.
  smart?: boolean;
}

// Canonical SWRPG skill list. Used to register top-level skill fields and to
// power skill-name autocomplete suggestions.
export const SKILL_FIELDS: ReadonlyArray<{ name: string; aliases?: string[]; full: string }> = [
  { name: 'athletics', full: 'Athletics' },
  { name: 'brawl', full: 'Brawl' },
  { name: 'charm', full: 'Charm' },
  { name: 'coercion', full: 'Coercion' },
  { name: 'computers', full: 'Computers' },
  { name: 'cool', full: 'Cool' },
  { name: 'coordination', full: 'Coordination' },
  { name: 'deception', full: 'Deception' },
  { name: 'discipline', full: 'Discipline' },
  { name: 'gunnery', full: 'Gunnery' },
  { name: 'leadership', full: 'Leadership' },
  { name: 'lightsaber', full: 'Lightsaber' },
  { name: 'mechanics', full: 'Mechanics' },
  { name: 'medicine', full: 'Medicine' },
  { name: 'melee', full: 'Melee' },
  { name: 'negotiation', full: 'Negotiation' },
  { name: 'perception', full: 'Perception' },
  { name: 'piloting-planetary', aliases: ['pp'], full: 'Piloting: Planetary' },
  { name: 'piloting-space', aliases: ['ps'], full: 'Piloting: Space' },
  { name: 'ranged-heavy', aliases: ['rh'], full: 'Ranged: Heavy' },
  { name: 'ranged-light', aliases: ['rl'], full: 'Ranged: Light' },
  { name: 'resilience', full: 'Resilience' },
  { name: 'skulduggery', full: 'Skulduggery' },
  { name: 'stealth', full: 'Stealth' },
  { name: 'streetwise', full: 'Streetwise' },
  { name: 'survival', full: 'Survival' },
  { name: 'vigilance', full: 'Vigilance' },
];

const skillNumericFields: FieldDef[] = SKILL_FIELDS.map((s) => ({
  name: s.name,
  aliases: s.aliases,
  kind: 'numeric',
  description: `Adversary's rank in ${s.full}.`,
  examples: [`${s.name}:>=2`, `${s.name}:>=3`],
  group: 'Skills',
  detailPath: ['skills', s.full],
  appliesTo: ['adversary'],
}));

export const FIELDS: FieldDef[] = [
  // Type scopes
  { name: 'adv', aliases: ['adversary'], kind: 'type-scope', entityType: 'adversary',
    description: 'Show only adversaries.', examples: ['adv:'], group: 'Scope' },
  { name: 't', aliases: ['talent'], kind: 'type-scope', entityType: 'talent',
    description: 'Show only talents.', examples: ['t:'], group: 'Scope' },
  { name: 'w', aliases: ['weapon'], kind: 'type-scope', entityType: 'weapon',
    description: 'Show only weapons.', examples: ['w:'], group: 'Scope' },
  { name: 'rule', kind: 'type-scope', entityType: 'rule',
    description: 'Show only rules.', examples: ['rule:'], group: 'Scope' },
  { name: 'quality', kind: 'type-scope', entityType: 'quality',
    description: 'Show only weapon qualities.', examples: ['quality:'], group: 'Scope' },

  // Booleans / enums on adversaries
  { name: 'named', kind: 'bool', detailPath: ['named'], appliesTo: ['adversary'], smart: true,
    description: 'Filter named (true) vs unnamed (false) adversaries.',
    examples: ['named:false', 'named:true'], group: 'Adversary' },
  { name: 'adventure', aliases: ['module'], kind: 'bool', detailPath: ['fromAdventure'], appliesTo: ['adversary'], smart: true,
    description: 'Filter adversaries that appear in a pre-written adventure (true) vs sourcebook/generic profiles (false).',
    examples: ['adventure:false', 'adventure:true'], group: 'Adversary' },
  { name: 'type', kind: 'enum', detailPath: ['adversaryType'], appliesTo: ['adversary'], smart: true,
    enumValues: ['Minion', 'Rival', 'Nemesis'],
    description: 'Adversary tier.',
    examples: ['type:minion', 'type:rival', 'type:nemesis'], group: 'Adversary' },
  { name: 'clout', kind: 'numeric', detailPath: ['clout'], appliesTo: ['adversary'],
    description: 'Adversary clout (1–5 threat summary: characteristic level, common dice pool, common difficulty against).',
    examples: ['clout:5', 'clout:>=4', 'clout:high'], group: 'Adversary' },

  // Tags (work across entity types)
  { name: 'tag', kind: 'tag',
    description: 'Substring match against the entry tags.',
    examples: ['tag:imperial', 'tag:rebel'], group: 'Tags' },

  // Description (substring across all entries)
  { name: 'desc', kind: 'text', detailPath: ['description'],
    description: 'Substring match against the description body.',
    examples: ['desc:cybernetic'], group: 'Tags' },

  // Characteristics
  ...(['Brawn', 'Agility', 'Intellect', 'Cunning', 'Willpower', 'Presence'].map((c) => {
    const aliases: Record<string, string[]> = {
      Brawn: ['br'], Agility: ['ag'], Intellect: ['int'],
      Cunning: ['cun'], Willpower: ['wil'], Presence: ['pr'],
    };
    return {
      name: c.toLowerCase(),
      aliases: aliases[c],
      kind: 'numeric' as const,
      description: `Adversary's ${c}.`,
      examples: [`${c.toLowerCase()}:>=3`],
      group: 'Characteristics',
      detailPath: ['characteristics', c],
      appliesTo: ['adversary'] as SpotlightEntityType[],
    };
  })),

  // Derived
  { name: 'soak', kind: 'numeric', detailPath: ['derived', 'soak'], appliesTo: ['adversary'],
    description: 'Adversary soak.', examples: ['soak:>=5'], group: 'Derived' },
  { name: 'wounds', aliases: ['hp', 'wt'], kind: 'numeric', detailPath: ['derived', 'wounds'], appliesTo: ['adversary'],
    description: 'Wound threshold (aliased as hp / wt).',
    examples: ['wounds:<10', 'hp:<3'], group: 'Derived' },
  { name: 'strain', aliases: ['st'], kind: 'numeric', detailPath: ['derived', 'strain'], appliesTo: ['adversary'],
    description: 'Strain threshold.', examples: ['strain:>=15'], group: 'Derived' },

  // Skills (numeric per skill)
  ...skillNumericFields,

  // Lookups across adversary lists
  { name: 'role', kind: 'lookup-name', arrayPath: ['coreArchetype'], appliesTo: ['adversary'], smart: true,
    description: 'Adversary role — the specific job (Soldier, Pilot, Nasty Beast, Kingpin, Medic, ...).',
    examples: ['role:soldier', 'role:nasty', 'role:kingpin', 'role:medic'],
    group: 'Adversary groupings' },
  { name: 'archetype', kind: 'lookup-name', arrayPath: ['archetype'], appliesTo: ['adversary'], smart: true,
    description: 'Broad archetype bucket (Combatant, Creature, Specialist, Force, Social, Civilian).',
    examples: ['archetype:combatant', 'archetype:creature', 'archetype:force'],
    group: 'Adversary groupings' },
  { name: 'faction', kind: 'lookup-name', arrayPath: ['factions'], appliesTo: ['adversary'], smart: true,
    description: 'Adversary faction (Imperial, Rebel, Galactic Republic, Underworld, Nature, ...).',
    examples: ['faction:imperial', 'faction:rebel', 'faction:nature'], group: 'Adversary groupings' },
  { name: 'trait', kind: 'lookup-name', arrayPath: ['traits'], appliesTo: ['adversary'], smart: true,
    description: 'Adversary profile — how it fights (Tough, Elite, Glass Cannon, Terrifying, ...).',
    examples: ['trait:tough', 'trait:elite'], group: 'Adversary groupings' },
  { name: 'talent', kind: 'lookup-name', arrayPath: ['talents'], appliesTo: ['adversary'],
    description: 'Adversary has a talent matching this substring.',
    examples: ['talent:adversary', 'talent:nemesis'], group: 'Adversary lookups' },
  { name: 'ability', kind: 'lookup-name', arrayPath: ['abilities'], appliesTo: ['adversary'],
    description: 'Adversary has an ability matching this substring.',
    examples: ['ability:nightsister', 'ability:force'], group: 'Adversary lookups' },
  { name: 'gear', kind: 'lookup-name', arrayPath: ['gear'], appliesTo: ['adversary'],
    description: 'Adversary carries gear matching this substring.',
    examples: ['gear:datapad'], group: 'Adversary lookups' },
  { name: 'equipped', kind: 'lookup-name', arrayPath: ['weapons'], appliesTo: ['adversary'],
    description: 'Adversary wields a weapon matching this substring.',
    examples: ['equipped:lightsaber', 'equipped:blaster'], group: 'Adversary lookups' },
];

const FIELD_BY_NAME: Map<string, FieldDef> = (() => {
  const m = new Map<string, FieldDef>();
  for (const f of FIELDS) {
    m.set(f.name, f);
    for (const a of f.aliases || []) m.set(a, f);
  }
  return m;
})();

export function lookupField(name: string): FieldDef | undefined {
  return FIELD_BY_NAME.get(name.toLowerCase());
}

export function allFieldKeys(): string[] {
  const out: string[] = [];
  for (const f of FIELDS) {
    out.push(f.name);
    if (f.aliases) out.push(...f.aliases);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Token shape and parser

export interface Token {
  field: string;            // canonical field name
  fieldDef: FieldDef;
  op: Op;                   // defaults to '=' when none typed
  value: string;            // empty for type-scope tokens
  range: [number, number];  // [start, end) into the original input string
  raw: string;              // the exact input slice that produced this token
  // When set, this token doesn't filter — it sorts the result list. Triggered
  // by `<numeric>:low` / `:high` / `:asc` / `:desc`.
  order?: 'asc' | 'desc';
}

// Pure-sort shorthand: `field:asc` / `field:desc` only. `:high` and `:low`
// remain as filter values (top / bottom quartile) — sorting is tracked
// separately via UI activeSort state, so only one chip carries an arrow
// indicator at a time.
const ORDER_VALUES: Record<string, 'asc' | 'desc'> = {
  asc: 'asc',
  ascending: 'asc',
  desc: 'desc',
  descending: 'desc',
};

export interface ParsedQuery {
  tokens: Token[];
  residual: string;         // input minus all token slices, whitespace-normalised
}

const OP_REGEX = /^(>=|<=|!=|>|<|=)/;

// Walk the input one whitespace-separated chunk at a time. Anything matching
// `field:value` (where field is a recognised name) is a token; everything else
// becomes residual.
export function parseQuery(input: string): ParsedQuery {
  const tokens: Token[] = [];
  const residualParts: string[] = [];
  const len = input.length;
  let i = 0;
  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(input[i])) i++;
    if (i >= len) break;
    const start = i;
    // Read until next whitespace
    while (i < len && !/\s/.test(input[i])) i++;
    const end = i;
    const chunk = input.slice(start, end);

    const colon = chunk.indexOf(':');
    if (colon <= 0) {
      residualParts.push(chunk);
      continue;
    }
    const fieldName = chunk.slice(0, colon).toLowerCase();
    const fieldDef = lookupField(fieldName);
    if (!fieldDef) {
      // Unknown field — fall back to residual so user sees what they typed.
      residualParts.push(chunk);
      continue;
    }
    const after = chunk.slice(colon + 1);

    // Order shorthand: `<numeric>:low` / `:high` / `:asc` / `:desc`.
    const orderDir = ORDER_VALUES[after.toLowerCase()];
    if (orderDir && fieldDef.kind === 'numeric') {
      tokens.push({
        field: fieldDef.name,
        fieldDef,
        op: '=',
        value: after,
        range: [start, end],
        raw: chunk,
        order: orderDir,
      });
      continue;
    }

    let op: Op = '=';
    let value = after;
    const opMatch = OP_REGEX.exec(after);
    if (opMatch) {
      op = opMatch[1] as Op;
      value = after.slice(opMatch[1].length);
    }
    tokens.push({
      field: fieldDef.name,
      fieldDef,
      op,
      value,
      range: [start, end],
      raw: chunk,
    });
  }
  return { tokens, residual: residualParts.join(' ').trim() };
}

// ---------------------------------------------------------------------------
// Predicate evaluator

function getPath(obj: any, path: string[]): any {
  let cur = obj;
  for (const k of path) {
    if (cur == null) return undefined;
    cur = cur[k];
  }
  return cur;
}

function asNumber(v: any): number | undefined {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

function compareNumeric(a: number, op: Op, b: number): boolean {
  switch (op) {
    case '=': return a === b;
    case '!=': return a !== b;
    case '>': return a > b;
    case '>=': return a >= b;
    case '<': return a < b;
    case '<=': return a <= b;
  }
}

function asStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => (typeof x === 'string' ? x : x?.name ?? ''))
      .filter((s) => typeof s === 'string' && s.length > 0);
  }
  if (typeof v === 'string' && v.length > 0) return [v];
  return [];
}

// Single token against a single index entry. `:high` / `:low` filter values on
// numeric fields are not filtered here — searchIndex applies them in pass 2
// with context-aware quartile thresholds (so e.g. "high wounds" among
// nemeses uses the nemesis distribution).
export function evaluateToken(entry: any, t: Token): boolean {
  if (t.order) return true;
  const def = t.fieldDef;
  const detail = entry?.detail ?? {};
  if (def.kind === 'numeric') {
    const lv = t.value.toLowerCase();
    // High/low quartile filtering is applied at searchIndex level. An empty
    // value means "no filter, just a sort handle for this field".
    if (lv === 'high' || lv === 'low' || lv === '') return true;
  }

  // Type-scope: filter strictly by entity type.
  if (def.kind === 'type-scope') {
    return entry.type === def.entityType;
  }

  // Field is restricted to certain entity types: any other type fails.
  if (def.appliesTo && !def.appliesTo.includes(entry.type)) {
    return false;
  }

  switch (def.kind) {
    case 'bool': {
      const cur = getPath(detail, def.detailPath || []);
      const wanted = /^(true|t|yes|y|1)$/i.test(t.value);
      const actual = cur === true;
      return t.op === '!=' ? actual !== wanted : actual === wanted;
    }
    case 'enum': {
      const cur = getPath(detail, def.detailPath || []);
      if (cur == null) return false;
      const want = t.value.toLowerCase();
      const have = String(cur).toLowerCase();
      return t.op === '!=' ? have !== want : have === want;
    }
    case 'numeric': {
      const target = asNumber(getPath(detail, def.detailPath || []));
      if (target == null) return false;
      // Comma-separated set match: `clout:3,4,5` accepts any of those values.
      // Only meaningful with the default equality op.
      if (t.value.includes(',') && (t.op === '=' || t.op === '!=')) {
        const parts = t.value
          .split(',')
          .map((s) => asNumber(s.trim()))
          .filter((n): n is number => n != null);
        if (parts.length === 0) return false;
        const hit = parts.includes(target);
        return t.op === '!=' ? !hit : hit;
      }
      // Dash range: `clout:2-4` accepts values from 2 to 4 inclusive.
      const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(t.value);
      if (rangeMatch && (t.op === '=' || t.op === '!=')) {
        const a = Number(rangeMatch[1]);
        const b = Number(rangeMatch[2]);
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const hit = target >= lo && target <= hi;
        return t.op === '!=' ? !hit : hit;
      }
      const wanted = asNumber(t.value);
      if (wanted == null) return false;
      return compareNumeric(target, t.op, wanted);
    }
    case 'tag': {
      const tags: string[] = Array.isArray(entry.tags) ? entry.tags : [];
      const detailTags: string[] = Array.isArray(detail.tags) ? detail.tags : [];
      const all = [...tags, ...detailTags].map((s) => String(s).toLowerCase());
      const needle = t.value.toLowerCase();
      const hit = all.some((s) => s.includes(needle));
      return t.op === '!=' ? !hit : hit;
    }
    case 'text': {
      const cur = getPath(detail, def.detailPath || []);
      if (cur == null) return false;
      const hit = String(cur).toLowerCase().includes(t.value.toLowerCase());
      return t.op === '!=' ? !hit : hit;
    }
    case 'lookup-name': {
      const arr = asStringArray(getPath(detail, def.arrayPath || []));
      const needle = t.value.toLowerCase();
      const hit = arr.some((s) => s.toLowerCase().includes(needle));
      return t.op === '!=' ? !hit : hit;
    }
  }
}

export function evaluate(entry: any, tokens: Token[]): boolean {
  for (const t of tokens) {
    if (!evaluateToken(entry, t)) return false;
  }
  return true;
}

// Pull just the order tokens — used by searchIndex to sort filtered results.
export function orderTokens(tokens: Token[]): Token[] {
  return tokens.filter((t) => !!t.order);
}

// ---------------------------------------------------------------------------
// Per-field numeric stats (min, max, 25th/50th/75th percentile). Used to
// decide what `:high` / `:low` mean for a given field. Stats are *contextual*:
// when the user has `type:nemesis` already active, asking for `wounds:high`
// should compare against the nemesis wound distribution, not the union.

export interface NumericStats {
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
  // When the field has a small distinct value set (e.g. clout, 1–5), the
  // sorted unique values so the popup can offer them as discrete picks.
  // Undefined when there are too many to enumerate.
  uniqueValues?: number[];
}

const _allIndexEntries: Array<{ type: string; detail?: any }> = [
  ...(Array.isArray(generatedIndex) ? (generatedIndex as any[]) : []),
  ...(Array.isArray(extras) ? (extras as any[]) : []),
];

const _percentile = (sorted: number[], q: number): number => {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)));
  return sorted[i];
};

// Compute stats for a numeric field across whichever subset of the index
// matches the supplied filter tokens. Order tokens are ignored because they
// don't filter; the `:high`/`:low` quartile filter is applied at searchIndex
// level, not here.
export function computeNumericStats(
  fieldName: string,
  filterTokens: Token[] = [],
): NumericStats | undefined {
  const def = FIELD_BY_NAME.get(fieldName);
  if (!def || def.kind !== 'numeric' || !def.detailPath) return undefined;
  // Don't let the field's own filter tokens influence its own thresholds.
  const others = filterTokens.filter((t) => !t.order && t.field !== def.name);
  const values: number[] = [];
  for (const e of _allIndexEntries) {
    if (def.appliesTo && !def.appliesTo.includes(e.type as SpotlightEntityType)) continue;
    if (!evaluate(e, others)) continue;
    const v = getPath(e.detail ?? {}, def.detailPath);
    const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
    if (Number.isFinite(n)) values.push(n);
  }
  if (values.length === 0) return undefined;
  values.sort((a, b) => a - b);
  const uniqueSet = new Set(values);
  const uniqueValues = uniqueSet.size <= 10 ? Array.from(uniqueSet).sort((a, b) => a - b) : undefined;
  return {
    min: values[0],
    max: values[values.length - 1],
    p25: _percentile(values, 0.25),
    p50: _percentile(values, 0.5),
    p75: _percentile(values, 0.75),
    count: values.length,
    uniqueValues,
  };
}

// Cache the unfiltered (whole-dataset) stats so the popup hints have a fast
// fallback when no context is available.
const _DEFAULT_NUMERIC_STATS = new Map<string, NumericStats>();
for (const f of FIELDS) {
  if (f.kind !== 'numeric') continue;
  const stats = computeNumericStats(f.name, []);
  if (stats) _DEFAULT_NUMERIC_STATS.set(f.name, stats);
}

export function getNumericStats(fieldName: string): NumericStats | undefined {
  return _DEFAULT_NUMERIC_STATS.get(fieldName);
}

// Compare two index entries for a single order token. Returns -1/0/+1 with
// the sign reversed for descending order. Missing values sort to the bottom.
export function compareEntries(a: any, b: any, t: Token): number {
  const path = t.fieldDef.detailPath || [];
  const av = getPath(a?.detail ?? {}, path);
  const bv = getPath(b?.detail ?? {}, path);
  const an = asNumber(av);
  const bn = asNumber(bv);
  // Missing → push to the bottom regardless of direction.
  if (an == null && bn == null) return 0;
  if (an == null) return 1;
  if (bn == null) return -1;
  if (an === bn) return 0;
  return t.order === 'desc' ? bn - an : an - bn;
}

// Convenience: return the set of entity types the type-scope tokens cover.
// Empty set ⇒ no type-scope tokens were typed.
export function tokenEntityTypes(tokens: Token[]): Set<SpotlightEntityType> {
  const out = new Set<SpotlightEntityType>();
  for (const t of tokens) {
    if (t.fieldDef.kind === 'type-scope' && t.fieldDef.entityType) {
      out.add(t.fieldDef.entityType);
    }
  }
  return out;
}

// Remove the slice [start, end) plus any trailing whitespace, returning the new
// input string. Used by chip-removal in the header.
export function removeTokenSlice(input: string, range: [number, number]): string {
  const [start, end] = range;
  let trailingEnd = end;
  while (trailingEnd < input.length && /\s/.test(input[trailingEnd])) trailingEnd++;
  const next = input.slice(0, start) + input.slice(trailingEnd);
  return next.replace(/\s+/g, ' ').trim();
}

// Pull complete tokens out of `input`, returning the raw token strings to commit
// as chips and the remaining residual + caret. A token is "complete" when it's
// followed by whitespace (or another token), AND the caret isn't sitting inside
// it (so users can keep editing a token they're still composing).
export function extractCompletedTokens(
  input: string,
  caret: number,
): { committed: string[]; remaining: string; remainingCaret: number } {
  const parsed = parseQuery(input);
  if (parsed.tokens.length === 0) {
    return { committed: [], remaining: input, remainingCaret: caret };
  }
  const committed: string[] = [];
  let remaining = '';
  let pos = 0;
  let caretAdjusted = caret;
  for (let idx = 0; idx < parsed.tokens.length; idx++) {
    const t = parsed.tokens[idx];
    const caretInside = caret >= t.range[0] && caret <= t.range[1];
    const isLast = idx === parsed.tokens.length - 1;
    const followedByWs = t.range[1] < input.length && /\s/.test(input[t.range[1]]);
    if (!caretInside && (followedByWs || !isLast)) {
      // Append everything between pos and token start to remaining.
      const interlude = input.slice(pos, t.range[0]);
      remaining += interlude;
      // Push token raw to chips.
      committed.push(input.slice(t.range[0], t.range[1]));
      // Advance pos past the token + one whitespace if present.
      pos = t.range[1];
      if (pos < input.length && /\s/.test(input[pos])) pos++;
      // If caret was after the extracted region, shift it left by the token length
      // (plus the eaten whitespace). Approximate but close enough for typing.
      if (caret > t.range[1]) {
        caretAdjusted -= t.range[1] - t.range[0];
        if (input[t.range[1]] && /\s/.test(input[t.range[1]])) caretAdjusted -= 1;
      }
    }
  }
  remaining += input.slice(pos);
  // Normalise whitespace inside what's left.
  const cleaned = remaining.replace(/\s+/g, ' ').replace(/^\s/, '');
  // If we collapsed whitespace, recompute caret to "end of what was before the gap".
  // For simplicity: clamp to bounds.
  const remainingCaret = Math.max(0, Math.min(caretAdjusted, cleaned.length));
  return { committed, remaining: cleaned, remainingCaret };
}
