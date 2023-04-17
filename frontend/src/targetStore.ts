import {Target} from "@/target";
import {create} from "zustand";
import {useEffect} from "react";
import {useDataStore} from "@/dataStore";

interface TargetStore {
  targets: Target[]
  setTargets: (targets: Target[]) => void;
  selectedTarget: Target | undefined;
  setSelectedTarget: (selectedTarget: Target) => void;
}

export const useTargetStore = create<TargetStore>((set, get) => ({
  targets: [],
  selectedTarget: undefined,
  setTargets: targets => set({targets}),
  setSelectedTarget: selectedTarget => {
    const currentlySelected = get().selectedTarget;

    if (currentlySelected?.id === selectedTarget.id) {
      set({selectedTarget: undefined});
    } else {
      set({selectedTarget});
    }
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
        new Target(adversaries[52]),
        new Target(adversaries[13]),
      ]);
  }, [loading]);
}

