import { create } from 'zustand'
import targets from "./targets";
import {Target} from "./target";

interface TargetStore{
    bears: number;
    targets: Target[];
    selectedTarget: Target;
    selectTarget: (target: Target) => void;
    setHealth: (target: Target, value: number) => void;
}

const listOfInitialTargets = targets;

export const useTargetStore = create<TargetStore>((set) => ({
    bears: 12,
    targets: listOfInitialTargets,
    selectedTarget: listOfInitialTargets[1],
    selectTarget: (target) => set(() => ({selectedTarget: target})),
    setHealth: (target, value) => set(state => ({
        targets: state.targets.map((t) =>
          t.id === target.id
            ? {...t, health: value}
            : t
        ),
        selectedTarget: {... target, health: value}
    })),
}));
