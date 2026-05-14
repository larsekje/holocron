import fuzzysort from 'fuzzysort';
import type {
  SpotlightDetail,
  SpotlightEntityType,
  SpotlightResult,
} from '@/state/spotlightStore';
import { compareEntries, computeNumericStats, evaluate, orderTokens, parseQuery } from './spotlightQuery';

// The generator writes an array of entries of shape:
// { id, type, name, subtitle?, tags?, detail: SpotlightDetail }
import generatedIndex from './spotlightIndex.generated.json';
import extras from './spotlightExtras.json';

type IndexEntry = SpotlightResult & { detail: SpotlightDetail };

// Seed fallback (used only if generation fails or is empty)
const seed: IndexEntry[] = [
  {
    id: 'talent_grit',
    type: 'talent',
    name: 'Grit',
    subtitle: 'Increase Strain Threshold',
    tags: ['Passive'],
    detail: {
      id: 'talent_grit',
      type: 'talent',
      name: 'Grit',
      description: 'Gain +1 strain threshold per rank of Grit.',
      tier: 1,
    },
  },
];

const baseIndex: IndexEntry[] = Array.isArray(generatedIndex) && generatedIndex.length > 0 ? (generatedIndex as IndexEntry[]) : seed;
const extraIndex: IndexEntry[] = Array.isArray(extras) ? (extras as IndexEntry[]) : [];

// Merge and de-duplicate by type:id
const index: IndexEntry[] = (() => {
  const map = new Map<string, IndexEntry>();
  for (const e of [...baseIndex, ...extraIndex]) {
    if (!e || !e.id || !e.type) continue;
    map.set(`${e.type}:${e.id}`, e);
  }
  return Array.from(map.values());
})();

// Extract weapon/gear qualities for search. Build human-friendly aliases too (e.g., "Blast 10", "Concussive 3", "Stun Setting").
function extractQualities(d: SpotlightDetail): Array<{ name: string; count?: number | string }> {
  const src: any =
    (d as any).qualities ??
    (d as any).weaponQualities ??
    (d as any).weapon_qualities ??
    (d as any).weaponqualities ??
    null;
  if (!src) return [];
  const out: Array<{ name: string; count?: number | string }> = [];
  const push = (name?: string, count?: number | string) => {
    if (!name) return;
    const n = String(name).trim();
    if (!n) return;
    out.push({ name: n, count });
  };
  if (Array.isArray(src)) {
    for (const q of src) {
      if (typeof q === 'string') push(q);
      else if (q && typeof q === 'object')
        push(
          (q as any).name ?? (q as any).key ?? (q as any).id ?? (q as any).label,
          (q as any).count ?? (q as any).value ?? (q as any).rank
        );
    }
    return out;
  }
  if (typeof src === 'object') {
    for (const [k, v] of Object.entries(src)) {
      if (v == null || v === false) continue;
      if (typeof v === 'number' || typeof v === 'string') push(k, v as any);
      else if (typeof v === 'object') push((v as any).name ?? (v as any).key ?? k, (v as any).count ?? (v as any).value ?? (v as any).rank);
      else push(k);
    }
    return out;
  }
  if (typeof src === 'string') return [{ name: src }];
  return [];
}

function qualitiesText(d: SpotlightDetail): string {
  return extractQualities(d)
    .map(({ name, count }) => `${name}${count != null && count !== '' ? ` ${count}` : ''}`.trim())
    .join(' ');
}

// Map OggDude quality keys to human-friendly aliases and common variants
function qualityAliases(key: string): string[] {
  const k = String(key || '').toUpperCase();
  const map: Record<string, string[]> = {
    AUTOFIRE: ['Autofire', 'Auto fire', 'Auto-fire'],
    STUNSETTING: ['Stun Setting', 'Stun setting', 'Stun'],
    LIMITEDAMMO: ['Limited Ammo', 'Limited ammo'],
    ION: ['Ion'],
    ACCURATE: ['Accurate'],
    INACCURATE: ['Inaccurate'],
    PIERCE: ['Pierce'],
    BREACH: ['Breach'],
    VICIOUS: ['Vicious'],
    CONCUSSIVE: ['Concussive'],
    CUMBERSOME: ['Cumbersome'],
    DEFENSIVE: ['Defensive'],
    DEFLECTION: ['Deflection'],
    DISORIENT: ['Disorient'],
    ENSNARE: ['Ensnare'],
    GUIDED: ['Guided'],
    KNOCKDOWN: ['Knockdown'],
    INFERIOR: ['Inferior'],
    SUPERIOR: ['Superior'],
    PRECISE: ['Precise'],
    SUNDER: ['Sunder'],
    BLAST: ['Blast'],
    BURN: ['Burn'],
    LINKED: ['Linked'],
    PREPARED: ['Prepared'],
    REINFORCED: ['Reinforced'],
  };
  return map[k] || [key];
}

