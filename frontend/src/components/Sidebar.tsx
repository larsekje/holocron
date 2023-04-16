import React from 'react';
import {Center, Text} from "@chakra-ui/react";
import {diceTableBad, diceTableGood} from "@/spendingDiceResultsInCombat";
import DiceResultSuggestionModal from "./diceResult/DiceResultSuggestionModal";
import {useDataStore} from "@/dataStore";

const Sidebar = () => {
  const talents = useDataStore((state) => state.talents);

  return (
    <Center>
      <DiceResultSuggestionModal tableName="combat" diceTableGood={diceTableGood} diceTableBad={diceTableBad}/>
      <Text>{talents.length > 0 ? talents[0].description : "No talents available"}</Text>
    </Center>
  );
};

export default Sidebar;
