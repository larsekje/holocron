// src/state/pocketedResultsStore.ts
import create from "zustand";

interface PocketedResult {
    id: string;
    label: string;
    value: number;
    source: string;
}

interface PocketedResultsState {
    pocketedResults: PocketedResult[]; // Array of results
    addResult: (result: PocketedResult) => void; // Add a new result
    clearResults: () => void; // Clear all results
}

const usePocketedResultsStore = create<PocketedResultsState>((set) => ({
    pocketedResults: [
        { id: "1", label: "Advantage", value: 2, source: "Thenn Hodar's agility check" },
        { id: "2", label: "Setback", value: 4, source: "Manually added" },
        { id: "3", label: "Threat", value: 1, source: "Result from combat round" },
        { id: "4", label: "Triumph", value: 3, source: "Tasha's perception check" },
        { id: "4", label: "Triumph", value: 3, source: "Tasha's perception check" },
    ],

    // Add a new result to the array
    addResult: (result) =>
        set((state) => ({
            pocketedResults: [...state.pocketedResults, result],
        })),
    // Clear all results
    clearResults: () =>
        set(() => ({
            pocketedResults: [],
        })),
}));

export default usePocketedResultsStore;