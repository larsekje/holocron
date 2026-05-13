import { create } from 'zustand';

interface HelpOverlayState {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

// Single source of truth for "is the GM holding `?` right now?". The central
// HotkeyHelpOverlay sets it; per-button hint chips read it so they can fade
// in only while help is requested.
export const useHelpOverlayStore = create<HelpOverlayState>((set) => ({
  visible: false,
  setVisible: (v) => set({ visible: v }),
}));
