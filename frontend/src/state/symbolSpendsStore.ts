import { create } from 'zustand';
import type { SpendContext } from '@/data/symbolSpends';

/** Tabs of the rules reference (R): the three spend tables plus the skill
 * list and the maneuver / range-band rules. */
export type ReferenceTab = SpendContext | 'skills' | 'maneuvers';

interface SymbolSpendsState {
  visible: boolean;
  context: ReferenceTab;
  open: (context?: ReferenceTab) => void;
  close: () => void;
  setContext: (context: ReferenceTab) => void;
}

export const useSymbolSpendsStore = create<SymbolSpendsState>((set) => ({
  visible: false,
  context: 'combat',
  open: (context) =>
    set((s) => ({ visible: true, context: context ?? s.context })),
  close: () => set({ visible: false }),
  setContext: (context) => set({ context }),
}));
