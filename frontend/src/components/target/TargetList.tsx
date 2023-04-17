import React from 'react';
import {VStack} from "@chakra-ui/react";
import TargetCard from "./TargetCard";
import {useDataStore} from "@/dataStore";
import {selectNextTarget, selectPreviousTarget, useTargetStore} from "@/targetStore";
import {useHotkeys} from "react-hotkeys-hook";

interface Props {
}

const TargetList = ({}: Props) => {

  const loading = useDataStore(state => state.loading);
  const targets = useTargetStore(state => state.targets);
  const selectedTarget = useTargetStore(state => state.selectedTarget);
  const activeTarget = useTargetStore(state => state.activeTarget);
  const setSelectedTarget = useTargetStore(state => state.setSelectedTarget);

  useHotkeys("down", () => selectNextTarget(targets, selectedTarget, setSelectedTarget))
  useHotkeys("up", () => selectPreviousTarget(targets, selectedTarget, setSelectedTarget))

  return (
    <VStack>
      {!loading && targets.map(target =>
        <TargetCard
          key={target.id}
          target={target}
          isSelected={target.id === selectedTarget?.id}
          isActive={target.id === activeTarget?.id}
          onClick={() => setSelectedTarget(target)}
        />)}
    </VStack>
  );
};

export default TargetList;
