import { create } from 'zustand';

interface GalaxyMapState {
  visible: boolean;
  open: () => void;
  close: () => void;
}

// Open/close state for the dedicated galaxy-map overlay panel (G hotkey).
// Mirrors symbolSpendsStore — transient UI, deliberately not persisted.
export const useGalaxyMapStore = create<GalaxyMapState>((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));
