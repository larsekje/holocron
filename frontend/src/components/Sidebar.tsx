import React from 'react';
import {Center} from "@chakra-ui/react";
import {diceTableBad, diceTableGood} from "@/spendingDiceResultsInCombat";
import DiceResultSuggestionModal from "./diceResult/DiceResultSuggestionModal";

const Sidebar = () => {
  return (
    <Center>
      <DiceResultSuggestionModal tableName="combat" diceTableGood={diceTableGood} diceTableBad={diceTableBad}/>
    </Center>
  );
};

export default Sidebar;
