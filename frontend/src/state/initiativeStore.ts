import { create } from "zustand";

interface InitiativeCharacter {
    id: string;
    initiative: number;
    isPlayer: boolean;
}

interface InitiativeStore {
    slots: InitiativeCharacter[]; // Array of characters with id, initiative, and isPlayer
    sortedSlots: { id: string; label: "PC" | "NPC" }[]; // Derived, sorted order
    updateInitiative: (id: string, newInitiative: number) => void; // Update initiative
    addCharacter: (character: InitiativeCharacter) => void; // Add a character
    removeCharacter: (id: string) => void; // Remove a character
    computeSortedSlots: () => void; // Manually recalculate sorting/grouping
}

const useInitiativeStore = create<InitiativeStore>((set, get) => ({
    slots: [], // Initially empty
    sortedSlots: [], // Compute from `slots`

    // Method to update a character's initiative
    updateInitiative: (id, newInitiative) =>
        set((state) => {
            const updatedSlots = state.slots.map((character) =>
                character.id === id ? { ...character, initiative: newInitiative } : character
            );

            return {
                slots: updatedSlots,
                sortedSlots: updatedSlots
                    .slice() // Create a copy for sorting
                    .sort((a, b) => b.initiative - a.initiative) // Sort by initiative descending
                    .map((character) => ({
                        id: character.id,
                        label: character.isPlayer ? "PC" : "NPC",
                    })), // Group/map to PC/NPC
            };
        }),

    // Method to add a new character
    addCharacter: (character) =>
        set((state) => ({
            slots: [...state.slots, character],
            sortedSlots: [...state.slots, character]
                .sort((a, b) => b.initiative - a.initiative) // Recompute sort
                .map((character) => ({
                    id: character.id,
                    label: character.isPlayer ? "PC" : "NPC",
                })),
        })),

    // Method to remove a character
    removeCharacter: (id) =>
        set((state) => {
            const updatedSlots = state.slots.filter((character) => character.id !== id);
            return {
                slots: updatedSlots,
                sortedSlots: updatedSlots
                    .slice() // Create a copy for sorting
                    .sort((a, b) => b.initiative - a.initiative) // Recompute sort
                    .map((character) => ({
                        id: character.id,
                        label: character.isPlayer ? "PC" : "NPC",
                    })), // Group/map to PC/NPC
            };
        }),

    // Optional: Manual recomputation (e.g., bulk updates)
    computeSortedSlots: () => {
        set((state) => ({
            sortedSlots: state.slots
                .slice() // Create a copy for sorting
                .sort((a, b) => b.initiative - a.initiative) // Sort by initiative descending
                .map((character) => ({
                    id: character.id,
                    label: character.isPlayer ? "PC" : "NPC",
                })), // Group/map to PC/NPC
        }));
    },
}));