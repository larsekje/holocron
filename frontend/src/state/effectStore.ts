import create from "zustand";
import {ActiveEffect, Effect} from "@/types/effectTypes";

// Define the Zustand store interface
interface EffectStore {
    effects: ActiveEffect[];
    addEffect: (effect: ActiveEffect) => void;
    removeEffect: (effectId: string) => void;
    // triggerEffects: (trigger: Effect["trigger"]) => void;
    // reduceDuration: () => void;
}

export const useEffectStore = create<EffectStore>((set) => ({
    effects: [],

    // Add a new effect to the store
    addEffect: (effect) =>
        set((state) => ({
            effects: [...state.effects, effect],
        })),

    // Remove an effect by its ID
    removeEffect: (effectId) =>
        set((state) => ({
            effects: state.effects.filter((effect) => effect.effect.id !== effectId),
        })),

    // Trigger applicable effects based on a given trigger
    /*triggerEffects: (trigger) =>
        set((state) => {
            state.effects
                .filter((effect) => effect.trigger === trigger)
                .forEach((effect) => {
                    console.log(`Triggered Effect: ${effect.name}`);
                    // Add logic here to apply the effect's modifiers
                });

            return state; // Preserve the state structure while triggering
        }),

    // Reduce effect durations by one round and remove expired effects
    reduceDuration: () =>
        set((state) => ({
            effects: state.effects
                .map((effect) =>
                    effect.duration && effect.duration > 0
                        ? { ...effect, duration: effect.duration - 1 }
                        : effect.duration === 0
                            ? null // Mark expired effects for removal
                            : effect
                )
                .filter((effect) => effect !== null) as Effect[], // Remove all expired effects
        })),*/
}));