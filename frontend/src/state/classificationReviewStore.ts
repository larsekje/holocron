import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { holocronPersist } from './persist';

// Classification Review — a GM data-quality surface for the adversary
// classification fields (factions / archetypes / coreArchetype / traits).
// The user browses the catalog, manually flags wrong entries with a note, and
// exports the flags as JSON. That export later feeds an out-of-band LLM pass
// that revises the taxonomy rules and re-classifies — not part of this store.

/** The classification fields a flag can point at. The derived Archetype is not
 * flaggable — it's computed from the Role, so a wrong Archetype means a wrong Role. */
export type ClassificationField = 'factions' | 'coreArchetype' | 'traits';

export const CLASSIFICATION_FIELDS: ClassificationField[] = [
  'coreArchetype',
  'factions',
  'traits',
];

export interface ClassificationFlag {
  /** Adversary display name — stored alongside the id so exports/imports and
   * the UI don't have to re-resolve it from the index. */
  name: string;
  /** Free-text explanation of what's wrong. */
  note: string;
  /** Which field(s) the user thinks are wrong. Optional — the note can stand
   * alone. */
  fields?: ClassificationField[];
  /** Optional structured correction for the most common case. */
  suggestedCoreArchetype?: string;
  /** ISO timestamp of when the flag was first raised (sticky across edits). */
  flaggedAt: string;
}

interface ClassificationReviewState {
  // --- ephemeral modal state (not persisted) ---
  isOpen: boolean;
  open: () => void;
  close: () => void;

  // --- persisted flag data ---
  /** Keyed by Spotlight index id (`adversary_<slug>`). */
  flags: Record<string, ClassificationFlag>;
  /** Create or update a flag. `flaggedAt` is stamped on first flag and kept
   * stable on later edits. */
  setFlag: (id: string, flag: Omit<ClassificationFlag, 'flaggedAt'>) => void;
  clearFlag: (id: string) => void;
  clearAllFlags: () => void;
  /** Merge an imported flag set into the current one (existing flags survive). */
  importFlags: (flags: Record<string, ClassificationFlag>) => void;
}

export const useClassificationReviewStore = create<ClassificationReviewState>()(
  persist(
    (set) => ({
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      flags: {},
      setFlag: (id, flag) =>
        set((s) => ({
          flags: {
            ...s.flags,
            [id]: { ...flag, flaggedAt: s.flags[id]?.flaggedAt ?? new Date().toISOString() },
          },
        })),
      clearFlag: (id) =>
        set((s) => {
          const next = { ...s.flags };
          delete next[id];
          return { flags: next };
        }),
      clearAllFlags: () => set({ flags: {} }),
      importFlags: (flags) => set((s) => ({ flags: { ...s.flags, ...flags } })),
    }),
    holocronPersist({
      name: 'classificationReview',
      // Only the flags persist — `isOpen` is ephemeral UI state.
      partialize: (s) => ({ flags: s.flags }),
    }),
  ),
);
