import { create } from "zustand";
import EventBus from "@/utils/events";
import { nanoid } from "nanoid";

// DicePouch interface for handling dice modifications
export interface DicePouch {
    boost: number;
    setback: number;
    advantage: number;
    threat: number;
    success: number;
    failure: number;
    triumph: number;
    despair: number;
    force: number;
}

import { CritInjury } from "@/data/critTable";

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
        adversaryId?: string; // ID reference to the adversary data source
    };
    dicePouch?: DicePouch; // Dice modifications
    criticalInjuries?: CritInjury[];
}

// Zustand Store
interface ParticipantStore {
    participants: Participant[];
    addParticipant: (participant: Participant) => void;
    removeParticipant: (id: string) => void;
    updateParticipants: (updatedParticipants: Participant[]) => void;

    // Critical injuries
    addCriticalInjury: (id: string, injury: CritInjury) => void;
    removeCriticalInjury: (id: string, injuryId: string) => void;

    // Wound and strain
    addWounds: (id: string, wounds: number) => void;
    removeWounds: (id: string, wounds: number) => void;

    // Dice pouch management
    addDice: (id: string, diceType: keyof DicePouch, amount: number) => void;
    removeDice: (id: string, diceType: keyof DicePouch, amount: number) => void;
    clearDicePouch: (id: string) => void;
}

const useParticipantStore = create<ParticipantStore>((set) => ({
    participants: [],
    addParticipant: (participant) => {
        // Make sure stats object exists
        if (!participant.stats) {
            participant.stats = {};
        }
        // Initialize critical injuries array
        if (!participant.criticalInjuries) {
            participant.criticalInjuries = [];
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

        // Initialize empty dice pouch if not present
        if (!participant.dicePouch) {
            participant.dicePouch = {
                boost: 0,
                setback: 0,
                advantage: 0,
                threat: 0,
                success: 0,
                failure: 0,
                triumph: 0,
                despair: 0,
                force: 0
            };
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
    },
    
    // Dice Pouch Management
    addDice: (id, diceType, amount) => {
        set((state) => ({
            participants: state.participants.map(participant => {
                if (participant.id === id) {
                    // Create dice pouch if it doesn't exist
                    const currentDicePouch = participant.dicePouch || {
                        boost: 0, setback: 0, advantage: 0, threat: 0,
                        success: 0, failure: 0, triumph: 0, despair: 0, force: 0
                    };
                    
                    return {
                        ...participant,
                        dicePouch: {
                            ...currentDicePouch,
                            [diceType]: (currentDicePouch[diceType] || 0) + amount
                        }
                    };
                }
                return participant;
            })
        }));
    },
    
    removeDice: (id, diceType, amount) => {
        set((state) => ({
            participants: state.participants.map(participant => {
                if (participant.id === id && participant.dicePouch) {
                    return {
                        ...participant,
                        dicePouch: {
                            ...participant.dicePouch,
                            [diceType]: Math.max(0, (participant.dicePouch[diceType] || 0) - amount)
                        }
                    };
                }
                return participant;
            })
        }));
    },
    
    clearDicePouch: (id) => {
        set((state) => ({
            participants: state.participants.map(participant => {
                if (participant.id === id) {
                    return {
                        ...participant,
                        dicePouch: {
                            boost: 0, setback: 0, advantage: 0, threat: 0,
                            success: 0, failure: 0, triumph: 0, despair: 0, force: 0
                        }
                    };
                }
                return participant;
            })
        }));
    },

    addCriticalInjury: (id, injury) => {
        set((state) => ({
            participants: state.participants.map(p =>
                p.id === id
                    ? { ...p, criticalInjuries: [...(p.criticalInjuries || []), injury] }
                    : p
            )
        }));
    },

    removeCriticalInjury: (id, injuryId) => {
        set((state) => ({
            participants: state.participants.map(p =>
                p.id === id
                    ? { ...p, criticalInjuries: (p.criticalInjuries || []).filter(ci => ci.id !== injuryId) }
                    : p
            )
        }));
    },
}));

export default useParticipantStore;