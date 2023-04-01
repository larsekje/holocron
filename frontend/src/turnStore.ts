import { create } from 'zustand'
import {nanoid} from "nanoid";


export class InitiativeSlot {
    id: string;
    isNPC: boolean;
    current: boolean;
    active: boolean;
    initiative: number;

    constructor(isNPC: boolean) {
        this.id = nanoid();
        this.isNPC = isNPC;
        this.current = false;
        this.active = true;
        this.initiative = 1;
    }
}

interface TurnStore{
    round: number;
    turn: number;
    initiativeSlots: InitiativeSlot[];
    activeInitiativeSlotId: string;
    initActive: () => void;
    incrementRound: () => void;
    decrementRound: () => void;
    incrementTurn: () => void;
    decrementTurn: () => void;
    reset: () => void;
    rollInitiative: () => void;
}

export const useTurnStore = create<TurnStore>((set, get) => ({
    round: 1,
    turn: 1,
    initiativeSlots: [new InitiativeSlot(false), new InitiativeSlot(false), new InitiativeSlot(true), new InitiativeSlot(false)],
    activeInitiativeSlotId: "",
    initActive: () => set(state => ({activeInitiativeSlotId: state.initiativeSlots[0].id})),
    incrementRound: () => set((state) => ({round: state.round + 1})),
    decrementRound: () => set((state) => ({round: Math.max(state.round - 1, 1)})),
    incrementTurn: () => {
        const initiativeSlots = get().initiativeSlots;
        const activeIndex = initiativeSlots.findIndex(slot => slot.id === get().activeInitiativeSlotId);
        let nextIndex = activeIndex + 1;
        if (nextIndex === initiativeSlots.length) {
            nextIndex = 0;
            set((state) => ({round: state.round + 1}))
        }

        set({
            activeInitiativeSlotId: initiativeSlots[nextIndex].id,
            turn: nextIndex+1
        })
    },
    decrementTurn: () => {

        set((state)=>({
            turn: Math.max(state.turn - 1, 1),
        }))

        set((state)=>({
            activeInitiativeSlotId: state.initiativeSlots[state.turn-1].id
        }))
    },
    reset: () => set(() => ({
        turn: 1,
        round: 1
    })),
    rollInitiative: () => {
    }
}));

useTurnStore.getState().initActive();
