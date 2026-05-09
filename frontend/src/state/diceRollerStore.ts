import {create} from 'zustand';
import type {ModalSnapshot} from '@components/dice/mockSnapshots';

interface DiceRollerState {
  snapshot: ModalSnapshot | null;
  open: (snapshot: ModalSnapshot) => void;
  close: () => void;
}

const useDiceRollerStore = create<DiceRollerState>((set) => ({
  snapshot: null,
  open: (snapshot) => set({snapshot}),
  close: () => set({snapshot: null}),
}));

export default useDiceRollerStore;
