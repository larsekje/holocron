/**
 * prepUiStore — view state for the Session Prep panel (which sections the GM
 * has folded away). Kept separate from the *content* stores (userContentStore,
 * sessionPrepStore) so collapsing a section never touches the GM's data, and
 * persisted under the standard holocron:v1: namespace so the layout the GM
 * settles on survives a reload.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { holocronPersist } from './persist';

interface PrepUiStore {
  /** sectionKey → collapsed?. Absent means "fall back to the section's
   * defaultOpen" — so we only store an entry once the GM has toggled it. */
  collapsed: Record<string, boolean>;
  setSection: (key: string, open: boolean) => void;
  /** Transient (not persisted) roster controls driven from the section header:
   * whether the add-NPC input is open, and a freshly-created squad to auto-focus
   * for renaming. Live here so the header buttons (SessionPrepPanel) and the body
   * (RosterEditor) can coordinate without prop-drilling. */
  rosterAddOpen: boolean;
  setRosterAddOpen: (v: boolean) => void;
  rosterFocusGroupId: string | null;
  setRosterFocusGroupId: (id: string | null) => void;
}

const usePrepUiStore = create<PrepUiStore>()(persist((set) => ({
  collapsed: {},
  setSection: (key, open) =>
    set((s) => ({ collapsed: { ...s.collapsed, [key]: !open } })),
  rosterAddOpen: false,
  setRosterAddOpen: (v) => set({ rosterAddOpen: v }),
  rosterFocusGroupId: null,
  setRosterFocusGroupId: (id) => set({ rosterFocusGroupId: id }),
}), holocronPersist({
  name: 'prepUi',
  partialize: (s) => ({ collapsed: s.collapsed }),
})));

export default usePrepUiStore;
