import { create } from "zustand";
import EventBus from "@/utils/events";
import { nanoid } from "nanoid";

export interface Participant {
    id: string;
    name: string;
    isPC: boolean;
    initiative?: number | null; // Can be number | undefined OR number | null
    stats?: { 
        [key: string]: any;
        woundThreshold?: number; 
        soak?: number;
        meleeDefense?: number;
        rangedDefense?: number;
        wounds?: number;
        type?: string;
        talents?: string[];
        minions?: number;
    };
}

// Zustand Store
interface ParticipantStore {
    participants: Participant[];
    addParticipant: (participant: Participant) => void;
    removeParticipant: (id: string) => void;
    updateParticipants: (updatedParticipants: Participant[]) => void;

    // Wound and strain
    addWounds: (id: string, wounds: number) => void;
    removeWounds: (id: string, wounds: number) => void;
}

const useParticipantStore = create<ParticipantStore>((set) => ({
    participants: [],
    addParticipant: (participant) => {
        // Make sure stats object exists
        if (!participant.stats) {
            participant.stats = {};
        }

        // Ensure required stat fields have sensible defaults
        if (participant.stats.woundThreshold === undefined) {
            participant.stats.woundThreshold = participant.isPC ? 12 : 8;
        }

        if (participant.stats.soak === undefined) {
            participant.stats.soak = participant.isPC ? 3 : 2;
        }

        if (participant.stats.wounds === undefined) {
            participant.stats.wounds = 0;
        }

        if (participant.stats.type === undefined) {
            participant.stats.type = participant.isPC ? "PC" : "Rival";
        }

        if (!participant.id) {
            participant.id = nanoid();
        }

        set((state) => ({ participants: [...state.participants, participant] }));

        // Emit the event when a participant is added
        EventBus.emit("participant-added", participant);
    },
    removeParticipant: (id) =>
        set((state) => ({
            participants: state.participants.filter((p) => p.id !== id),
        })),
    updateParticipants: (updatedParticipants) =>
        set(() => ({ participants: updatedParticipants })),
    
    addWounds: (id, wounds) => {
        set((state) => ({
            participants: state.participants.map(participant => {
                if (participant.id === id) {
                    return {
                        ...participant,
                        stats: {
                            ...participant.stats,
                            wounds: (participant.stats?.wounds || 0) + wounds
                        }
                    };
                }
                return participant;
            })
        }));
    },
    
    removeWounds: (id, wounds) => {
        set((state) => ({
            participants: state.participants.map(participant => {
                if (participant.id === id) {
                    return {
                        ...participant,
                        stats: {
                            ...participant.stats,
                            wounds: Math.max(0, (participant.stats?.wounds || 0) - wounds)
                        }
                    };
                }
                return participant;
            })
        }));
    }
}));

export default useParticipantStore;