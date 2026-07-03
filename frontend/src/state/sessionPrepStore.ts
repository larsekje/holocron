/**
 * sessionPrepStore — state for the Session Prep panel's prep-side data.
 *
 * Distinct from `encountersStore` (which is older infrastructure for the
 * eventual in-play encounter loop) and from `participantsStore` (the live
 * cast in Targets). This store is the GM's binder: what scene is
 * currently the focus of the table, plus the night's open threads. Persists
 * via the standard holocron:v1: namespace.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { holocronPersist } from './persist';
import type { EncounterTemplate, FloorVignette, NpcEntry, NpcRef, RollTable } from '@/data/encounterTemplates';

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
  /** Parallel to `beats` — true = the GM tapped this moment as used. Sparse;
   * missing indexes read as unused. Deliberately NOT ordered progress:
   * moments are a menu, not a checklist. */
  beatsUsed?: boolean[];
  /** Roll tables carried from the encounter — rollable during play. */
  tables?: RollTable[];
  /** Structured location-scene sections, carried verbatim from the template
   * (see EncounterTemplate for field semantics). */
  floor?: FloorVignette[];
  angles?: string[];
  anglesLabel?: string;
  nudge?: string;
  exits?: string;
  links?: string[];
  /** Free-form GM notes the GM types in during play. Starts blank when a
   * template is started — the template description goes in `description`,
   * this is the running scratch. */
  notes: string;
  startedAt: number;
}

/** An open loose end — the night's callback fuel. Session-scoped but NOT
 * scene-scoped: threads outlive the scene that spawned them. */
export interface PrepThread {
  id: string;
  text: string;
  resolved: boolean;
}

interface SessionPrepStore {
  activeScene: ActiveScene | null;
  threads: PrepThread[];

  startFromTemplate: (template: EncounterTemplate) => void;
  clearActiveScene: () => void;
  setNotes: (notes: string) => void;

  /** Toggle a beat's used-state (play surface "moments"). */
  toggleBeat: (index: number) => void;
  /** Pull an NPC into the live scene's cast (bench → scene). */
  addNpcToScene: (npc: NpcEntry) => void;
  /** Patch a cast entry in place (e.g. inline want editing). Plain-string
   * entries are promoted to NpcRef on first patch. */
  updateSceneNpc: (index: number, patch: Partial<NpcRef>) => void;

  addThread: (text: string) => void;
  toggleThread: (id: string) => void;
  removeThread: (id: string) => void;
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const useSessionPrepStore = create<SessionPrepStore>()(persist((set) => ({
  activeScene: null,
  threads: [],

  startFromTemplate: (template) =>
    set({
      activeScene: {
        id: randomId(),
        fromTemplateId: template.id,
        title: template.title,
        description: template.body ?? template.description ?? '',
        npcs: template.npcs ? [...template.npcs] : undefined,
        beats: template.beats ? [...template.beats] : undefined,
        beatsUsed: [],
        tables: template.tables ? [...template.tables] : undefined,
        floor: template.floor ? [...template.floor] : undefined,
        angles: template.angles ? [...template.angles] : undefined,
        anglesLabel: template.anglesLabel,
        nudge: template.nudge,
        exits: template.exits,
        links: template.links ? [...template.links] : undefined,
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

  toggleBeat: (index) =>
    set((state) => {
      if (!state.activeScene) return state;
      const used = [...(state.activeScene.beatsUsed ?? [])];
      used[index] = !used[index];
      return { activeScene: { ...state.activeScene, beatsUsed: used } };
    }),

  addNpcToScene: (npc) =>
    set((state) =>
      state.activeScene
        ? {
            activeScene: {
              ...state.activeScene,
              npcs: [...(state.activeScene.npcs ?? []), npc],
            },
          }
        : state,
    ),

  updateSceneNpc: (index, patch) =>
    set((state) => {
      if (!state.activeScene?.npcs) return state;
      const npcs = state.activeScene.npcs.map((n, i) => {
        if (i !== index) return n;
        const base: NpcRef = typeof n === 'string' ? { name: n } : n;
        return { ...base, ...patch };
      });
      return { activeScene: { ...state.activeScene, npcs } };
    }),

  addThread: (text) =>
    set((state) => ({
      threads: [...state.threads, { id: randomId(), text, resolved: false }],
    })),
  toggleThread: (id) =>
    set((state) => ({
      threads: state.threads.map((t) => (t.id === id ? { ...t, resolved: !t.resolved } : t)),
    })),
  removeThread: (id) =>
    set((state) => ({ threads: state.threads.filter((t) => t.id !== id) })),
}), holocronPersist({
  name: 'sessionPrep',
  partialize: (s) => ({ activeScene: s.activeScene, threads: s.threads }),
})));

export default useSessionPrepStore;
