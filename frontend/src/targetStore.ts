import {Target} from "@/target";
import {create} from "zustand";
import {useEffect} from "react";
import {useDataStore} from "@/dataStore";

interface TargetStore {
  targets: Target[]
  setTargets: (targets: Target[]) => void;
  selectedTarget: Target | undefined;
  activeTarget: Target | undefined;
  setSelectedTarget: (activeTarget: Target) => void;
  setActiveTarget: (activeTarget: Target | undefined) => void;
  updateTarget: (target: Target) => void;
}

export const useTargetStore = create<TargetStore>((set, get) => ({
  targets: [],
  selectedTarget: undefined,
  activeTarget: undefined,
  setTargets: targets => set({targets}),
  setSelectedTarget: selectedTarget => {
    const currentlySelected = get().selectedTarget;

    if (currentlySelected?.id === selectedTarget.id) {
      set({selectedTarget: undefined});
    } else {
      set({selectedTarget});
    }
  },
  setActiveTarget: activeTarget => {
    if (activeTarget !== undefined)
      set({activeTarget})
  },
  updateTarget: updatedTarget => {
    updatedTarget = updatedTarget.clone();

    if (get().selectedTarget?.id === updatedTarget.id)
      set(() => ({selectedTarget: updatedTarget}))

    if (get().activeTarget?.id === updatedTarget.id)
      set(() => ({activeTarget: updatedTarget}))

    set((state) => ({
      targets: state.targets.map(target =>
        target.id === updatedTarget.id ? updatedTarget : target
      )}))
  }

}))

export function useSetInitialTargets() {
  const loading = useDataStore(state => state.loading);
  const adversaries = useDataStore(state => state.adversaries);
  const setTargets = useTargetStore(state => state.setTargets);

  useEffect(() => {
    if(!loading)
      setTargets([
        new Target(adversaries[0]),
        new Target(adversaries[2]),
        new Target(adversaries[52], 3),
        new Target(adversaries[13]),
      ]);
  }, [loading]);
}

export function selectNextTarget(targets: Target[], selectedTarget: Target | undefined, setSelectedTarget: (target: Target) => void) {
  if (selectedTarget === undefined)
    setSelectedTarget(targets[0])
  else {
    let index = targets.indexOf(selectedTarget)

    if (index === targets.length-1)
      index = -1;

    setSelectedTarget(targets[index+1])
  }
}

export function selectPreviousTarget (targets: Target[], selectedTarget: Target | undefined, setSelectedTarget: (target: Target) => void) {
  if (selectedTarget === undefined)
    setSelectedTarget(targets[targets.length-1])
  else {
    let index = targets.indexOf(selectedTarget)

    if (index === 0)
      index = targets.length;

    setSelectedTarget(targets[index-1])
  }
}