function qualitySearchTerms(d: SpotlightDetail): string[] {
  const terms: string[] = [];
  for (const { name, count } of extractQualities(d)) {
    const base = String(name);
    const aliases = qualityAliases(base);
    const lowerAliases = aliases.map((a) => a.toLowerCase());
    // Always include the raw key form (lowercased)
    terms.push(base.toLowerCase());
    // Include aliases (pretty names)
    terms.push(...lowerAliases);
    // Include aliases with counts (e.g., "pierce 2")
    if (count != null && count !== '') {
      const c = String(count).toLowerCase();
      lowerAliases.forEach((a) => terms.push(`${a} ${c}`));
      // Also include raw key + count
      terms.push(`${base.toLowerCase()} ${c}`);
    }
  }
  // De-duplicate
  return Array.from(new Set(terms));
}

// Augment each entry with pre-computed search blobs so fuzzysort can index them once.
type Augmented = IndexEntry & { _searchBlob: string };

const augmentedIndex: Augmented[] = index.map((e) => {
  const category = (e.detail as any)?.category ? String((e.detail as any).category) : '';
  const tagText = (e.tags || []).join(' ');
  const qualityBlob = qualitySearchTerms(e.detail).join(' ');
  return {
    ...e,
    _searchBlob: [tagText, category, qualityBlob].filter(Boolean).join(' '),
  };
});

const SEARCH_KEYS = ['name', 'subtitle', '_searchBlob'] as const;

function toResult(e: Augmented, matches?: number[]): SpotlightResult {
  return {
    id: e.id,
    type: e.type,
    name: e.name,
    subtitle: e.subtitle,
    tags: e.tags,
    named: (e as any).named,
    fromAdventure: (e as any).fromAdventure,
    matches,
  };
}

