import React, {useState} from 'react';
import {VStack} from "@chakra-ui/react";
import TargetCard from "./TargetCard";
import {Target} from "./ContentCardTargets";

interface Props {
  targets: Target[];
}

const TargetList = ({targets}: Props) => {

  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);

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
