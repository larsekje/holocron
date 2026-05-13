import { create } from 'zustand';
import type { SpendContext } from '@/data/symbolSpends';

interface SymbolSpendsState {
  visible: boolean;
  context: SpendContext;
  open: (context?: SpendContext) => void;
  close: () => void;
  setContext: (context: SpendContext) => void;
}

export const useSymbolSpendsStore = create<SymbolSpendsState>((set) => ({
  visible: false,
  context: 'combat',
  open: (context) =>
    set((s) => ({ visible: true, context: context ?? s.context })),
  close: () => set({ visible: false }),
  setContext: (context) => set({ context }),
}));
