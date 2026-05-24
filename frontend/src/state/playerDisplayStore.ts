/**
 * playerDisplayStore — an image the GM pushes to the player view (e.g. "here's
 * what an ysalamir looks like"). Part of the shared snapshot, so it appears on
 * every connected player device. Not persisted: it's a live, in-session prop.
 */
import { create } from "zustand";

interface PlayerDisplayState {
  imageUrl: string | null;
  caption: string | null;
  setImage: (imageUrl: string, caption?: string) => void;
  clear: () => void;
}

const usePlayerDisplayStore = create<PlayerDisplayState>((set) => ({
  imageUrl: null,
  caption: null,
  setImage: (imageUrl, caption) =>
    set({ imageUrl: imageUrl.trim() || null, caption: caption?.trim() || null }),
  clear: () => set({ imageUrl: null, caption: null }),
}));

export default usePlayerDisplayStore;
