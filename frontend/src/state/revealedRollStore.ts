/**
 * revealedRollStore — a dice result the GM has explicitly chosen to show the
 * table. GM rolls are private by default (and the dice modal churns on every
 * pool edit), so nothing reaches players until the GM clicks "Reveal to
 * players". The reveal auto-clears after a while so it doesn't linger forever.
 */
import { create } from "zustand";
import type { PlayerRoll } from "@/sync/snapshot";

const AUTO_CLEAR_MS = 30000;

interface RevealedRollState {
  roll: PlayerRoll | null;
  reveal: (roll: PlayerRoll) => void;
  clear: () => void;
}

let clearTimer: ReturnType<typeof setTimeout> | null = null;

const useRevealedRollStore = create<RevealedRollState>((set) => ({
  roll: null,
  reveal: (roll) => {
    if (clearTimer) clearTimeout(clearTimer);
    set({ roll });
    clearTimer = setTimeout(() => set({ roll: null }), AUTO_CLEAR_MS);
  },
  clear: () => {
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = null;
    set({ roll: null });
  },
}));

export default useRevealedRollStore;
