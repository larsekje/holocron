import type {
  SpotlightDetail,
  SpotlightEntityType,
  SpotlightResult,
} from '@/state/spotlightStore';

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

// Simple score function to improve relevance: name match > tags/qualities > subtitle > description
function scoreEntry(e: IndexEntry, q: string): number {
  const query = q.toLowerCase();
  let score = 0;
  const name = e.name.toLowerCase();
  const subtitle = (e.subtitle || '').toLowerCase();
  const category = (e.detail as any)?.category ? String((e.detail as any).category) : '';
  const qualityBlob = qualitySearchTerms(e.detail).join(' ');
  const tagBlob = ((e.tags || []).join(' ') + ' ' + category + ' ' + qualityBlob).toLowerCase();
  const desc = (e.detail.description || e.detail.html || e.detail.markdown || '').toString().toLowerCase();

  if (name === query) score += 100;
  if (name.includes(query)) score += 50;
  if (tagBlob.includes(query)) score += 30; // slight boost as this is more curated
  if (subtitle.includes(query)) score += 10;
  if (desc.includes(query)) score += 5;

  return score;
}

export function searchIndex(q: string): SpotlightResult[] {
  const query = q.trim();
  if (!query) return [];
  const results = index
    .map((e) => ({ e, s: scoreEntry(e, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ e }) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      subtitle: e.subtitle,
      tags: e.tags,
    }));

  return results.slice(0, 200);
}

export function getDetail(type: SpotlightEntityType, id: string): SpotlightDetail | null {
  const found = index.find((e) => e.type === type && e.id === id);
  return found?.detail ?? null;
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
    .map((e) => ({ id: e.id, type: e.type, name: e.name, subtitle: e.subtitle, tags: e.tags }));
  return items.slice(0, Math.max(0, limit | 0));
}
