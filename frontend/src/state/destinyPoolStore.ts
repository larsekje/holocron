// src/stores/destinyStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { holocronPersist } from "./persist";

interface DestinyStoreState {
    flipDestinyPoint: (atIndex: number) => void; // Flip a light to dark or vice versa
    setDestinyPool: (lightSideCount: number, darksideCount: number) => void; // Remove a point from Light or Dark
    clearDestinyPool: () => void; // Reset the pool
    destinyPool: boolean[];  // true for light side
}

export const useDestinyStore = create<DestinyStoreState>()(persist((set, get) => ({
    destinyPool: [],

    flipDestinyPoint: (atIndex: number) => {
        // New array, not an in-place flip: selector subscribers compare by
        // reference and would miss a mutation of the same array.
        const destinyPool = get().destinyPool.map((isLight, i) =>
            i === atIndex ? !isLight : isLight,
        );

        set({ destinyPool });
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
}), holocronPersist({
    name: 'destinyPool',
    partialize: (s) => ({ destinyPool: s.destinyPool }),
})));