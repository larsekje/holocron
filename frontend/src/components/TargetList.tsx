import React from 'react';
import {VStack} from "@chakra-ui/react";
import TargetCard from "./target/TargetCard";
import {Target} from "../target";
import {useTargetStore} from "../targetStore";

interface Props {
  targets: Target[];
}

const TargetList = ({targets}: Props) => {

  const selectedTarget = useTargetStore(state => state.selectedTarget);
  const setSelectedTarget = useTargetStore(state => state.selectTarget);

  const handleTargetClick = (target: Target) => {
    setSelectedTarget(target);
  }

  return (
    <VStack>
      {targets.map(target =>
        <TargetCard
          target={target}
          selected={target === selectedTarget}
          onClick={() => handleTargetClick(target)}
        />)}
    </VStack>
  );
};

export default TargetList;
