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
    nextTarget: () => void;
    prevTarget: () => void;
    selectTarget: (target: Target) => void;
    setActive: (target: Target) => void;
    activePlayer: Target;
    setHealth: (target: Target, value: number) => void;
    setCanUseCurrentInitiativeSlot: (isNPC: boolean) => void;
}

const listOfInitialTargets = initialTargets;

export const useTargetStore = create<TargetStore>((set, get) => ({
    bears: 12,
    targets: listOfInitialTargets,
    selectedTarget: listOfInitialTargets[1],
    setTargets: (targets) => set(() => ({targets: targets})),
    addTarget: (target) => set((state) => ({targets: [...state.targets, target]})),
    removeTarget: (target) => set((state) => ({targets: state.targets.filter((t) => t.id !== target.id)})),
    nextTarget: () => {
        const selectedTarget = get().selectedTarget;
        const targets = get().targets;
        let indexOfSelectedTarget = targets.indexOf(selectedTarget);

        if (indexOfSelectedTarget === targets.length-1)
            indexOfSelectedTarget = -1;

        set({selectedTarget: targets[indexOfSelectedTarget+1]});
    },
    prevTarget: () => {
        const selectedTarget = get().selectedTarget;
        const targets = get().targets;
        let indexOfSelectedTarget = targets.indexOf(selectedTarget);

        if (indexOfSelectedTarget === 0)
            indexOfSelectedTarget = targets.length;

        set({selectedTarget: targets[indexOfSelectedTarget-1]});
    },
    selectTarget: (target) => set(() => ({selectedTarget: target})),
    setActive: (target) => set(() => ({activePlayer: target})),
    activePlayer: listOfInitialTargets[0],
    setHealth: (target, value) => set(state => ({
        targets: state.targets.map((t) =>
          t.id === target.id
            ? {...t, health: value}
            : t
        ),
        selectedTarget: state.selectedTarget.id === target.id ?
          {... target, health: value}
          : state.selectedTarget,
        activePlayer: state.activePlayer.id === target.id ?
          {... target, health: value}
          : state.activePlayer
    })),
    setCanUseCurrentInitiativeSlot: (isNPC) => {
        let newtargets = [];
        for (let target of get().targets){
            target.canUseThisSlot = target.isNPC && isNPC || (!target.isNPC && !isNPC);
            newtargets.push(target);
        }
        set({targets: newtargets})
    }
}));
