type State = 'preparation' | 'inProgress' | 'completed' | 'idle'; // Add 'idle' here
type FSMEvent = 'START_ENCOUNTER' | 'NEXT_TURN' | 'END_ENCOUNTER' | 'RESET' | 'ENTER_STRUCTURED' | 'EXIT_STRUCTURED' | 'ROLL_INITIATIVE';

// Extend the EncounterContext to include `mode`
export interface EncounterContext {
    mode: 'idle' | 'structured';
    round: number;
    activeTurnIndex: number;
    participantCount: number;
    isInitiativeRolled: boolean;
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

        // Check guard condition (if any)
        return guard ? guard(this.context) : true;
    }
}

export function createEncounterFSM(): FSM {
    const canStartEncounter = (context: EncounterContext): boolean =>
        context.isInitiativeRolled && context.participantCount > 0 && context.mode === 'structured';

    return new FSM(
        'preparation',
        {
            mode: 'structured',
            round: 1,
            activeTurnIndex: 0,
            participantCount: 3,
            isInitiativeRolled: false,
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
                            context.mode = 'idle';
                            console.log('Exiting structured mode');
                        },
                    },
                },
            },
            inProgress: {
                on: {
                    NEXT_TURN: {
                        target: 'inProgress',
                        action: (context) => {
                            if (context.activeTurnIndex + 1 >= context.participantCount) {
                                context.round++;
                                context.activeTurnIndex = 0;
                            } else {
                                context.activeTurnIndex++;
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
                },
            },
        }
    );
}