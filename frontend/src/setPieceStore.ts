import { create } from "zustand";
import {
  SetPiece,
  SetPieceDraft,
  createSetPiece,
  deleteSetPiece,
  fetchSetPieces,
  updateSetPiece,
} from "@/setPiece";

interface SetPieceStore {
  pieces: SetPiece[];
  loading: boolean;
  error: string | null;
  activePiece: SetPiece | null;

  loadAll: () => Promise<void>;
  setActive: (piece: SetPiece | null) => void;
  create: (draft: SetPieceDraft) => Promise<SetPiece>;
  update: (id: string, draft: SetPieceDraft) => Promise<SetPiece>;
  remove: (id: string) => Promise<void>;
}

export const useSetPieceStore = create<SetPieceStore>((set, get) => ({
  pieces: [],
  loading: false,
  error: null,
  activePiece: null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const pieces = await fetchSetPieces();
      set({ pieces, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  setActive: (piece) => set({ activePiece: piece }),

  create: async (draft) => {
    const piece = await createSetPiece(draft);
    set({ pieces: [...get().pieces, piece] });
    return piece;
  },

  update: async (id, draft) => {
    const piece = await updateSetPiece(id, draft);
    set({
      pieces: get().pieces.map(p => (p.id === id ? piece : p)),
      activePiece: get().activePiece?.id === id ? piece : get().activePiece,
    });
    return piece;
  },

  remove: async (id) => {
    await deleteSetPiece(id);
    set({
      pieces: get().pieces.filter(p => p.id !== id),
      activePiece: get().activePiece?.id === id ? null : get().activePiece,
    });
  },
}));
