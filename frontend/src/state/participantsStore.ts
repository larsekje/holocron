import { create } from "zustand";
import { persist } from "zustand/middleware";
import { holocronPersist } from "./persist";
import EventBus from "@/utils/events";
import { nanoid } from "nanoid";

// DicePouch interface for handling dice modifications. Holds both narrative
// dice (boost/setback/force) and skill-side dice (ability/proficiency/
// difficulty/challenge) so an entire prepared pool can be passed to another
// participant via the Pass-to flow. Symbol counts (success/failure/etc.) are
// folded into the next roll as bonus symbols.
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
    ability?: number;
    proficiency?: number;
    difficulty?: number;
    challenge?: number;
    /** Pending upgrades for the owner's next roll: `upgrade` turns an
     * Ability die into Proficiency, `upgradeDifficulty` turns a Difficulty
     * die into Challenge. Banked like any other pouch token and applied
     * from the dice roller's pouch strip. */
    upgrade?: number;
    upgradeDifficulty?: number;
}

import { CritInjury } from "@/data/critTable";

/**
 * A participant counts as "dead" (or fully incapacitated) for initiative-skip
 * purposes when:
 *   - their wounds reach or exceed their wound threshold (PC/Rival/Nemesis), or
 *   - all minions in a minion group have been defeated (group wounds ≥ wt × initial).
 *
 * Dead participants don't get a turn — the FSM auto-advances past their slot.
 */
export function isParticipantDead(p: Participant): boolean {
    const stats = p.stats ?? {};
    const wt = stats.woundThreshold ?? (p.isPC ? 12 : 8);
    const wounds = stats.wounds ?? 0;
    if (stats.minions !== undefined) {
        const alive = Math.max(stats.minions - Math.floor(wounds / Math.max(wt, 1)), 0);
        return alive === 0;
    }
    return wounds >= wt;
}

export type VehicleRole = 'pilot' | 'gunner' | 'astromech' | 'passenger';

export type Team = 'PC' | 'NPC';

/** Which side of the table a participant fights on. Defaults from `isPC`;
 * a companion NPC (the crew's hired muscle, a droid) is `side: 'PC'` — it
 * keeps NPC stats and rules but takes PC initiative slots and counts with
 * the party. */
export function teamOf(p: Pick<Participant, 'isPC' | 'side'>): Team {
    return p.side ?? (p.isPC ? 'PC' : 'NPC');
}

export interface Participant {
    id: string;
    name: string;
    // The name the participant had before the GM first renamed it. Set once,
    // on the first rename, and kept thereafter so the original stays
    // visible as a subtle subtitle. Undefined = never renamed.
    originalName?: string;
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
    /** Per-token provenance — parallel to dicePouch counts. Each entry's
     * array length matches the count for that kind. Lets the receiver's
     * pouch UI explain "1 Setback (from Aqualish Thug — …)". */
    dicePouchSources?: Partial<Record<keyof DicePouch, string[]>>;
    criticalInjuries?: CritInjury[];
    /** When set, the participant is currently aboard the active vehicle with
     * this id. Damage incoming routes to the vehicle's hull/system rather
     * than the participant's wounds; weapons in the dice roller surface from
     * the vehicle. Hat-on-hat-off model — see activeVehicleStore. */
    equippedVehicleId?: string;
    /** Free-form display label; not enforced. Used by stat sheet headers. */
    vehicleRole?: VehicleRole;
    /** Side override — see teamOf. Only set for companions. */
    side?: Team;
}

// Zustand Store
interface ParticipantStore {
    participants: Participant[];
    selectedParticipantId: string | null;
    selectParticipant: (id: string | null) => void;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (id: string) => void;
    updateParticipants: (updatedParticipants: Participant[]) => void;

    // Critical injuries
    addCriticalInjury: (id: string, injury: CritInjury) => void;
    removeCriticalInjury: (id: string, injuryId: string) => void;

    // Wound and strain
    addWounds: (id: string, wounds: number) => void;
    removeWounds: (id: string, wounds: number) => void;
    addStrain: (id: string, strain: number) => void;
    removeStrain: (id: string, strain: number) => void;

