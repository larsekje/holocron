import { create } from 'zustand';
import { ActiveEffect, Effect, EffectTarget, EffectTrigger } from '../types/effectTypes';
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
    const effects = useEffectStore.getState().effects;
    const participants = useParticipantStore.getState().participants;

    // Find the participant if we have a participantId
    const participant = event.participantId ? 
        participants.find(p => p.id === event.participantId) : 
        undefined;

    // Process effects that match the trigger type
    effects.forEach(effect => {
        // Skip if no participant found and this is a character-targeted effect
        if (!participant && effect.target.type === 'character') return;

        // For character-targeted effects, only trigger if it matches the current participant
        if (effect.target.type === 'character' && participant) {
            if (effect.target.participantId === participant.id) {
                if (event.type === 'SLOT_CLAIMED' && effect.effect.trigger === 'SLOT_CLAIMED') {
                    effect.effect.apply(participant);
                }
                if (event.type === 'TURN_END' && effect.effect.trigger === 'TURN_END') {
                    effect.effect.apply(participant);
                }
            }
        }

        // Global effects always trigger
        if (effect.target.type === 'global') {
            if (event.type === 'SLOT_CLAIMED' && effect.effect.trigger === 'SLOT_CLAIMED') {
                effect.effect.apply(participant);
            }
            if (event.type === 'TURN_END' && effect.effect.trigger === 'TURN_END') {
                effect.effect.apply(participant);
            }
        }
    });
});