import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { holocronPersist } from './persist';
import { ActiveEffect, Effect, EffectDuration, EffectTarget } from '../types/effectTypes';
import { addGameEventListener, removeGameEventListener, GameEvent } from './eventSystem';
import useParticipantStore from './participantsStore';
import useSessionLogStore from './sessionLogStore';
import { debugLog } from '../utils/debug';

// Define the Zustand store interface
interface EffectStore {
    effects: ParticipantEffect[];
    activeEffects: ActiveEffect[];
    addEffect: (effect: Effect, target: EffectTarget) => void;
    removeEffect: (effectId: string) => void;
    decrementEffectDuration: (effectId: string) => void;
}

interface ParticipantEffect {
    id: string;
    effect: Effect;
    target: EffectTarget;
    remainingDuration?: EffectDuration; // number | 'encounter' | undefined
}

function targetMatches(a: EffectTarget, b: EffectTarget): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'character') return a.participantId === b.participantId;
    return true;
}

export const useEffectStore = create<EffectStore>()(persist((set, get) => ({
    effects: [],
    activeEffects: [],
    addEffect: (effect: Effect, target: EffectTarget) => {
        debugLog('EffectStore', `Adding effect: ${effect.name}`, effect);
        const id = Math.random().toString(36).substring(7);
        let didReplace = false;
        set(state => {
            // Dedup: if an effect with the same name already targets the same participant,
            // drop the old one. The fresh entry's duration replaces it (so re-applying
            // a status refreshes its timer rather than stacking visible chips).
            const before = state.effects.length;
            const filtered = state.effects.filter(
                (e) => !(e.effect.name === effect.name && targetMatches(e.target, target)),
            );
            didReplace = filtered.length !== before;
            return {
                effects: [
                    ...filtered,
                    {
                        id,
                        effect,
                        target,
                        // Preserve undefined / 'encounter' verbatim; only numeric durations decrement.
                        remainingDuration: effect.duration,
                    },
                ],
            };
        });
        // Timeline log: "X is now Immobilized" (or "refreshed" on re-apply).
        // Skipped for global / initiative-targeted effects — those don't have
        // a participant to name.
        if (target.type === 'character' && target.participantId) {
            const p = useParticipantStore
                .getState()
                .participants.find((x) => x.id === target.participantId);
            const name = p?.name ?? 'Target';
            useSessionLogStore.getState().log({
                kind: 'effect-added',
                participantId: target.participantId,
                participantName: p?.name,
                summary: didReplace
                    ? `${name}: ${effect.name} refreshed`
                    : `${name} is now ${effect.name}`,
                tone: 'warn',
            });
        }
    },
    removeEffect: (effectId: string) => {
        debugLog('EffectStore', `Removing effect with ID: ${effectId}`);
        // Capture name + target before mutation for the timeline log.
        const existing = get().effects.find((e) => e.id === effectId);
        set(state => ({
            effects: state.effects.filter(e => e.id !== effectId)
        }));
        if (existing && existing.target.type === 'character' && existing.target.participantId) {
            const p = useParticipantStore
                .getState()
                .participants.find((x) => x.id === existing.target.participantId);
            const name = p?.name ?? 'Target';
            useSessionLogStore.getState().log({
                kind: 'effect-removed',
                participantId: existing.target.participantId,
                participantName: p?.name,
                summary: `${name} recovers from ${existing.effect.name}`,
                tone: 'good',
            });
        }
    },
    decrementEffectDuration: (effectId) => {
        set(state => {
            const updatedEffects = state.effects.map(effect => {
                // Only numeric remaining durations decrement; 'encounter' / undefined are skipped.
                if (effect.id === effectId && typeof effect.remainingDuration === 'number') {
                    const newDuration = Math.max(0, effect.remainingDuration - 1);
                    debugLog('EffectStore', `Decrementing duration for ${effect.effect.name} from ${effect.remainingDuration} to ${newDuration}`);
                    return { ...effect, remainingDuration: newDuration };
                }
                return effect;
            });

            // Filter out any effects that have reached zero numeric duration.
            const filteredEffects = updatedEffects.filter(effect => {
                if (typeof effect.remainingDuration === 'number' && effect.remainingDuration <= 0) {
                    debugLog('EffectStore', `Auto-removing expired effect: ${effect.effect.name}`);
                    return false;
                }
                return true;
            });

            return { effects: filteredEffects };
        });
    }
}), holocronPersist({
    name: 'effects',
    // Persist active effects only. Strip `effect.apply` from each entry —
    // it's a closure (toast callback) created by the React component that
    // applied the effect; closures don't survive serialization. The
    // mechanical behavior lives in effectsEngine.ts keyed off
    // `effect.status`/`rank`/etc., which IS serializable. After reload,
    // the chip and its mechanical effects continue working; the only
    // loss is the per-tick toast announcement.
    partialize: (s) => ({
        effects: s.effects.map((pe) => ({
            ...pe,
            effect: { ...pe.effect, apply: undefined },
        })),
    }),
})));

