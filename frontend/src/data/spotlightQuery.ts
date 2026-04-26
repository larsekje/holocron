// Query language for Spotlight: parses tokens like `type:minion`, `soak:>=5`,
// `talent:adversary`, `tag:imperial` out of the raw input string and produces
// predicates that filter the spotlight index. Anything that isn't a recognised
// field token stays in the residual, which gets fuzzy-matched against names.
//
// Tokens AND together; there's no OR/NOT/parens. That keeps the grammar small
// and the autocomplete tractable.

import type { SpotlightEntityType } from '@/state/spotlightStore';

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
  { name: 'named', kind: 'bool', detailPath: ['named'], appliesTo: ['adversary'],
    description: 'Filter named (true) vs unnamed (false) adversaries.',
    examples: ['named:false', 'named:true'], group: 'Adversary' },
  { name: 'type', kind: 'enum', detailPath: ['adversaryType'], appliesTo: ['adversary'],
    enumValues: ['Minion', 'Rival', 'Nemesis'],
    description: 'Adversary tier.',
    examples: ['type:minion', 'type:rival', 'type:nemesis'], group: 'Adversary' },

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
}

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
  return [];
}

// Single token against a single index entry.
export function evaluateToken(entry: any, t: Token): boolean {
  const def = t.fieldDef;
  const detail = entry?.detail ?? {};

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
      const wanted = asNumber(t.value);
      if (target == null || wanted == null) return false;
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
