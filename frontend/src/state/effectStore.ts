import { create } from 'zustand';
import { ActiveEffect, Effect, EffectTarget } from '../types/effectTypes';
import { addFSMEventListener, removeFSMEventListener } from './FSM';

// Define the Zustand store interface
interface EffectStore {
    effects: ActiveEffect[];
    addEffect: (effect: ActiveEffect) => void;
    removeEffect: (effectId: string) => void;
    triggerEffects: (trigger: 'turn-start' | 'turn-end', participantId?: string) => number;
    reduceDuration: () => void;
    getEffectsForTarget: (target: EffectTarget) => ActiveEffect[];
    setupGamePlaySubscription: () => void;
}

const logEffect = (action: string, effect: ActiveEffect) => {
    console.log(`[Effect System] ${action}:`, {
        name: effect.effect.name,
        target: effect.target,
        behavior: effect.effect.behavior,
        duration: `${effect.remainingDuration ?? 'indefinite'} turns`,
        timestamp: new Date().toISOString()
    });
};

export const useEffectStore = create<EffectStore>((set, get) => ({
    effects: [],

    setupGamePlaySubscription: () => {
        const handleFSMEvent = (event: { type: string; participantId?: string }) => {
            if (!event.participantId) return;

            switch (event.type) {
                case 'TURN_START':
                    get().triggerEffects('turn-start', event.participantId);
                    break;
                case 'TURN_END':
                    get().triggerEffects('turn-end', event.participantId);
                    break;
            }
        };

        addFSMEventListener(handleFSMEvent);
        return () => removeFSMEventListener(handleFSMEvent);
    },

    addEffect: (effect) => {
        logEffect('Adding effect', effect);
        set((state) => ({
            effects: [...state.effects, effect],
        }));
    },

    removeEffect: (effectId) => {
        const effectToRemove = get().effects.find(e => e.effect.id === effectId);
        if (effectToRemove) {
            logEffect('Removing effect', effectToRemove);
        }
        set((state) => ({
            effects: state.effects.filter((e) => e.effect.id !== effectId),
        }));
    },

    triggerEffects: (trigger: 'turn-start' | 'turn-end', participantId?: string) => {
        console.log(`[Effect System] Triggering ${trigger} effects for participant:`, participantId);
        
        const effectsToTrigger = get().effects.filter(e => {
            // Check if effect should trigger at this time
            if (e.effect.behavior.trigger !== trigger) {
                return false;
            }

            // For character-targeted effects, only trigger if it matches the current participant
            if (e.target.type === 'character' && participantId) {
                return e.target.participantId === participantId;
            }

            // For initiative-targeted effects, we would check initiative order here
            if (e.target.type === 'initiative') {
                // TODO: Add initiative order check when implemented
                return true;
            }

            // Global effects always trigger
            if (e.target.type === 'global') {
                return true;
            }

            return false;
        });
        
        effectsToTrigger.forEach(effect => {
            console.log(`[Effect System] Triggering effect: ${effect.effect.name}`, {
                target: effect.target,
                behavior: effect.effect.behavior
            });
            if (effect.effect.apply) {
                effect.effect.apply();
            }
        });
        
        return effectsToTrigger.length;
    },

    reduceDuration: () => {
        console.log('[Effect System] Reducing duration of effects');
        set((state) => {
            const expiredEffects: ActiveEffect[] = [];
            const updatedEffects = state.effects.map((effect) => {
                if (effect.remainingDuration === null) return effect;
                
                const newDuration = effect.remainingDuration - 1;
                if (newDuration <= 0) {
                    expiredEffects.push(effect);
                    return null;
                }
                
                return {
                    ...effect,
                    remainingDuration: newDuration
                };
            }).filter((effect): effect is ActiveEffect => effect !== null);

            expiredEffects.forEach(effect => {
                logEffect('Effect expired', effect);
                if (effect.effect.end) {
                    console.log(`[Effect System] Would run cleanup for: ${effect.effect.name}`);
                }
            });

            return { effects: updatedEffects };
        });
    },

    getEffectsForTarget: (target) => {
        const effects = get().effects.filter(effect => {
            if (target.type !== effect.target.type) return false;
            
            switch (target.type) {
                case 'character':
                    return target.participantId === effect.target.participantId;
                case 'initiative':
                    return target.slot === effect.target.slot;
                case 'global':
                    return true;
                default:
                    return false;
            }
        });
        
        console.log(`[Effect System] Getting effects for target:`, {
            targetType: target.type,
            effectsFound: effects.length
        });
        
        return effects;
    },
}));

// Initialize the subscription when the store is created
useEffectStore.getState().setupGamePlaySubscription();