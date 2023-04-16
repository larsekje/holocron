import React from 'react';
import {Center} from "@chakra-ui/react";
import {diceTableBad, diceTableGood} from "@/spendingDiceResultsInCombat";
import DiceResultSuggestionModal from "./diceResult/DiceResultSuggestionModal";
import {useDataStore} from "@/dataStore";
import {statify} from "@/utils";
import {ParsedText} from "@components/ParsedChakra";

const Sidebar = () => {
  const getTalent = useDataStore((state) => state.getTalent);

  let talentName = "Bad Cop 2"

  let ranked = talentName.match(/\s(\d+)$/);
  let ranks = ranked ? ranked[1] : 1;

  let description = getTalent(talentName)?.description;
  description = statify(description, "", ranks);

  return (
    <Center>
      <DiceResultSuggestionModal tableName="combat" diceTableGood={diceTableGood} diceTableBad={diceTableBad}/>
      <ParsedText><strong>{talentName}:</strong> {description}</ParsedText>
    </Center>
  );
};

export default Sidebar;
