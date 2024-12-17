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