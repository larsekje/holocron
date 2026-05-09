import {InitiativeSlot} from "@/types/initiativeSlot";
import useParticipantStore, {Participant, isParticipantDead} from "./participantsStore";
import * as eventSystem from './eventSystem';
import { GameEvent } from './eventSystem';
import {useEffectStore} from "@/state/effectStore";

/**
 * The FSM uses a hierarchical state approach:
 * 
 * MainState: Represents the high-level encounter state (preparation, inProgress, completed, idle)
 * TurnState: Represents the detailed turn flow state for handling effects (turn_start, turn_active, turn_end)
 * 
 * Components that rely on the original state machine behavior can continue to use the MainState,
 * while the more detailed turn flow is tracked using the turnState property in the context.
 */
type MainState = 'preparation' | 'inProgress' | 'completed' | 'idle';
type TurnState = 'turn_start' | 'turn_active' | 'turn_end' | null;
type State = MainState;
type FSMEvent = 'START_ENCOUNTER' | 'NEXT_TURN' | 'PREV_TURN' | 'END_ENCOUNTER' | 'RESET' | 'ENTER_STRUCTURED' | 'EXIT_STRUCTURED' | 'ROLL_INITIATIVE' | 'PROCESS_TURN_START' | 'PROCESS_TURN' | 'START_TURN';

// Event emitter for FSM events
export type FSMEventListener = (event: { type: string; participantId?: string }) => void;
const listeners: FSMEventListener[] = [];

export const addFSMEventListener = (listener: FSMEventListener) => {
    listeners.push(listener);
};

export const removeFSMEventListener = (listener: FSMEventListener) => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
        listeners.splice(index, 1);
    }
};

// Extend the EncounterContext to include `mode` and turnState
export interface EncounterContext {
    mode: 'non-structured' | 'structured';
    round: number;
    currentTurnIndex: number;
    initiativeOrder: InitiativeSlot[];
    isInitiativeRolled: boolean;
    activeParticipantId: string | null;
    actedParticipants: string[];
    turnState: TurnState;
    maxRounds: number;
    participants: Participant[];
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
        console.log(`Transitioned to state: ${this.state}, turn state: ${this.context.turnState}`);
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

    // Get the current turn state
    public getCurrentTurnState(): TurnState {
        return this.context.turnState;
    }

    // Check if we are in a specific turn state
    public isInTurnState(turnState: TurnState): boolean {
        return this.context.turnState === turnState;
    }

    // Get a readable description of the current turn state
    public getTurnStateDescription(): string {
        switch(this.context.turnState) {
            case 'turn_start':
                return 'Start of Turn';
            case 'turn_active':
                return 'Active Turn';
            case 'turn_end':
                return 'End of Turn';
            default:
                return 'No Active Turn';
        }
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
            return false;
        }

        const currentInitiativeSlot = context.initiativeOrder[context.currentTurnIndex];

        if (currentInitiativeSlot === undefined){
            return false;
        }

        if (context.actedParticipants.includes(activeParticipant.id)) {
            return false;
        }

