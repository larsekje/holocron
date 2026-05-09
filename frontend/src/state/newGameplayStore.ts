import { create } from "zustand";
import {createEncounterFSM, EncounterContext, TurnState} from "./FSM";
import {InitiativeSlot} from "@/types/initiativeSlot";
import EventBus from "@/utils/events";
import useParticipantsStore from './participantsStore'; // Import the participants store

const encounterFSM = createEncounterFSM();

export interface GameplayStore {
    state: string; // FSM State
    context: EncounterContext; // FSM Context
    transition: (event: string) => void; // Trigger FSM events
    canTransition: (event: string) => boolean; // Check transition guard

    // Turn state
    getCurrentTurnState: () => TurnState;
    getTurnStateDescription: () => string;
    isInTurnState: (turnState: TurnState) => boolean;

    // Initiative
    setInitiativeOrder: (order: InitiativeSlot[]) => void; // Set initiative
    isInitiativeModalOpen: boolean;
    setInitiativeModalOpen: (open: boolean) => void;

    // Manage participants
    setActiveParticipantId: (participantId: string | null) => void; // Set the active participant's ID
    addActedParticipant: (participantId: string) => void;
    removeActedParticipant: (participantId: string) => void;
    toggleActedParticipant: (participantId: string) => void;
    clearActedParticipants: () => void;

    // Shortcuts
    enterStructured: () => void;
    exitStructured: () => void;
    isTurnBased: () => boolean;
    toggleMode: () => void;

    // Manual turn progression methods
    advanceToActivePhase: () => void;
    completeActiveTurn: () => void;
    advanceTurn: () => void;
}


const useGameplayStore = create<GameplayStore>((set, get) => {

    // Listen to the "participant-added" event
    EventBus.on("participant-added", (participant) => {
        console.log("participant-added", participant);
        const initiativeSlots = encounterFSM.context.initiativeOrder;
        const newSlot: InitiativeSlot = {team: participant.isPC ? "PC" : "NPC", initiative: 0, used: false, name: participant.name}
        encounterFSM.context.initiativeOrder = [...initiativeSlots, newSlot]
        set({
            context: {...encounterFSM.context},
        })
    });

    // Ensure the FSM always has the latest participants
    useParticipantsStore.subscribe((state) => {
        encounterFSM.context.participants = state.participants;
    });

    return {
        state: encounterFSM.state,
        context: encounterFSM.context,
        isInitiativeModalOpen: false,

        // Trigger FSM events
        transition: (event) => {
            encounterFSM.transition(event as any);
            
            // We're no longer auto-progressing through turn phases
            // Let the user control the flow instead
            
            set({
                state: encounterFSM.state,
                context: {...encounterFSM.context},
            });
        },

        // Check guards
        canTransition: (event) => encounterFSM.canTransition(event),

        // Turn state methods
        getCurrentTurnState: () => encounterFSM.context.turnState,
        getTurnStateDescription: () => {
            switch(encounterFSM.context.turnState) {
                case 'turn_start':
                    return 'Turn start';
                case 'turn_active':
                    return 'Turn active';
                case 'turn_end':
                    return 'Turn end';
                default:
                    return 'Unknown';
            }
        },
        isInTurnState: (turnState) => encounterFSM.context.turnState === turnState,

        // Set initiative
        setInitiativeOrder: (order) => {
            encounterFSM.context.initiativeOrder = order;
            encounterFSM.transition("ROLL_INITIATIVE");
            set({
                context: {...encounterFSM.context},
            });
        },

        setInitiativeModalOpen: (open) => {
            set({isInitiativeModalOpen: open})
        },

        setActiveParticipantId: (participantId: string | null) => {
            encounterFSM.context.activeParticipantId = participantId;
            
            // If we're in turn_start state and a participant is selected, advance to active phase
            if (encounterFSM.context.turnState === 'turn_start' && participantId !== null) {
                setTimeout(() => {
                    encounterFSM.transition('PROCESS_TURN_START');
                    set({
                        state: encounterFSM.state,
                        context: {...encounterFSM.context},
                    });
                }, 100);
            }
            
            set({
                context: {...encounterFSM.context},
            });
        },

        addActedParticipant: (id: string) => {
            const actedParticipants = encounterFSM.context.actedParticipants;
            if (!actedParticipants.includes(id)) {
                encounterFSM.context.actedParticipants = [...actedParticipants, id];
                set({context: {...encounterFSM.context}});
            }
        },

        removeActedParticipant: (id: string) => {
            encounterFSM.context.actedParticipants =
                encounterFSM.context.actedParticipants.filter((x) => x !== id);
            set({context: {...encounterFSM.context}});
        },

        toggleActedParticipant: (id: string) => {
            const acted = encounterFSM.context.actedParticipants;
            encounterFSM.context.actedParticipants = acted.includes(id)
                ? acted.filter((x) => x !== id)
                : [...acted, id];
            set({context: {...encounterFSM.context}});
        },

        clearActedParticipants: () => {
            encounterFSM.context.actedParticipants = []

            set({
                context: {...encounterFSM.context},
            })
        },

        enterStructured: () => encounterFSM.transition("ENTER_STRUCTURED"),
        exitStructured: () => encounterFSM.transition("EXIT_STRUCTURED"),
        isTurnBased: () => encounterFSM.context.mode === "structured",
        toggleMode: () => {
            const {context, transition} = get(); // Access current mode and transition function from the store

            // Use the FSM transition to toggle between structured and non-structured modes
            if (context.mode === 'structured') {
                transition("EXIT_STRUCTURED"); // Trigger event for exiting structured mode
            } else {
                transition("ENTER_STRUCTURED"); // Trigger event for entering structured mode
            }
        },

        // Manual turn progression methods
        advanceToActivePhase: () => {
            if (encounterFSM.context.turnState === 'turn_start') {
                console.log("Manually advancing to active turn phase...");
                encounterFSM.transition('PROCESS_TURN_START');
                set({
                    state: encounterFSM.state,
                    context: {...encounterFSM.context},
                });
            }
        },

        completeActiveTurn: () => {
            if (encounterFSM.context.turnState === 'turn_active') {
                console.log("Manually completing active turn phase...");
                encounterFSM.transition('PROCESS_TURN');
                set({
                    state: encounterFSM.state,
                    context: {...encounterFSM.context},
                });
            }
        },

        advanceTurn: () => {
            console.log("Advancing turn...");
            encounterFSM.transition('NEXT_TURN');
            set({
                state: encounterFSM.state,
                context: {...encounterFSM.context},
            });
        },
    }
});

export default useGameplayStore;