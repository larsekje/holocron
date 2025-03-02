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
export type GameEventListener = (event: { type: GameEvent; participantId?: string }) => void;
export type GameEvent = 'TURN_START' | 'TURN_ACTION' | 'TURN_END' | 'ROUND_START' | 'ROUND_END';
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

export const emitGameEvent = (type: GameEvent, participantId?: string) => {
    console.log(`[Event System] Emitting game event: ${type}`, participantId ? { participantId } : {});
    gameListeners.forEach(listener => listener({ type, participantId }));
};
