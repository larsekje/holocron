import { create } from 'zustand';

export interface InitiativeSlot {
    id: string; // Unique identifier for the slot
    type: 'pc' | 'npc'; // Type of slot: PC or NPC
    initiativeRoll: number; // The initiative roll value for sorting (initial roll)
    hasActed: boolean; // Whether this slot has acted in the current round
}

type CombatStore = {
    combatActive: boolean; // Is combat ongoing?
    round: number; // Current round number
    initiative: InitiativeSlot[]; // List of initiative slots
    initializeCombat: (initiative: InitiativeSlot[]) => void; // Start combat with initiative slots
    useInitiativeSlot: (id: string) => void; // Mark a slot as used
    addInitiativeSlotToEnd: (slot: InitiativeSlot) => void; // Add a new slot to the end of the initiative
    resetForNextRound: () => void; // Reset `hasActed` for all slots for the next round
    nextRound: () => void; // Move to the next round
    endCombat: () => void; // Ends combat and resets the store
};

const useCombatStore = create<CombatStore>((set) => ({
    combatActive: false,
    round: 0,
    initiative: [],
    // Initialize combat with given initiative slots
    initializeCombat: (initiative) =>
        set(() => ({
            combatActive: true,
            round: 1,
            initiative: initiative.map((slot) => ({
                ...slot,
                hasActed: false, // Set all to not acted for the first round
            })),
        })),
    // Mark a specific slot as used
    useInitiativeSlot: (id) =>
        set((state) => ({
            initiative: state.initiative.map((slot) =>
                slot.id === id ? { ...slot, hasActed: true } : slot
            ),
        })),
    // Add a new initiative slot to the end of the list
    addInitiativeSlotToEnd: (slot) =>
        set((state) => ({
            initiative: [
                ...state.initiative,
                { ...slot, hasActed: false }, // Append new slot to the end
            ],
        })),
    // Reset all slots for the next round
    resetForNextRound: () =>
        set((state) => ({
            initiative: state.initiative.map((slot) => ({
                ...slot,
                hasActed: false, // Reset `hasActed` state
            })),
        })),
    // Advance to the next round and reset `hasActed`
    nextRound: () =>
        set((state) => ({
            round: state.round + 1,
            initiative: state.initiative.map((slot) => ({
                ...slot,
                hasActed: false, // Reset for the new round
            })),
        })),
    // End combat and reset the state
    endCombat: () => set(() => ({ combatActive: false, round: 0, initiative: [] })),
}));

export default useCombatStore;