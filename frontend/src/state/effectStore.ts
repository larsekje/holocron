import { create } from 'zustand';
import { ActiveEffect, Effect, EffectTarget } from '../types/effectTypes';
import { addGameEventListener, removeGameEventListener, GameEvent } from './eventSystem';
import useParticipantStore from './participantsStore';
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
    remainingDuration?: number; // Track remaining duration
}

export const useEffectStore = create<EffectStore>((set, get) => ({
    effects: [],
    activeEffects: [],
    addEffect: (effect: Effect, target: EffectTarget) => {
        debugLog('EffectStore', `Adding effect: ${effect.name}`, effect);
        const id = Math.random().toString(36).substring(7);
        set(state => ({
            effects: [
                ...state.effects, 
                { 
                    id, 
                    effect, 
                    target,
                    remainingDuration: effect.duration || 0 // Initialize remaining duration
                }
            ]
        }));
    },
    removeEffect: (effectId: string) => {
        debugLog('EffectStore', `Removing effect with ID: ${effectId}`);
        set(state => ({
            effects: state.effects.filter(e => e.id !== effectId)
        }));
    },
    decrementEffectDuration: (effectId) => {
        set(state => {
            const updatedEffects = state.effects.map(effect => {
                if (effect.id === effectId && effect.remainingDuration !== undefined) {
                    const newDuration = Math.max(0, effect.remainingDuration - 1);
                    debugLog('EffectStore', `Decrementing duration for ${effect.effect.name} from ${effect.remainingDuration} to ${newDuration}`);
                    return { ...effect, remainingDuration: newDuration };
                }
                return effect;
            });
            
            // Filter out any effects that have reached zero duration
            const filteredEffects = updatedEffects.filter(effect => {
                if (effect.remainingDuration !== undefined && effect.remainingDuration <= 0) {
                    debugLog('EffectStore', `Auto-removing expired effect: ${effect.effect.name}`);
                    return false;
                }
                return true;
            });
            
            return { effects: filteredEffects };
        });
    }
}));

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
        'TURN_START': 'turn-start',
        'TURN_ACTION': 'turn-action',
        'TURN_END': 'turn-end',
        'ROUND_START': 'round-start',
        'ROUND_END': 'round-end'
    };
    
    const currentTrigger = eventTriggerMap[event.type];
    debugLog('EffectStore', `Looking for effects with trigger: ${currentTrigger}`);

    // First, handle duration decrements for TURN_END and ROUND_END events
    if (event.type === 'TURN_END' && participant) {
        debugLog('EffectStore', `Processing TURN_END for durations on ${participant.name}`);
        
        // Find all effects targeting this specific character
        effects.forEach(effect => {
            if (effect.target.type === 'character' && effect.target.participantId === participant.id) {
                debugLog('EffectStore', `Found effect on ${participant.name}: ${effect.effect.name}`, effect);
                
                if (effect.remainingDuration !== undefined && effect.remainingDuration > 0) {
                    debugLog('EffectStore', `Decrementing duration for effect ${effect.effect.name} on ${participant.name} from ${effect.remainingDuration}`);
                    decrementEffectDuration(effect.id);
                    
                    // If this would reduce it to zero, remove it
                    if (effect.remainingDuration <= 1) {
                        debugLog('EffectStore', `Effect ${effect.effect.name} has expired, removing`);
                        removeEffect(effect.id);
                    }
                }
            }
        });
    } else if (event.type === 'ROUND_END') {
        debugLog('EffectStore', `Processing ROUND_END for global effect durations`);
        
        // Find all global effects
        effects.forEach(effect => {
            if (effect.target.type === 'global') {
                if (effect.remainingDuration !== undefined && effect.remainingDuration > 0) {
                    debugLog('EffectStore', `Decrementing duration for global effect ${effect.effect.name} from ${effect.remainingDuration}`);
                    decrementEffectDuration(effect.id);
                    
                    // If this would reduce it to zero, remove it
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