// Export / import for the Classification Review flags.
//
// The export is shaped for the out-of-band LLM pass that revises the taxonomy
// rules and re-classifies: each flagged adversary carries its *current*
// classification, the v4.2 rationale (when on file), and the user's note +
// which fields they think are wrong. Import is the inverse — round-trips an
// exported file back into the store so flag work survives a state reset or a
// different browser.
import type { SpotlightDetail } from '@/state/spotlightStore';
import type { ClassificationFlag } from '@/state/classificationReviewStore';
import { downloadJSON } from '@/utils/exportJson';

const TAXONOMY_VERSION = 'v4.2';

export interface ExportedFlagEntry {
  id: string;
  name: string;
  type: string;
  current: {
    coreArchetype?: string;
    archetypes?: string[];
    factions?: string[];
    traits?: string[];
  };
  /** The v4.2 classification rationale, when this adversary had one. */
  reason?: string;
  flag: {
    note: string;
    fields?: string[];
    suggestedCoreArchetype?: string;
    flaggedAt: string;
  };
}

export interface ClassificationFlagExport {
  exportedAt: string;
  taxonomyVersion: string;
  /** Total adversaries in the catalog — the denominator for the flagged set. */
  totalReviewed: number;
  flaggedCount: number;
  flagged: ExportedFlagEntry[];
}

export function buildFlagExport(
  flags: Record<string, ClassificationFlag>,
  adversaries: SpotlightDetail[],
): ClassificationFlagExport {
  const byId = new Map(adversaries.map((a) => [a.id, a]));
  const flagged: ExportedFlagEntry[] = Object.entries(flags)
    .map(([id, flag]) => {
      const d = (byId.get(id) ?? {}) as any;
      return {
        id,
        name: flag.name || d.name || id,
        type: d.adversaryType ?? 'Unknown',
        current: {
          coreArchetype: d.coreArchetype,
          archetypes: d.archetypes,
          factions: d.factions,
          traits: d.traits,
        },
        reason: d.classificationReason,
        flag: {
          note: flag.note,
          fields: flag.fields,
          suggestedCoreArchetype: flag.suggestedCoreArchetype,
          flaggedAt: flag.flaggedAt,
        },
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    exportedAt: new Date().toISOString(),
    taxonomyVersion: TAXONOMY_VERSION,
    totalReviewed: adversaries.length,
    flaggedCount: flagged.length,
    flagged,
  };
}

export function exportFlags(
  flags: Record<string, ClassificationFlag>,
  adversaries: SpotlightDetail[],
): void {
  const payload = buildFlagExport(flags, adversaries);
  const date = payload.exportedAt.slice(0, 10);
  downloadJSON(payload, `classification-flags-${date}.json`);
}

// Parse a previously-exported file back into the store's flag map. Tolerant of
// minor shape drift — skips entries missing an id. Throws on non-JSON / wrong
// shape so the caller can surface an error.
export function parseFlagImport(text: string): Record<string, ClassificationFlag> {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.flagged)) {
    throw new Error('Not a classification flag export (missing `flagged` array).');
  }
  const out: Record<string, ClassificationFlag> = {};
  for (const e of parsed.flagged) {
    if (!e || typeof e.id !== 'string') continue;
    const flag = e.flag ?? {};
    out[e.id] = {
      name: typeof e.name === 'string' ? e.name : e.id,
      note: typeof flag.note === 'string' ? flag.note : '',
      fields: Array.isArray(flag.fields) ? flag.fields : undefined,
      suggestedCoreArchetype:
        typeof flag.suggestedCoreArchetype === 'string' ? flag.suggestedCoreArchetype : undefined,
      flaggedAt: typeof flag.flaggedAt === 'string' ? flag.flaggedAt : new Date().toISOString(),
    };
  }
  return out;
}
