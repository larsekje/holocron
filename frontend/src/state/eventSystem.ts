// Event emitter for FSM events
export type FSMEventListener = (event: { type: FSMEvent; participantId?: string }) => void;
export type FSMEvent = 'START_ENCOUNTER' | 'NEXT_TURN' | 'PREV_TURN' | 'END_ENCOUNTER' | 'RESET' | 'ENTER_STRUCTURED' | 'EXIT_STRUCTURED' | 'ROLL_INITIATIVE';
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

export const emitFSMEvent = (type: FSMEvent, participantId?: string) => {
    console.log(`[Event System] Emitting FSM event: ${type}`, { participantId });
    listeners.forEach(listener => listener({ type, participantId }));
};

// Event emitter for game events
export type GameEvent =
    | 'TURN_START'
    | 'TURN_ACTION'
    | 'TURN_END'
    | 'ROUND_START'
    | 'ROUND_END'
    | 'ENCOUNTER_START'
    | 'ENCOUNTER_END';

export interface GameEventPayload {
    type: GameEvent;
    participantId?: string;
    /** Round number — populated for ROUND_START / ROUND_END so listeners
     * don't have to dig into stale store snapshots. */
    round?: number;
}

export type GameEventListener = (event: GameEventPayload) => void;

const gameListeners: GameEventListener[] = [];

export const addGameEventListener = (listener: GameEventListener) => {
    gameListeners.push(listener);
};

export const removeGameEventListener = (listener: GameEventListener) => {
    const index = gameListeners.indexOf(listener);
    if (index > -1) {
        gameListeners.splice(index, 1);
    }
};

export const emitGameEvent = (
    type: GameEvent,
    participantId?: string,
    round?: number,
) => {
    console.log(
        `[Event System] Emitting game event: ${type}`,
        participantId || round ? { participantId, round } : {},
    );
    gameListeners.forEach(listener => listener({ type, participantId, round }));
};
