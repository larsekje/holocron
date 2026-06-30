import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Classification Review — a GM data-quality surface for the adversary
// classification fields (factions / archetypes / coreArchetype / traits).
// The user browses the catalog, manually flags wrong entries with a note, and
// exports the flags as JSON. That export later feeds an out-of-band LLM pass
// that revises the taxonomy rules and re-classifies — not part of this store.

/** The classification fields a flag can point at. Archetype is the derived
 * roll-up of Role, but it's flaggable too — a wrong bucket can indicate either a
 * bad Role or a bad Role→Archetype mapping, and the reviewer wants to call it. */
export type ClassificationField = 'factions' | 'coreArchetype' | 'archetype' | 'traits';

export const CLASSIFICATION_FIELDS: ClassificationField[] = [
  'coreArchetype',
  'archetype',
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
  /** Optional structured correction: a suggested value per classification field
   * (Role / Archetype / Faction / Profile). */
  suggestions?: Partial<Record<ClassificationField, string>>;
  /** @deprecated Pre-multi-field shape — read for back-compat, no longer written
   * (migrated into `suggestions.coreArchetype`). */
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
    {
      // Persisted OUTSIDE the `holocron:v1:` namespace on purpose, so the dev
      // "Nuke saved state" button (and `?reset` / `__nukeHolocron` / a future
      // v1→v2 bump) can't wipe hand-curated classification flags — same reasoning
      // as playtestNotesStore. These represent real review work, not session
      // state. (For cross-machine/clean-install durability use the modal's
      // Export → commit the JSON; this only protects the local copy.)
      name: 'holocron:classification-flags',
      storage: createJSONStorage(() => localStorage),
      // Only the flags persist — `isOpen` is ephemeral UI state.
      partialize: (s) => ({ flags: s.flags }),
      // One-time migration: adopt flags previously saved under the old
      // namespaced key (`holocron:v1:classificationReview`) so existing review
      // work isn't orphaned by the move. Runs once, then removes the old key.
      onRehydrateStorage: () => (state) => {
        try {
          const legacyRaw = localStorage.getItem('holocron:v1:classificationReview');
          if (!legacyRaw || !state) return;
          const legacy = JSON.parse(legacyRaw);
          const legacyFlags = legacy?.state?.flags ?? legacy?.flags;
          if (legacyFlags && typeof legacyFlags === 'object') {
            // Don't clobber anything already migrated/edited under the new key.
            state.importFlags(legacyFlags);
          }
          localStorage.removeItem('holocron:v1:classificationReview');
        } catch {
          /* corrupt legacy payload — ignore, nothing to migrate */
        }
      },
    },
  ),
);
