import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { holocronPersist } from './persist';
import {Participant} from "@/state/participantsStore";

interface Encounter {
    id: string; // Unique identifier for the encounter
    name: string; // Name of the encounter
    description: string; // Details about the encounter
    npcs: Participant[]; // List of NPCs in the encounter
    environment?: string; // Special environmental rules or features
    goals?: string[]; // List of encounter-specific goals
}

interface EncountersStore {
    activeEncounter?: Encounter; // The currently loaded encounter

    // Manage encounters
    loadEncounter: (encounter: Encounter) => void; // Starts a new encounter
    clearEncounter: () => void; // Clears the active encounter
    updateGoals: (goals: string[]) => void; // Update encounter goals dynamically
}

const useEncountersStore = create<EncountersStore>()(persist((set) => ({
    activeEncounter: undefined,

    // Load a new encounter
    loadEncounter: (encounter) =>
        set(() => ({
            activeEncounter: encounter,
        })),

    // Clear the active encounter
    clearEncounter: () =>
        set(() => ({
            activeEncounter: undefined,
        })),

    // Update encounter goals
    updateGoals: (goals) =>
        set((state) => ({
            activeEncounter: state.activeEncounter
                ? { ...state.activeEncounter, goals }
                : undefined,
        })),
}), holocronPersist({
    name: 'encounters',
    partialize: (s) => ({ activeEncounter: s.activeEncounter }),
})));

export default useEncountersStore;