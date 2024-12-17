import { create } from 'zustand';
import {createEncounterFSM, EncounterContext} from './FSM';

const encounterFSM = createEncounterFSM();

interface FSMStore {
    state: string;
    context: EncounterContext;
    transition: (event: string) => void;
    setMode: (mode: string) => void;
    canTransition: (event: string) => boolean;
}

const useFSMStore = create<FSMStore>((set) => ({
    state: encounterFSM.state,
    context: encounterFSM.context,
    transition: (event: string) => {
        encounterFSM.transition(event as any);
        set({ state: encounterFSM.state, context: encounterFSM.context });
    },
    setMode: (mode: string) => {
        const event = mode === 'structured' ? 'ENTER_STRUCTURED' : 'EXIT_STRUCTURED';
        encounterFSM.transition(event);
        set({ state: encounterFSM.state, context: encounterFSM.context });
    },
    canTransition: (event: string) => encounterFSM.canTransition(event as any),
}));

export default useFSMStore;