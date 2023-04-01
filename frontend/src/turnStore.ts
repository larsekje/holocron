import { create } from 'zustand'
import {nanoid} from "nanoid";
import {Target} from "./target";
import {useTargetStore} from "./targetStore";


export class InitiativeSlot {
    id: string;
    isNPC: boolean;
    current: boolean;
    active: boolean;
    initiative: number;

    constructor(isNPC: boolean, initiative: number) {
        this.id = nanoid();
        this.isNPC = isNPC;
        this.current = false;
        this.active = true;
        this.initiative = initiative;
    }
}

interface TurnStore{
    round: number;
    turn: number;
    initiativeSlots: InitiativeSlot[];
    activeInitiativeSlotId: string;
    isChoosingActivePlayer: boolean;
    setChoosingActivePlayer: (isChoosing: boolean) => void;
    isActiveSlotNPC: () => boolean;
    incrementRound: () => void;
    decrementRound: () => void;
    incrementTurn: () => void;
    decrementTurn: () => void;
    reset: () => void;
    rollInitiative: (targets: Target[]) => void;
}

export const useTurnStore = create<TurnStore>((set, get) => ({
    round: 1,
    turn: 1,
    initiativeSlots: [],
    activeInitiativeSlotId: "",
    isChoosingActivePlayer: true,
    setChoosingActivePlayer: (isChoosing) => set({isChoosingActivePlayer: isChoosing}),
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
        round: 1,
        activeInitiativeSlotId: get().initiativeSlots[0].id
    })),
    rollInitiative: (targets) => {

        // create initiative slots from targets
        const initiativeSlots = []
        for(let target of targets){
            const slot = new InitiativeSlot(target.isNPC, target.rollInitiative());
            initiativeSlots.push(slot);
        }

        // Sort - prioritize higher numbers
        initiativeSlots.sort((x, y) => {return x.initiative < y.initiative ? -1 : x.initiative > y.initiative ? 1 : 0;})

        set({
            initiativeSlots: initiativeSlots,
            activeInitiativeSlotId: initiativeSlots[0].id
        })
    },
    isActiveSlotNPC: () => {
        const activeSlot = get().initiativeSlots[get().turn-1];
        return activeSlot.isNPC;
    }
}));

const targets = useTargetStore.getState().targets;
useTurnStore.getState().rollInitiative(targets);
