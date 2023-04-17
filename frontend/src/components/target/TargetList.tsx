import React from 'react';
import {VStack} from "@chakra-ui/react";
import TargetCard from "./TargetCard";
import {useDataStore} from "@/dataStore";
import {useTargetStore} from "@/targetStore";

interface Props {
}

const TargetList = ({}: Props) => {

  const loading = useDataStore(state => state.loading);
  const targets = useTargetStore(state => state.targets);
  const setSelectedTarget = useTargetStore(state => state.setSelectedTarget);

  return (
    <VStack>
      {!loading && targets.map(target =>
        <TargetCard
          key={target.id}
          target={target}
          onClick={() => setSelectedTarget(target)}
        />)}
    </VStack>
  );
};

export default TargetList;
