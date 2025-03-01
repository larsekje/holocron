import {Participant} from "@/state/participantsStore";

export type EffectTrigger = 'SLOT_CLAIMED' | 'TURN_END' | 'ROUND_START' | 'ROUND_END';

export type EffectTarget = {
    type: 'character';
    participantId: string;
} | {
    type: 'global';
};

export type EffectAction = {
    trigger: EffectTrigger;
    apply: (participant?: Participant) => void;
};

export type Effect = {
    id: string;
    name: string;
    description: string;
    trigger: EffectTrigger;
    target: EffectTarget;
    effect: EffectAction;
}

export type ActiveEffect = {
    id: string;
    effect: Effect;
}

export interface ToastConfig {
    title: string;
    description?: string;
    status?: 'info' | 'warning' | 'success' | 'error';
}