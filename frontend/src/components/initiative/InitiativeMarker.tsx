import React from 'react';
import {Box, Circle, Square} from "@chakra-ui/react";

interface Props {
  id: string;
  isNPC: boolean;
  activeId: string;
}

const InitiativeMarker = ({id, isNPC, activeId}: Props) => {

  const isActive = id === activeId;

  return (
    <Box bg={isActive ? "dodgerblue" : ""} width="50px" alignItems="top" borderRadius="4" margin="5px">
      {isNPC && <Circle bg='tomato' size="40px" userSelect="none" margin="5px">NPC</Circle>}
      {!isNPC && <Square bg='gold' size="40px" userSelect="none" margin="5px">PC</Square>}
    </Box>
  );

};

export default InitiativeMarker;
