import React from 'react';
import {Center} from "@chakra-ui/react";
import {diceTableBad, diceTableGood} from "@/spendingDiceResultsInCombat";
import DiceResultSuggestionModal from "./diceResult/DiceResultSuggestionModal";
import Lookup from "@components/lookup/Lookup";

const Sidebar = () => {
  return (
    <Center>
      <DiceResultSuggestionModal tableName="combat" diceTableGood={diceTableGood} diceTableBad={diceTableBad}/>
      <Lookup/>
    </Center>
  );
};

export default Sidebar;
