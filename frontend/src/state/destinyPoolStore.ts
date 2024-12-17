// src/stores/destinyStore.ts
import { create } from "zustand";

interface DestinyStoreState {
    flipDestinyPoint: (atIndex: number) => void; // Flip a light to dark or vice versa
    setDestinyPool: (lightSideCount: number, darksideCount: number) => void; // Remove a point from Light or Dark
    clearDestinyPool: () => void; // Reset the pool
    destinyPool: boolean[];  // true for light side
}

export const useDestinyStore = create<DestinyStoreState>((set, get) => ({
    destinyPool: [],

    flipDestinyPoint: (atIndex: number) => {
        const destinyPool = get().destinyPool;
        destinyPool[atIndex] = !destinyPool[atIndex];

        set({ destinyPool: destinyPool });
    },

    clearDestinyPool: () =>
        set({ destinyPool: [] }),

    setDestinyPool: (lightSideCount, darkSideCount) => {
        console.log("setDestinyPool raw", lightSideCount, darkSideCount);

        lightSideCount = Math.max(0, lightSideCount || 0); // Ensure lightSideCount is valid
        darkSideCount = Math.max(0, darkSideCount || 0);   // Ensure darkSideCount is valid

        console.log("setDestinyPool validated", lightSideCount, darkSideCount);

        set({
            destinyPool: [
                ...new Array(lightSideCount).fill(true), // Create light tokens
                ...new Array(darkSideCount).fill(false), // Create dark tokens
            ],
        })
    }
}));