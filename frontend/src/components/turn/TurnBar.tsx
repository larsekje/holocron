import React from 'react';
import InitiativeOrder from "./InitiativeOrder";
import {HStack, IconButton} from "@chakra-ui/react";
import {ArrowBackIcon, ArrowForwardIcon} from "@chakra-ui/icons";
import {useTurnStore} from "../../turnStore";
import RoundCounter from "./RoundCounter";

const TurnBar = () => {
  const incrementRound = useTurnStore(state => state.incrementRound);
  const decrementRound = useTurnStore(state => state.decrementRound);

  return (
    <HStack padding="0 10px" justifyContent="space-between" bg="#26292d" borderRadius="md">
      <HStack justifyContent="center" height="100%" margin="0 auto">
        <IconButton aria-label={"turn left"} bg="green.500" icon={<ArrowBackIcon/>} onClick={decrementRound}/>
        <InitiativeOrder/>
        <IconButton aria-label={"turn left"} bg="green.500" icon={<ArrowForwardIcon/>} onClick={incrementRound}/>
      </HStack>
      <RoundCounter/>
    </HStack>
  );
};

export default TurnBar;