// Apply the query language: parse the input into tokens + residual, filter the
// index by token predicates, and run a fuzzy search on the residual (or
// alphabetical browse if there's no residual). Results are capped at 200.
export function searchIndex(q: string): SpotlightResult[] {
  const query = q.trim();
  if (!query) return [];

  const { tokens, residual } = parseQuery(query);
  // Pass 1: apply non-order filter tokens. evaluate() naturally skips order
  // tokens.
  let filtered: Augmented[] =
    tokens.length > 0 ? augmentedIndex.filter((e) => evaluate(e, tokens)) : augmentedIndex.slice();

  // Pass 2: apply `:high` / `:low` quartile filtering using the actual subset
  // we just produced. That way `type:nemesis wounds:high` uses nemesis-only
  // wound stats, not the union — otherwise the thresholds suggested by the
  // popup don't match what the filter does.
  const filterTokensForStats = tokens.filter((t) => !t.order);
  for (const t of tokens) {
    if (t.order) continue;
    if (t.fieldDef.kind !== 'numeric' || !t.fieldDef.detailPath) continue;
    const v = t.value.toLowerCase();
    if (v !== 'high' && v !== 'low') continue;
    const stats = computeNumericStats(t.fieldDef.name, filterTokensForStats);
    if (!stats) continue;
    const isHigh = v === 'high';
    const path = t.fieldDef.detailPath;
    filtered = filtered.filter((e) => {
      let cur: any = e.detail;
      for (const k of path) {
        if (cur == null) return false;
        cur = cur[k];
      }
      const num = typeof cur === 'number' ? cur : typeof cur === 'string' ? parseFloat(cur) : NaN;
      if (!Number.isFinite(num)) return false;
      return isHigh ? num >= stats.p75 : num <= stats.p25;
    });
  }

  const orderTok = orderTokens(tokens);
  const applyOrder = (arr: Augmented[]): Augmented[] => {
    if (orderTok.length === 0) return arr;
    return arr.slice().sort((a, b) => {
      for (const t of orderTok) {
        const cmp = compareEntries(a, b, t);
        if (cmp !== 0) return cmp;
      }
      return a.name.localeCompare(b.name);
    });
  };

  if (!residual) {
    // Token-only query: order tokens win when present; otherwise alphabetical
    // by type, then name. Lets `type:nemesis` act like a guided browse.
    if (orderTok.length > 0) {
      return applyOrder(filtered).slice(0, 200).map((e) => toResult(e));
    }
    return filtered
      .slice()
      .sort((a, b) =>
        a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type),
      )
      .slice(0, 200)
      .map((e) => toResult(e));
  }

  // Fuzzysort score is closer to 0 = better; -1000+ is junk. We weight name matches
  // highest, subtitle medium, blob lowest, by penalising the lower-priority keys.
  const fzResults = fuzzysort.go(residual, filtered, {
    keys: SEARCH_KEYS as unknown as string[],
    threshold: -10000,
    limit: 200,
    scoreFn: (a: any) => {
      const sName = a[0] ? a[0].score : -1e9;
      const sSubtitle = a[1] ? a[1].score : -1e9;
      const sBlob = a[2] ? a[2].score : -1e9;
      return Math.max(sName, sSubtitle - 50, sBlob - 100);
    },
  });

  // If order tokens are present, override fuzzysort ranking with explicit sort
  // (preserving match indexes for highlighting).
  const mapped = fzResults.map((r: any) => {
    const e = r.obj as Augmented;
    const nameMatch = r[0]?.indexes ? Array.from(r[0].indexes as ArrayLike<number>) : undefined;
    return { e, nameMatch };
  });
  if (orderTok.length > 0) {
    mapped.sort((a, b) => {
      for (const t of orderTok) {
        const cmp = compareEntries(a.e, b.e, t);
        if (cmp !== 0) return cmp;
      }
      return a.e.name.localeCompare(b.e.name);
    });
  }
  return mapped.map(({ e, nameMatch }) => toResult(e, nameMatch));
}

// Re-export so consumers that want the parsed shape (e.g. for chip rendering)
// can avoid importing the query module directly.
export { parseQuery, tokenEntityTypes } from './spotlightQuery';
export type { Token } from './spotlightQuery';

// Indexed lookup for getDetail — O(1) instead of O(N) per call. Used heavily by SpotlightResultRow
// (one call per visible row), the StatSheet (talent + adversary lookups), and WeaponCard (quality
// lookups). Linear scans across the merged index were a notable hot spot when rendering long
// result lists.
const detailByKey: Map<string, SpotlightDetail> = (() => {
  const m = new Map<string, SpotlightDetail>();
  for (const e of index) {
    if (!e || !e.detail) continue;
    m.set(`${e.type}:${e.id}`, e.detail);
  }
  return m;
})();

export function getDetail(type: SpotlightEntityType, id: string): SpotlightDetail | null {
  return detailByKey.get(`${type}:${id}`) ?? null;
}

// Every adversary's full `detail` (the classification fields, stats, and
// classificationReason live here). Used by the Classification Review tool,
// which needs the detail for every entry up front — unlike browseIndex, which
// returns lightweight rows without `detail`. Sorted by name.
export function getAllAdversaries(): SpotlightDetail[] {
  return index
    .filter((e) => e.type === 'adversary' && !!e.detail)
    .map((e) => e.detail)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Browse raw index entries (no search), optionally filtered by types, limited to N
export function browseIndex(limit: number = 100, types?: SpotlightEntityType[]): SpotlightResult[] {
  const typeSet = types && types.length > 0 ? new Set(types) : null;
  const items = index
    .filter((e) => (typeSet ? typeSet.has(e.type) : true))
    // Provide a stable, pleasant order: by type then name
    .slice() // copy before sort
    .sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type.localeCompare(b.type);
    })
    .map((e) => ({ id: e.id, type: e.type, name: e.name, subtitle: e.subtitle, tags: e.tags, named: (e as any).named, fromAdventure: (e as any).fromAdventure }));
  return items.slice(0, Math.max(0, limit | 0));
}
