/**
 * sessionPrepStore — state for the Session Prep panel's prep-side data.
 *
 * Distinct from `encountersStore` (which is older infrastructure for the
 * eventual in-play encounter loop) and from `participantsStore` (the live
 * cast in Targets). This store is the GM's binder: what scene is
 * currently the focus of the table, what roster they've queued for
 * tonight. Persists via the standard holocron:v1: namespace.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { holocronPersist } from './persist';
import type { EncounterTemplate, NpcEntry, RollTable } from '@/data/encounterTemplates';

export interface ActiveScene {
  /** Snapshot id — independent of any source template id, so re-starting
   * the same template makes a fresh scene without colliding. */
  id: string;
  /** Optional template the scene was started from (for "reset to template"
   * affordances later). */
  fromTemplateId?: string;
  title: string;
  description: string;
  npcs?: NpcEntry[];
  beats?: string[];
  /** Roll tables carried from the encounter — rollable during play. */
  tables?: RollTable[];
  /** Free-form GM notes the GM types in during play. Starts blank when a
   * template is started — the template description goes in `description`,
   * this is the running scratch. */
  notes: string;
  startedAt: number;
}

interface SessionPrepStore {
  activeScene: ActiveScene | null;
  startFromTemplate: (template: EncounterTemplate) => void;
  clearActiveScene: () => void;
  setNotes: (notes: string) => void;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const useSessionPrepStore = create<SessionPrepStore>()(persist((set) => ({
  activeScene: null,

  startFromTemplate: (template) =>
    set({
      activeScene: {
        id: randomId(),
        fromTemplateId: template.id,
        title: template.title,
        description: template.body ?? template.description ?? '',
        npcs: template.npcs ? [...template.npcs] : undefined,
        beats: template.beats ? [...template.beats] : undefined,
        tables: template.tables ? [...template.tables] : undefined,
        notes: '',
        startedAt: Date.now(),
      },
    }),

  clearActiveScene: () => set({ activeScene: null }),

  setNotes: (notes) =>
    set((state) =>
      state.activeScene
        ? { activeScene: { ...state.activeScene, notes } }
        : state,
    ),
}), holocronPersist({
  name: 'sessionPrep',
  partialize: (s) => ({ activeScene: s.activeScene }),
})));

export default useSessionPrepStore;
