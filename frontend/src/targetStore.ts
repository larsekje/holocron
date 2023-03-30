import { create } from 'zustand'
import initialTargets from "./targets";
import {Target} from "./target";

interface TargetStore{
    bears: number;
    targets: Target[];
    selectedTarget: Target;
    setTargets: (targets: Target[]) => void;
    addTarget: (target: Target) => void;
    removeTarget: (target: Target) => void;
    selectTarget: (target: Target) => void;
    setHealth: (target: Target, value: number) => void;
}

const listOfInitialTargets = initialTargets;

export const useTargetStore = create<TargetStore>((set) => ({
    bears: 12,
    targets: listOfInitialTargets,
    selectedTarget: listOfInitialTargets[1],
    setTargets: (targets) => set(() => ({targets: targets})),
    addTarget: (target) => set((state) => ({targets: [...state.targets, target]})),
    removeTarget: (target) => set((state) => ({targets: state.targets.filter((t) => t.id !== target.id)})),
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
