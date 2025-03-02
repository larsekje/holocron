import { create } from 'zustand';
import { ActiveEffect, Effect, EffectTarget } from '../types/effectTypes';
import { addGameEventListener, removeGameEventListener, GameEvent } from './eventSystem';
import useParticipantStore from './participantsStore';

// Define the Zustand store interface
interface EffectStore {
    effects: ParticipantEffect[];
    addEffect: (effect: Effect, target: EffectTarget) => void;
    removeEffect: (effectId: string) => void;
}

interface ParticipantEffect {
    id: string;
    effect: Effect;
    target: EffectTarget;
}

export const useEffectStore = create<EffectStore>((set, get) => ({
    effects: [],
    addEffect: (effect: Effect, target: EffectTarget) => {
        const id = Math.random().toString(36).substring(7);
        set(state => ({
            effects: [...state.effects, { id, effect, target }]
        }));
    },
    removeEffect: (effectId: string) => {
        set(state => ({
            effects: state.effects.filter(e => e.id !== effectId)
        }));
    },
}));

// Set up game event listener for effect triggers
addGameEventListener((event) => {
    console.log(`[EffectStore] Processing event: ${event.type}`, event);
    const effects = useEffectStore.getState().effects;
    const participants = useParticipantStore.getState().participants;

    // Find the participant if we have a participantId
    const participant = event.participantId ? 
        participants.find(p => p.id === event.participantId) : 
        undefined;
    
    if (participant) {
        console.log(`[EffectStore] Found participant for event: ${participant.name}`);
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
    console.log(`[EffectStore] Looking for effects with trigger: ${currentTrigger}`);

    // Process effects that match the trigger type
    effects.forEach(effect => {
        // Only process effects that match the current trigger
        if (effect.effect.behavior.trigger !== currentTrigger) {
            return;
        }
        
        console.log(`[EffectStore] Found effect with matching trigger: ${effect.effect.behavior.trigger}`);
        
        // Skip if no participant found and this is a character-targeted effect
        if (!participant && effect.target.type === 'character') {
            console.log('[EffectStore] Skipping character effect, no participant');
            return;
        }

        // For character-targeted effects, only trigger if it matches the current participant
        if (effect.target.type === 'character' && participant) {
            if (effect.target.participantId === participant.id) {
                console.log(`[EffectStore] Character effect matches participant: ${participant.name}`);
                console.log(`[EffectStore] Applying ${currentTrigger} effect to ${participant.name}`);
                if (effect.effect.apply) {
                    effect.effect.apply();
                }
            }
        }

        // Global effects always trigger
        if (effect.target.type === 'global') {
            console.log(`[EffectStore] Applying global ${currentTrigger} effect`);
            if (effect.effect.apply) {
                effect.effect.apply();
            }
        }
    });
});