import { create } from "zustand";
import {createEncounterFSM, EncounterContext} from "./FSM";
import {InitiativeSlot} from "@/types/initiativeSlot";
import EventBus from "@/utils/events";

const encounterFSM = createEncounterFSM();

export interface GameplayStore {
    state: string; // FSM State
    context: EncounterContext; // FSM Context
    transition: (event: string) => void; // Trigger FSM events
    canTransition: (event: string) => boolean; // Check transition guard

    // Initiative
    setInitiativeOrder: (order: InitiativeSlot[]) => void; // Set initiative
    isInitiativeModalOpen: boolean;
    setInitiativeModalOpen: (open: boolean) => void;

    // Manage participants
    setActiveParticipantId: (participantId: string | null) => void; // Set the active participant's ID
    addActedParticipant: (participantId: string) => void;
    clearActedParticipants: () => void;

    // Shortcuts
    enterStructured: () => void;
    exitStructured: () => void;
    isTurnBased: () => boolean;
    toggleMode: () => void;
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

    return {
        state: encounterFSM.state,
        context: encounterFSM.context,
        isInitiativeModalOpen: false,

        // Trigger FSM events
        transition: (event) => {
            encounterFSM.transition(event as any);
            set({
                state: encounterFSM.state,
                context: {...encounterFSM.context},
            });
        },

        // Check guards
        canTransition: (event) => encounterFSM.canTransition(event),

        // Set initiative
        setInitiativeOrder: (order) => {
            encounterFSM.context.initiativeOrder = order;
            encounterFSM.transition("ROLL_INITIATIVE");
            set({
                context: {...encounterFSM.context},
            });
        },

        setInitiativeModalOpen: (open) => {
            console.log("setInitiativeModalOpen", open);
            set({isInitiativeModalOpen: open})
        },

        setActiveParticipantId: (participantId) => {
            encounterFSM.context.activeParticipantId = participantId;
            set({
                context: {...encounterFSM.context},
            })
        },

        addActedParticipant: (id: string) => {
            const actedParticipants = encounterFSM.context.actedParticipants;
            encounterFSM.context.actedParticipants = [...actedParticipants, id];

            set({
                context: {...encounterFSM.context},
            })
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
        }
    }
});

export default useGameplayStore;