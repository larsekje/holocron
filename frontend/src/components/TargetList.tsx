import React from 'react';
import {VStack} from "@chakra-ui/react";
import TargetCard from "./TargetCard";
import {Target} from "./ContentCardTargets";

interface Props {
  targets: Target[];
}

const TargetList = ({targets}: Props) => {

  return (
    <VStack>
      {targets.map(target => <TargetCard target={target}/>)}
    </VStack>
  );
};

export default TargetList;
