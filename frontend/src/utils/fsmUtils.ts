import useFSMStore from '@/state/FSMStore';

export const isTransitionDisabled = (event: string): boolean => {
    return !useFSMStore.getState().canTransition(event);
};