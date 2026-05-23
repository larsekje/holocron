/**
 * userContentStore — the GM's own authored prep content (campaign-level):
 * encounters they build themselves and a "tonight's roster" of NPCs queued to
 * appear. Distinct from `sessionPrepStore` (the *active* scene, session-scoped)
 * and from the bundled `ENCOUNTER_TEMPLATES` samples. Persisted under its own
 * key so clearing session state never wipes the GM's library.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { holocronPersist } from './persist';
import type { EncounterTemplate } from '@/data/encounterTemplates';

export interface RosterEntry {
  id: string;
  name: string;
  faction?: string;
  note?: string;
  /** Spotlight adversary id — when set, the entry can be one-click dropped
   * into the live encounter as a participant. */
  adversaryId?: string;
  /** Minion group size / number of copies to add when dropped in. */
  count?: number;
}

interface UserContentStore {
  userEncounters: EncounterTemplate[];
  roster: RosterEntry[];

  /** Upsert an encounter by id (create if new, replace if it exists). */
  saveEncounter: (encounter: EncounterTemplate) => void;
  removeEncounter: (id: string) => void;

  addRosterEntry: (entry: Omit<RosterEntry, 'id'>) => void;
  updateRosterEntry: (id: string, patch: Partial<RosterEntry>) => void;
  removeRosterEntry: (id: string) => void;
}

/** Prefix marks an encounter as GM-authored so it never collides with a
 * bundled sample id and the panel can tell the two apart. */
export function newEncounterId(): string {
  return `user-${nanoid(8)}`;
}

const useUserContentStore = create<UserContentStore>()(persist((set) => ({
  userEncounters: [],
  roster: [],

  saveEncounter: (encounter) =>
    set((state) => {
      const exists = state.userEncounters.some((e) => e.id === encounter.id);
      return {
        userEncounters: exists
          ? state.userEncounters.map((e) => (e.id === encounter.id ? encounter : e))
          : [...state.userEncounters, encounter],
      };
    }),
  removeEncounter: (id) =>
    set((state) => ({
      userEncounters: state.userEncounters.filter((e) => e.id !== id),
    })),

  addRosterEntry: (entry) =>
    set((state) => ({ roster: [...state.roster, { ...entry, id: nanoid(8) }] })),
  updateRosterEntry: (id, patch) =>
    set((state) => ({
      roster: state.roster.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  removeRosterEntry: (id) =>
    set((state) => ({ roster: state.roster.filter((r) => r.id !== id) })),
}), holocronPersist({
  name: 'userContent',
  partialize: (s) => ({ userEncounters: s.userEncounters, roster: s.roster }),
})));

export default useUserContentStore;
