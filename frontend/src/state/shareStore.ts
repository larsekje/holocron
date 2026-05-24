/**
 * shareStore — tiny UI state for the "Share with players" feature, wrapping the
 * gmSync publisher lifecycle so the header button and modal can reflect it.
 *
 * The room id IS persisted (see gmSync) so the table screen's link is permanent.
 * Here we persist only the *intent* to share, so that after a GM reload or crash
 * we can auto-resume publishing to that same room — keeping the table screen
 * live without anyone re-opening the link. See initAutoResume below.
 */
import { create } from "zustand";
import { startSharing, stopSharing } from "@/sync/gmSync";

const INTENT_KEY = "holocron:isSharing";

function persistIntent(on: boolean): void {
  try {
    localStorage.setItem(INTENT_KEY, on ? "1" : "0");
  } catch {
    /* localStorage blocked — auto-resume simply won't fire next load */
  }
}

interface ShareState {
  isSharing: boolean;
  roomId: string | null;
  shareUrl: string | null;
  start: () => void;
  stop: () => void;
}

const useShareStore = create<ShareState>((set) => ({
  isSharing: false,
  roomId: null,
  shareUrl: null,
  start: () => {
    const { roomId, shareUrl } = startSharing();
    persistIntent(true);
    set({ isSharing: true, roomId, shareUrl });
  },
  stop: () => {
    stopSharing();
    persistIntent(false);
    set({ isSharing: false, roomId: null, shareUrl: null });
  },
}));

/**
 * Re-arm sharing on GM app load if it was active before a reload or crash.
 * Because the room id is stable, this resumes publishing to the SAME room, so
 * the table screen's permanent link keeps updating without anyone re-opening it.
 * Idempotent and guarded so StrictMode's double-mount (and any repeat calls) are
 * harmless. Call once from the GM root (App); never runs on a player device,
 * which doesn't load this store.
 */
let resumed = false;
export function initAutoResume(): void {
  if (resumed) return;
  resumed = true;
  let wasSharing = false;
  try {
    wasSharing = localStorage.getItem(INTENT_KEY) === "1";
  } catch {
    /* localStorage blocked — nothing to resume */
  }
  if (wasSharing && !useShareStore.getState().isSharing) {
    useShareStore.getState().start();
  }
}

export default useShareStore;
