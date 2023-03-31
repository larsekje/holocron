import { create } from 'zustand'


interface InitiativeSlot {
    player: boolean;
    current: boolean;
    active: boolean;
    initiative: number;
}

interface TurnStore{
    round: number;
    turn: number;
    initiativeSlots: InitiativeSlot[];
    incrementRound: () => void;
    decrementRound: () => void;
    incrementTurn: () => void;
    decrementTurn: () => void;

}

export const useTurnStore = create<TurnStore>((set) => ({
    round: 1,
    turn: 1,
    initiativeSlots: [{player: false, current: true, active: false, initiative: 1}, {player: true, current: false, active: false, initiative: 3}, {player: false, current: false, active: false, initiative: 2}],
    incrementRound: () => set((state) => ({round: state.round + 1})),
    decrementRound: () => set((state) => ({round: Math.max(state.round - 1, 1)})),
    incrementTurn: () => set((state) => ({turn: state.turn + 1})),
    decrementTurn: () => set((state) => ({turn: Math.max(state.turn - 1, 1)})),
}));
