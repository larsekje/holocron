import {Participant} from "@/state/participantsStore";

export type EffectTarget = {
    type: 'character' | 'initiative' | 'global';
    participantId?: string;
    slot?: number;
};

export type EffectBehavior = {
    type: 'active' | 'passive' | 'reminder';
    trigger: 'immediate' | 'turn-start' | 'turn-end';
};

export interface ToastConfig {
    title: string;
    description?: string;
    status?: 'info' | 'warning' | 'success' | 'error';
}

export interface Effect {
    id: string;
    name: string;
    description?: string;
    target: EffectTarget;
    behavior: EffectBehavior;
    type: string;
    duration: number;
    apply?: () => void;
}

export interface ParticipantEffect extends Effect {
    type: string;
    duration: number;
}

export interface ActiveEffect {
    effect: ParticipantEffect;
    target: EffectTarget;
    remainingDuration: number;
    appliedAt: number;
}