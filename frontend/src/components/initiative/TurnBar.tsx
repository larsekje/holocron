import React from 'react';
import InitiativeOrder from "./InitiativeOrder";
import {Button, HStack, IconButton} from "@chakra-ui/react";
import {ArrowBackIcon, ArrowForwardIcon} from "@chakra-ui/icons";
import {useTurnStore} from "../../turnStore";
import RoundCounter from "./RoundCounter";
import TurnCounter from "./TurnCounter";

const TurnBar = () => {

  const incrementTurn = useTurnStore(state => state.incrementTurn);
  const decrementTurn = useTurnStore(state => state.decrementTurn);
  const rollInitiative = useTurnStore(state => state.rollInitiative);
  const reset = useTurnStore(state => state.reset);

  return (
    <HStack padding="0 10px" justifyContent="space-between" bg="#26292d" borderRadius="md">
      <HStack>
        <Button colorScheme="blue" onClick={rollInitiative}>Roll initiative</Button>
        <Button colorScheme="blue" variant="outline" onClick={reset}>Reset</Button>
      </HStack>
      <HStack justifyContent="center" height="100%" margin="0 auto">
        <IconButton aria-label={"turn left"} bg="green.500" icon={<ArrowBackIcon/>} onClick={decrementTurn}/>
        <InitiativeOrder/>
        <IconButton aria-label={"turn left"} bg="green.500" icon={<ArrowForwardIcon/>} onClick={incrementTurn}/>
      </HStack>
      <HStack>
        <TurnCounter/>
        <RoundCounter/>
      </HStack>
    </HStack>
  );
};

export default TurnBar;