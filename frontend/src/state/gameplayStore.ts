import create from "zustand";
import EventBus from "@/utils/events";
import {InitiativeSlot} from "@/types/initiativeSlot";

type GameplayType = 'non-structured' | 'structured' | 'skill-challenge';

interface GameplayStore {
    mode: GameplayType; // Determines the active gameplay type
    turnBased: boolean; // Is turn-based logic active?
    skillChallengeActive: boolean; // Is a skill challenge ongoing?
    activeParticipantId: string | null; // Tracks the active participant's ID
    initiativeOrder: InitiativeSlot[]; // Slots provided by the game engine
    currentTurnIndex: number | null; // Tracks which turn is active (index in the initiative order)
    round: number;

    // Actions for controlling game modes
    setMode: (newMode: GameplayType) => void; // Set active mode
    toggleTurnBased: () => void; // Toggle turn-based mode on/off

    // Skill Challenge Controls
    startSkillChallenge: () => void; // Activate a skill challenge
    endSkillChallenge: () => void; // End the active skill challenge
    setActiveParticipantId: (participantId: string | null) => void; // Set the active participant's ID

    // Initiative Management
    setInitiativeOrder: (order: InitiativeSlot[]) => void; // Set full initiative order (from engine)
    clearInitiative: () => void; // Clear initiative data
    addSlotAtEnd: (participantId: string, team: 'PC' | 'NPC', name?: string) => void;

    // Turn management
    nextTurn: () => void; // Advance to the next turn
    prevTurn: () => void;
    resetTurnOrder: () => void; // Reset the turn order to the start
    setCurrentTurnIndex: (value: number) => void;

    // Round management
    nextRound: () => void;
    prevRound: () => void;
    resetRound: () => void;

    // Track acted participants
    actedParticipants: string[];
    addActedParticipant: (participantId: string) => void;
    clearActedParticipants: () => void;
}

const useGameplayStore = create<GameplayStore>((set, get) => {
    // Listen to the "participantAdded" event
    EventBus.on("participant-added", (participant) => {
        const { addSlotAtEnd } = get();
        addSlotAtEnd(participant.id, participant.isPC ? "PC" : "NPC", participant.name);
    });

    return {
        // Default state
        mode: 'structured',
        turnBased: true,
        skillChallengeActive: false,
        initiativeOrder: [], // Default empty initiative
        currentTurnIndex: null,
        round: 1,
        activeParticipantId: null, // No active participant by default
        actedParticipants: [],


        // Set gameplay mode
        setMode: (newMode) => set(() => ({ mode: newMode })),

        // Toggle turn-based logic
        toggleTurnBased: () => {
            const { turnBased } = get();
            set({
                turnBased: !turnBased,
                mode: !turnBased ? "structured" : "non-structured", // Sync 'turnBased' with 'mode'
                initiativeOrder: !turnBased ? get().initiativeOrder : [], // Clear initiative if switching off
                currentTurnIndex: !turnBased ? 0 : null, // Reset turn tracking
            });
        },

        // Start a skill challenge
        startSkillChallenge: () =>
            set(() => ({
                mode: 'skill-challenge',
                skillChallengeActive: true,
            })),

        // End a skill challenge
        endSkillChallenge: () =>
            set(() => ({
                mode: 'non-structured', // Fall back to freeform
                skillChallengeActive: false,
            })),

        // Set the initiative order (provided by the game engine)
        setInitiativeOrder: (order) =>
            set({ initiativeOrder: order, currentTurnIndex: 0 }),

        // Clear initiative
        clearInitiative: () => set({ initiativeOrder: [], currentTurnIndex: null }),

        // Add a new initiative slot at the end of the initiative queue
        addSlotAtEnd: (participantId, team, name) => {
            set((state) => ({
                initiativeOrder: [
                    ...state.initiativeOrder,
                    {
                        team,
                        initiative: 0, // Default low initiative value for the slot
                        used: false,
                        name,
                    },
                ],
            }));
        },
        setActiveParticipantId: (participantId) => set(() => ({ activeParticipantId: participantId })),

        // Go to the next turn in the initiative
        nextTurn: () => {
            const { currentTurnIndex, initiativeOrder, round } = get();
            const { addActedParticipant, activeParticipantId, clearActedParticipants } = get();

            if (currentTurnIndex === null || initiativeOrder.length === 0) return;

            const nextIndex = (currentTurnIndex + 1) % initiativeOrder.length;

            if (activeParticipantId !== null)
                addActedParticipant(activeParticipantId);

            // If we've looped back to the start of the initiative order, increment the round
            if (nextIndex === 0) {
                set({
                    currentTurnIndex: nextIndex,
                    round: round + 1,
                });
                clearActedParticipants();
            } else {
                set({ currentTurnIndex: nextIndex });
            }
        },

        prevTurn: () => {
            const { currentTurnIndex, initiativeOrder, round } = get();
            if (currentTurnIndex === null || initiativeOrder.length === 0) return;

            const prevIndex = (currentTurnIndex - 1 + initiativeOrder.length) % initiativeOrder.length;

            // If we've looped back to the end of the initiative order, decrement the round
            if (prevIndex === initiativeOrder.length - 1) {
                set({
                    currentTurnIndex: prevIndex,
                    round: round > 1 ? round - 1 : 1, // Decrease the round only if it's above minimum
                });
            } else {
                set({ currentTurnIndex: prevIndex });
            }        },

        // Reset the initiative order to the start
        resetTurnOrder: () => {
            const { initiativeOrder } = get();

            if (initiativeOrder.length === 0) return;

            set({ currentTurnIndex: 0 });
        },

        setCurrentTurnIndex: (value: number) => set({ currentTurnIndex: value }),


        addActedParticipant: (id: string) =>
            set((state) => ({
                actedParticipants: [...state.actedParticipants, id],
            })),
        clearActedParticipants: () =>
            set(() => ({
                actedParticipants: [],
            })),

        nextRound: () =>
            set((state) => {
                const shouldReset =
                    state.currentTurnIndex === 0 && state.round >= 1;

                return shouldReset
                    ? {
                        round: state.round + 1,
                        currentTurnIndex: 0,
                        actedParticipants: [],
                    }
                    : {
                        round: state.round + 1,
                    };
            }),
        prevRound: () =>
            set((state) => ({
                round: state.round > 1 ? state.round - 1 : 1,
            })),
        resetRound: () => set(() => ({ round: 1 })),
    };

});

export default useGameplayStore;