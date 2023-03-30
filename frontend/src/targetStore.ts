import { create } from 'zustand'
import targets from "./targets";
import {Target} from "./target";

interface TargetStore{
    bears: number;
    targets: Target[];
    selectedTarget: Target;
    selectTarget: (target: Target) => void;
}

const listOfInitialTargets = targets;

export const useTargetStore = create<TargetStore>((set) => ({
    bears: 12,
    targets: listOfInitialTargets,
    selectedTarget: listOfInitialTargets[1],
    selectTarget: (target) => set(() => ({selectedTarget: target}))
}));
