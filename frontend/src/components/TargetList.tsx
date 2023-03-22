import React from 'react';
import {VStack} from "@chakra-ui/react";
import TargetCard from "./TargetCard";

interface Props {
  count: number;
}

const TargetList = ({count}: Props) => {

  const targets = []

  for (let i = 0; i < count; i++) {
    targets.push(<TargetCard maxWounds={12} currentWounds={10}/>)
  }

  return (
    <VStack>
      {targets}
    </VStack>
  );
};

export default TargetList;