        return isSlotValidForParticipant(currentInitiativeSlot, activeParticipant);
    }

    const processTurnStart = (context: EncounterContext): void => {
        console.log('[FSM] Processing turn start...');
        
        if (context.activeParticipantId) {
            const participant = context.participants.find(p => p.id === context.activeParticipantId);
            if (participant) {
                console.log(`[FSM] Starting turn for participant: ${participant.name} (${context.activeParticipantId})`);
                
                // Emit a turn start event with proper participant ID
                eventSystem.emitGameEvent('TURN_START', context.activeParticipantId);
            }
        }
    };
    
    const processTurnAction = (context: EncounterContext): void => {
        console.log('[FSM] Processing turn action...');
        
        if (context.activeParticipantId) {
            // Emit a turn action event with proper participant ID
            eventSystem.emitGameEvent('TURN_ACTION', context.activeParticipantId);
        }
    };
    
    const processTurnEnd = (context: EncounterContext): void => {
        console.log('[FSM] Processing turn end...');
        
        if (context.activeParticipantId) {
            // Emit a turn end event with proper participant ID
            eventSystem.emitGameEvent('TURN_END', context.activeParticipantId);
            
            // Add the participant to the acted list
            if (!context.actedParticipants.includes(context.activeParticipantId)) {
                context.actedParticipants.push(context.activeParticipantId);
            }
        }
    };

    const isEndOfRound = (context: EncounterContext): boolean => {
        return context.currentTurnIndex + 1 >= useParticipantStore.getState().participants.length;
    };

    const startNewRound = (context: EncounterContext): void => {
        console.log(`[FSM] Ending round ${context.round}`);
        // No need to emit here as it's handled in gameplayStore
        // eventSystem.emitGameEvent('ROUND_END');
        
        console.log(`[FSM] Starting new round ${context.round + 1}`);
        context.round++;
        context.currentTurnIndex = 0;
        context.actedParticipants = []; // Clear acted participants for the new round
        context.activeParticipantId = null;
        context.turnState = null;
        
        // No need to emit here as it's handled in gameplayStore
        // eventSystem.emitGameEvent('ROUND_START');
    };

    const advanceTurnIndex = (context: EncounterContext): EncounterContext => {
        // Clear the active participant ID to allow selecting a new one in the next turn
        console.log("[FSM] Clearing active participant and advancing turn index");

        // Clear acted participants when we've gone through the whole initiative order
        const nextTurnIndex = (context.currentTurnIndex + 1) % context.initiativeOrder.length;
        if (nextTurnIndex === 0) {
            console.log("[FSM] Initiative order completed, starting a new round");

            // The round-just-ending fires ROUND_END; the new round fires
            // ROUND_START. The legacy gameplayStore had its own emits, but
            // newGameplayStore (the active one) doesn't, so the FSM owns it.
            eventSystem.emitGameEvent('ROUND_END', undefined, context.round);

            // Increase round counter
            const newRound = context.round + 1;

            eventSystem.emitGameEvent('ROUND_START', undefined, newRound);

            console.log(`[FSM] Starting round ${newRound}`);

            return {
                ...context,
                currentTurnIndex: nextTurnIndex,
                activeParticipantId: null,
                actedParticipants: [],
                round: newRound
            };
        }

        return {
            ...context,
            currentTurnIndex: nextTurnIndex,
            activeParticipantId: null
        };
    };

    const isSlotValidForParticipant = (currentInitiativeSlot: InitiativeSlot, activeParticipant: Participant): boolean =>
    {
        const isPcOnPcTurn = currentInitiativeSlot.team === "PC" && activeParticipant.isPC;
        const isNpcOnNpcTurn = currentInitiativeSlot.team === "NPC" && !activeParticipant.isPC;
        return isPcOnPcTurn || isNpcOnNpcTurn;
    }

    /**
     * A slot is "fillable" if there's at least one living participant whose
     * team matches the slot AND who hasn't already acted this round. Dead
     * participants are treated as having already acted, so their slot gets
     * skipped — per house rule: "5 slots, 3 dead → 2 act per round".
     */
    const slotHasEligibleParticipant = (
        context: EncounterContext,
        participants: Participant[],
    ): boolean => {
        const slot = context.initiativeOrder[context.currentTurnIndex];
        if (!slot) return false;
        return participants.some(
            (p) =>
                !isParticipantDead(p) &&
                !context.actedParticipants.includes(p.id) &&
                isSlotValidForParticipant(slot, p),
        );
    };

    /**
     * After the turn advances, loop forward past any slot that has no
     * eligible participant. Wraps rounds via advanceTurnIndex (which already
     * clears actedParticipants on wrap). Bounded by 2× initiativeOrder length
     * to defend against pathological cases (e.g. all participants dead).
     */
    const skipUnfillableSlots = (context: EncounterContext): void => {
        const participants = useParticipantStore.getState().participants;
        if (!participants.some((p) => !isParticipantDead(p))) {
            console.log("[FSM] All participants dead; not auto-skipping");
            return;
        }
        const maxIters = (context.initiativeOrder.length || 1) * 2 + 1;
        let iter = 0;
        while (!slotHasEligibleParticipant(context, participants) && iter++ < maxIters) {
            console.log(
                `[FSM] Auto-skipping slot ${context.currentTurnIndex} — no eligible participant`,
            );
            const next = advanceTurnIndex(context);
            context.currentTurnIndex = next.currentTurnIndex;
            if (next.round !== context.round) {
                context.round = next.round;
                context.actedParticipants = [];
            }
        }
    };

    const startEncounter = (context: EncounterContext): EncounterContext => {
        console.log("Encounter started!");
        // Encounter-start before round-start so the session log can open a
        // new section before the first round entry lands inside it.
        eventSystem.emitGameEvent('ENCOUNTER_START');
        eventSystem.emitGameEvent('ROUND_START', undefined, 1);

        // Initialize with turn_start state rather than null
        return {
            ...context,
            currentTurnIndex: 0,
            round: 1,
            turnState: 'turn_start'
        };
    };

    return new FSM(
        'idle',
        {
            mode: 'non-structured',
            round: 1,
            currentTurnIndex: 0,
            initiativeOrder: [],
            isInitiativeRolled: false,
            activeParticipantId: null,
            actedParticipants: [],
            turnState: null,
            maxRounds: 10,
            participants: useParticipantStore.getState().participants
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
                        action: startEncounter,
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
                    START_TURN: {
                        target: 'inProgress',
                        guard: () => true,
                        action: (context) => {
                            console.log('Starting turn sequence...');
                            context.turnState = 'turn_start';
                        },
                    },
                    NEXT_TURN: {
                        target: 'inProgress',
                        guard: canAdvanceTurn,
                        action: (context) => {
                            console.log('[FSM] NEXT_TURN event received');
                            
                            // Handle the event based on current turn state
                            if (context.turnState === 'turn_start') {
                                // If we have an active participant, proceed to turn_active
                                if (context.activeParticipantId) {
                                    console.log('[FSM] Starting active turn phase for participant:', context.activeParticipantId);
                                    
                                    // Process turn start effects
                                    processTurnStart(context);
                                    
                                    // Update state
                                    context.turnState = 'turn_active';
                                } else {
                                    console.log('[FSM] No active participant selected, cannot proceed');
                                }
                            } 
                            else if (context.turnState === 'turn_active') {
                                // Move from active to end phase
                                console.log('[FSM] Completing active turn phase');
                                
                                // Process turn action effects
                                processTurnAction(context);
                                
                                // Update state
                                context.turnState = 'turn_end';
                                
                                // Complete the turn and move to the next one
                                console.log('[FSM] Completing turn and advancing to next initiative slot');
                                
                                // Process any turn end effects
                                processTurnEnd(context);
                                
                                // Save current turn index before advancing
                                const currentTurnIndex = context.currentTurnIndex;
                                
                                // Advance to next turn index (this returns a new context)
                                const updatedContext = advanceTurnIndex(context);
                                
                                // Apply all the changes from the updated context
                                context.currentTurnIndex = updatedContext.currentTurnIndex;
                                context.activeParticipantId = null; // Explicitly clear active participant
                                context.turnState = 'turn_start'; // Explicitly set to turn_start
                                
                                // If we've completed a round, update the round counter and clear acted participants
                                if (updatedContext.round !== context.round) {
                                    context.round = updatedContext.round;
                                    context.actedParticipants = [];
                                }

                                // Auto-skip past any slot whose team has no living, un-acted
                                // participant. Dead participants are treated as already-acted,
                                // so a round with 3 dead and 2 alive yields 2 actual turns.
                                skipUnfillableSlots(context);

                                console.log(`[FSM] Advanced from turn index ${currentTurnIndex} to ${context.currentTurnIndex}`);
                                console.log('[FSM] Turn sequence completed, now in turn_start state for next participant');
                            }
                            else {
                                // Default behavior if turnState is null or undefined
                                console.log('[FSM] Starting new turn sequence');
                                context.turnState = 'turn_start';
                            }
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
                            context.turnState = null;
                        },
                    },
                    END_ENCOUNTER: {
                        target: 'completed',
                        action: () => {
                            console.log('Encounter ended!');
                            // Notify the effectStore (and any other listeners) so encounter-duration
                            // effects can clear themselves.
                            eventSystem.emitGameEvent('ENCOUNTER_END');
                        },
                    },
                    PROCESS_TURN_START: {
                        target: 'inProgress',
                        guard: (context) => context.turnState === 'turn_start',
                        action: (context) => {
                            console.log('[FSM] Processing turn start...');
                            processTurnStart(context);
                            context.turnState = 'turn_active';
                            console.log('[FSM] Changed turn state to: turn_active');
                        },
                    },
                    PROCESS_TURN: {
                        target: 'inProgress',
                        guard: (context) => context.turnState === 'turn_active',
                        action: (context) => {
                            console.log('[FSM] Processing active turn...');
                            processTurnAction(context);
                            context.turnState = 'turn_end';
                            console.log('[FSM] Changed turn state to: turn_end');
                        },
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
                        }
                    }
                },
            },
        }
    );
}