// Set up game event listener for effect triggers
addGameEventListener((event) => {
    debugLog('EffectStore', `Processing event: ${event.type}`, event);
    const effects = useEffectStore.getState().effects;
    const participants = useParticipantStore.getState().participants;
    const { decrementEffectDuration, removeEffect } = useEffectStore.getState();

    // Find the participant if we have a participantId
    const participant = event.participantId ? 
        participants.find(p => p.id === event.participantId) : 
        undefined;
    
    if (participant) {
        debugLog('EffectStore', `Found participant for event: ${participant.name}`);
    }

    // Get the corresponding trigger for the current event
    const eventTriggerMap: Record<GameEvent, string> = {
        'TURN_START':    'turn-start',
        'TURN_ACTION':   'turn-action',
        'TURN_END':      'turn-end',
        'ROUND_START':   'round-start',
        'ROUND_END':     'round-end',
        'ENCOUNTER_END': 'encounter-end',
    };

    const currentTrigger = eventTriggerMap[event.type];
    debugLog('EffectStore', `Looking for effects with trigger: ${currentTrigger}`);

    // ENCOUNTER_END: clear every effect whose duration is the 'encounter' sentinel.
    if (event.type === 'ENCOUNTER_END') {
        const expiring = effects.filter((e) => e.remainingDuration === 'encounter');
        if (expiring.length > 0) {
            debugLog('EffectStore', `ENCOUNTER_END clearing ${expiring.length} encounter-duration effect(s)`);
            expiring.forEach((e) => removeEffect(e.id));
        }
    }

    // TURN_END / ROUND_END: numeric durations tick down and auto-clear at 0.
    // 'encounter' and undefined durations are deliberately skipped here.
    if (event.type === 'TURN_END' && participant) {
        debugLog('EffectStore', `Processing TURN_END for durations on ${participant.name}`);

        effects.forEach(effect => {
            if (effect.target.type === 'character' && effect.target.participantId === participant.id) {
                debugLog('EffectStore', `Found effect on ${participant.name}: ${effect.effect.name}`, effect);

                if (typeof effect.remainingDuration === 'number' && effect.remainingDuration > 0) {
                    debugLog('EffectStore', `Decrementing duration for ${effect.effect.name} on ${participant.name} from ${effect.remainingDuration}`);
                    decrementEffectDuration(effect.id);

                    // If this would reduce it to zero, remove it.
                    if (effect.remainingDuration <= 1) {
                        debugLog('EffectStore', `Effect ${effect.effect.name} has expired, removing`);
                        removeEffect(effect.id);
                    }
                }
            }
        });
    } else if (event.type === 'ROUND_END') {
        debugLog('EffectStore', `Processing ROUND_END for global effect durations`);

        effects.forEach(effect => {
            if (effect.target.type === 'global') {
                if (typeof effect.remainingDuration === 'number' && effect.remainingDuration > 0) {
                    debugLog('EffectStore', `Decrementing duration for global ${effect.effect.name} from ${effect.remainingDuration}`);
                    decrementEffectDuration(effect.id);

                    if (effect.remainingDuration <= 1) {
                        debugLog('EffectStore', `Global effect ${effect.effect.name} has expired, removing`);
                        removeEffect(effect.id);
                    }
                }
            }
        });
    }

    // Now, process effects that match the trigger type for applying effects
    effects.forEach(effect => {
        // Only process effects that match the current trigger
        if (effect.effect.behavior.trigger !== currentTrigger) {
            return;
        }
        
        debugLog('EffectStore', `Found effect with matching trigger: ${effect.effect.behavior.trigger}`, effect);
        
        // Skip if no participant found and this is a character-targeted effect
        if (!participant && effect.target.type === 'character') {
            debugLog('EffectStore', 'Skipping character effect, no participant');
            return;
        }

        // For character-targeted effects, only trigger if it matches the current participant
        if (effect.target.type === 'character' && participant) {
            if (effect.target.participantId === participant.id) {
                debugLog('EffectStore', `Character effect matches participant: ${participant.name}`);
                debugLog('EffectStore', `Applying ${currentTrigger} effect to ${participant.name}`, effect);
                
                // Apply the effect
                if (effect.effect.apply) {
                    // If we have a remaining duration, include it in the toast message
                    const durationMessage = effect.remainingDuration !== undefined ? 
                        ` (${effect.remainingDuration} rounds remaining)` : '';
                    
                    // Call apply with participant and remaining duration
                    effect.effect.apply(participant, durationMessage);
                }
            }
        }

        // Global effects always trigger
        if (effect.target.type === 'global') {
            debugLog('EffectStore', `Applying global ${currentTrigger} effect`, effect);
            
            // Apply the effect
            if (effect.effect.apply) {
                const durationMessage = effect.remainingDuration !== undefined ? 
                    ` (${effect.remainingDuration} rounds remaining)` : '';
                
                effect.effect.apply(undefined, durationMessage);
            }
        }
    });
});