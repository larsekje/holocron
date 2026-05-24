/**
 * playerSettingsStore — GM toggles for what the player view shows. Kept apart
 * from shareStore (which owns the sharing lifecycle and imports gmSync) to
 * avoid an import cycle, since gmSync reads these settings.
 */
import { create } from "zustand";

interface PlayerSettingsState {
  showDestiny: boolean;
  setShowDestiny: (v: boolean) => void;
}

const usePlayerSettingsStore = create<PlayerSettingsState>((set) => ({
  showDestiny: true,
  setShowDestiny: (v) => set({ showDestiny: v }),
}));

export default usePlayerSettingsStore;