    /** Move a participant to a side (companion NPC ⇄ adversary). */
    setSide: (id: string, side: Team) => void;

    // Direct setters used by the stat-edit popovers.
    setMinionCount: (id: string, count: number) => void;
    // Generic stat setter for thresholds, soak, defense, characteristics, etc.
    setStat: (id: string, key: string, value: number) => void;

    // Dice pouch management
    addDice: (id: string, diceType: keyof DicePouch, amount: number, source?: string) => void;
    removeDice: (id: string, diceType: keyof DicePouch, amount: number) => void;
    clearDicePouch: (id: string) => void;
}

const useParticipantStore = create<ParticipantStore>()(persist((set) => ({
    participants: [],
    selectedParticipantId: null,
    selectParticipant: (id) => set({selectedParticipantId: id}),
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
            selectedParticipantId:
                state.selectedParticipantId === id ? null : state.selectedParticipantId,
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

    addStrain: (id, strain) => {
        set((state) => ({
            participants: state.participants.map(participant => {
                if (participant.id !== id) return participant;
                const cur = (participant.stats as any)?.strain ?? 0;
                return {
                    ...participant,
                    stats: {...participant.stats, strain: cur + strain}
                };
            })
        }));
    },

    removeStrain: (id, strain) => {
        set((state) => ({
            participants: state.participants.map(participant => {
                if (participant.id !== id) return participant;
                const cur = (participant.stats as any)?.strain ?? 0;
                return {
                    ...participant,
                    stats: {...participant.stats, strain: Math.max(0, cur - strain)}
                };
            })
        }));
    },

    setSide: (id, side) => {
        set((state) => ({
            participants: state.participants.map((p) => {
                if (p.id !== id) return p;
                const natural: Team = p.isPC ? 'PC' : 'NPC';
                const next: Participant = {...p, side};
                if (side === natural) delete next.side;
                return next;
            }),
        }));
    },

    setMinionCount: (id, count) => {
        const safe = Math.max(0, Math.floor(count));
        set((state) => ({
            participants: state.participants.map(p =>
                p.id === id ? {...p, stats: {...p.stats, minions: safe}} : p
            )
        }));
    },

    setStat: (id, key, value) => {
        const safe = Math.max(0, Math.floor(value));
        set((state) => ({
            participants: state.participants.map(p =>
                p.id === id ? {...p, stats: {...p.stats, [key]: safe}} : p
            )
        }));
    },

    // Dice Pouch Management
    addDice: (id, diceType, amount, source) => {
        set((state) => ({
            participants: state.participants.map(participant => {
                if (participant.id === id) {
                    const currentDicePouch = participant.dicePouch || {
                        boost: 0, setback: 0, advantage: 0, threat: 0,
                        success: 0, failure: 0, triumph: 0, despair: 0, force: 0
                    };
                    const currentSources = participant.dicePouchSources ?? {};
                    const existing = currentSources[diceType] ?? [];
                    const sourceLabel = source ?? 'Unknown';
                    return {
                        ...participant,
                        dicePouch: {
                            ...currentDicePouch,
                            [diceType]: (currentDicePouch[diceType] || 0) + amount
                        },
                        dicePouchSources: {
                            ...currentSources,
                            [diceType]: [...existing, ...Array(amount).fill(sourceLabel)],
                        },
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
                    const sources = participant.dicePouchSources ?? {};
                    const existing = sources[diceType] ?? [];
                    const trimmed = existing.slice(0, Math.max(0, existing.length - amount));
                    const nextSources = { ...sources };
                    if (trimmed.length === 0) delete nextSources[diceType];
                    else nextSources[diceType] = trimmed;
                    return {
                        ...participant,
                        dicePouch: {
                            ...participant.dicePouch,
                            [diceType]: Math.max(0, (participant.dicePouch[diceType] || 0) - amount)
                        },
                        dicePouchSources: nextSources,
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
}), holocronPersist({
    name: 'participants',
    partialize: (s) => ({
        participants: s.participants,
        selectedParticipantId: s.selectedParticipantId,
    }),
})));

export default useParticipantStore;