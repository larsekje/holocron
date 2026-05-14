/**
 * Talent entries reach the UI from several sources — adversaryService,
 * spotlight quick-add, AddPCModal, persisted/edited participant state — and
 * not all of them are bare strings. Some hand over objects ({ name, ranks }).
 * Anything that calls `.match` / `.replace` on a talent entry must normalise
 * through here first, or it crashes on the object entries.
 */
export function talentName(t: unknown): string {
  if (typeof t === 'string') return t;
  if (t && typeof t === 'object') {
    const o = t as Record<string, unknown>;
    const base = typeof o.name === 'string' ? o.name : String(o.name ?? '');
    const rank =
      typeof o.ranks === 'number'
        ? o.ranks
        : typeof o.rank === 'number'
        ? o.rank
        : undefined;
    return rank && rank > 1 ? `${base} ${rank}` : base;
  }
  return String(t ?? '');
}

/** Normalise a (possibly mixed) talent array to clean display strings. */
export function talentNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(talentName).filter((t) => t.length > 0);
}
