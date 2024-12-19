import {Participant} from "@/state/participantsStore";

export interface Effect {
    id: string;
    name: string;
    description?: string;
}

export interface ParticipantEffect extends Effect {
    type: "debuff" | "buff" | "persistence"; // Type of effect
    trigger: "immediate" | "turn-start" | "turn-end"; // When the effect is applied
    duration: number | null; // Number of turns the effect lasts (null = indefinite)
    apply: (participant: Participant) => void; // Effect's logic when applied
    end?: (participant: Participant) => void; // Cleanup logic when the effect ends
}

export interface ActiveEffect {
    effect: ParticipantEffect; // The effect being applied
    remainingDuration: number | null; // Turns remaining for this specific instance
}