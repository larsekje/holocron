import React from 'react';
import {Box, Circle} from "@chakra-ui/react";

interface Props {
  id: string;
  pc: boolean;
  activeId: string;
}

const InitiativeMarker = ({id, pc, activeId}: Props) => {

  const isActive = id === activeId;

  return (
    <Box bg={isActive ? "dodgerblue" : ""} width="50px" alignItems="top" borderRadius="4" margin="5px">
        <Circle bg='tomato' size="40px" userSelect="none" margin="5px">{pc ? "PC" : "NPC"}</Circle>
    </Box>
  );

};

export default InitiativeMarker;
