import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlaytestNotesStore {
  notes: string;
  setNotes: (notes: string) => void;
}

/**
 * Freeform playtest notes — jot what works / what to fix during a session.
 *
 * Persisted under its OWN localStorage key, deliberately NOT in the
 * `holocron:v1:` namespace, so the dev "Nuke saved state" button (which only
 * clears `holocron:v1:*`) wipes game state without losing these notes.
 */
const usePlaytestNotesStore = create<PlaytestNotesStore>()(
  persist(
    (set) => ({
      notes: '',
      setNotes: (notes) => set({ notes }),
    }),
    { name: 'holocron:playtest-notes' },
  ),
);

export default usePlaytestNotesStore;
