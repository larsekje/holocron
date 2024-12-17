import {InitiativeSlot} from "@/types/initiativeSlot";
import useParticipantStore, {Participant} from "@/state/participantsStore";
import {context} from "esbuild";

type State = 'preparation' | 'inProgress' | 'completed' | 'idle';
type FSMEvent = 'START_ENCOUNTER' | 'NEXT_TURN' | 'PREV_TURN' | 'END_ENCOUNTER' | 'RESET' | 'ENTER_STRUCTURED' | 'EXIT_STRUCTURED' | 'ROLL_INITIATIVE';

// Extend the EncounterContext to include `mode`
export interface EncounterContext {
    mode: 'non-structured' | 'structured';
    round: number;
    currentTurnIndex: number;
    initiativeOrder: InitiativeSlot[];
    isInitiativeRolled: boolean;
    activeParticipantId: string | null;
    actedParticipants: string[];
}

// Define the structure of a transition: event -> state
interface Transition {
    target: State;
    action?: (context: EncounterContext) => void; // Optional action to take during the transition
    guard?: (context: EncounterContext) => boolean;
}

// FSM configuration schema with states, events, transitions, and actions
interface StateConfig {
    on: Partial<Record<FSMEvent, Transition>>; // Events are now optional
}

// The FSM implementation
export class FSM {
    public state: State;
    public context: EncounterContext;
    private states: { [state in State]: StateConfig };

    constructor(initialState: State, initialContext: EncounterContext, states: { [state in State]: StateConfig }) {
        this.state = initialState;
        this.context = initialContext;
        this.states = states;
    }

    transition(event: FSMEvent) {
        const stateConfig = this.states[this.state];
        const transition = stateConfig.on?.[event];

        if (!transition) {
            console.error(`No transition for event "${event}" in state "${this.state}"`);
            return;
        }

        // Check guard (if defined)
        if (transition.guard && !transition.guard(this.context)) {
            console.error(`Guard blocked transition for event "${event}" in state "${this.state}"`);
            return;
        }

        // Perform action during the transition (if any)
        if (transition.action) {
            transition.action(this.context);
        }

        // Apply the state transition
        this.state = transition.target;
        console.log(`Transitioned to state: ${this.state}`);
    }

    // New canTransition method
    public canTransition(event: string): boolean {
        const stateConfig = this.states[this.state];
        const eventConfig = stateConfig?.on?.[event as keyof typeof stateConfig['on']];

        if (!eventConfig) {
            return false; // Event not defined in the current state
        }

        const { guard } = eventConfig;

        console.log(guard)
        const foo = guard ? guard(this.context) : true;
        console.log(foo);
        console.log(this.context);


        // Check guard condition (if any)
        return guard ? guard(this.context) : true;
    }
}

export function createEncounterFSM(): FSM {
    const canStartEncounter = (context: EncounterContext): boolean =>
        context.isInitiativeRolled && useParticipantStore.getState().participants.length > 0 && context.mode === 'structured';

    const canDecreaseTurn = (context: EncounterContext): boolean =>
         !(context.currentTurnIndex === 0 && context.round === 1);

    const getActiveParticipant = (context: EncounterContext): Participant | undefined => {
        const participants = useParticipantStore.getState().participants;
        const activeParticipantId = context.activeParticipantId;
        return participants.find((participant) => participant.id === activeParticipantId);
    };

    const canAdvanceTurn = (context: EncounterContext): boolean => {
        const activeParticipant = getActiveParticipant(context);

        if (activeParticipant === undefined)
        {
            console.log('Active participant is undefined');
            return false;
        }


        const currentInitiativeSlot = context.initiativeOrder[context.currentTurnIndex];

        if (currentInitiativeSlot === undefined){
            console.log('Current initiative slot is undefined');
            return false;
        }

        if (context.actedParticipants.includes(activeParticipant.id)) {
            console.log('Participant has already acted');
            return false;
        }

        return isSlotValidForParticipant(currentInitiativeSlot, activeParticipant);
    }

    const processTurn = (context: EncounterContext): void => {
        const activeParticipant = getActiveParticipant(context);

        if (activeParticipant && !context.actedParticipants.includes(activeParticipant.id)){
            context.actedParticipants.push(activeParticipant.id);
        }
    }

    const isEndOfRound = (context: EncounterContext): boolean => {
        return context.currentTurnIndex + 1 >= useParticipantStore.getState().participants.length;
    };

    const startNewRound = (context: EncounterContext): void => {
        context.round++;
        context.currentTurnIndex = 0;
        context.actedParticipants = []; // Clear acted participants for the new round
        context.activeParticipantId = null;
    };

    const advanceTurnIndex = (context: EncounterContext): void => {
        context.currentTurnIndex++;
    };

    const isSlotValidForParticipant = (currentInitiativeSlot: InitiativeSlot, activeParticipant: Participant): boolean =>
    {
        const isPcOnPcTurn = currentInitiativeSlot.team === "PC" && activeParticipant.isPC;
        const isNpcOnNpcTurn = currentInitiativeSlot.team === "NPC" && !activeParticipant.isPC;

        console.log(isPcOnPcTurn, isNpcOnNpcTurn);
        return isPcOnPcTurn || isNpcOnNpcTurn;
    }

    return new FSM(
        'idle',
        {
            mode: 'non-structured',
            round: 1,
            currentTurnIndex: 0,
            initiativeOrder: [],
            isInitiativeRolled: false,
            activeParticipantId: null,
            actedParticipants: []
        },
        {
            idle: {
                on: {
                    ENTER_STRUCTURED: {
                        target: 'preparation',
                        action: (context: EncounterContext) => {
                            context.mode = 'structured';
                            console.log('Entering structured mode');
                        },
                    },
                },
            },
            preparation: {
                on: {
                    ROLL_INITIATIVE: {
                        target: 'preparation',
                        action: (context: EncounterContext) => {
                            context.isInitiativeRolled = true;
                            console.log('Initiative rolled!');
                        },
                    },
                    START_ENCOUNTER: {
                        target: 'inProgress',
                        guard: canStartEncounter,
                        action: (context: EncounterContext) => console.log('Encounter started!'),
                    },
                    EXIT_STRUCTURED: {
                        target: 'idle',
                        action: (context) => {
                            context.mode = 'non-structured';
                            console.log('Exiting structured mode');
                        },
                    },
                },
            },
            inProgress: {
                on: {
                    NEXT_TURN: {
                        target: 'inProgress',
                        guard: canAdvanceTurn,
                        action: (context) => {
                            processTurn(context);

                            if (isEndOfRound(context)){
                                startNewRound(context);
                            } else {
                                advanceTurnIndex(context);
                            }

                            console.log('Turn advanced!', context.actedParticipants);
                        },
                    },
                    PREV_TURN: {
                        target: 'inProgress',
                        guard: canDecreaseTurn,
                        action: (context) => {
                            if (context.currentTurnIndex  === 0) {
                                context.round--;
                                context.currentTurnIndex = useParticipantStore.getState().participants.length - 1;
                            } else {
                                context.currentTurnIndex--;
                            }
                        },
                    },
                    END_ENCOUNTER: {
                        target: 'completed',
                        action: () => console.log('Encounter ended!'),
                    },
                },
            },
            completed: {
                on: {
                    RESET: {
                        target: 'preparation',
                        action: (context) => {
                            context.round = 1;
                            context.isInitiativeRolled = false;
                        },
                    },
                    EXIT_STRUCTURED: {
                        target: 'idle',
                        action: (context) => {
                            context.mode = 'non-structured';
                        },
                    }
                },
            },
        }
    );
}