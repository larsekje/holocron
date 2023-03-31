import React from 'react';
import {Box, Circle} from "@chakra-ui/react";

interface Props {
  pc: boolean;
  active?: boolean;
}

const InitiativeMarker = ({pc, active = false}: Props) => {

  return (
    <Box bg={active ? "dodgerblue" : ""} width="50px" alignItems="top" borderRadius="4" margin="5px">
        <Circle bg='tomato' size="40px" userSelect="none" margin="5px">NPC</Circle>
    </Box>
  );

};

export default InitiativeMarker;
