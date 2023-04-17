import React from 'react';
import {Center, List} from "@chakra-ui/react";
import {diceTableBad, diceTableGood} from "@/spendingDiceResultsInCombat";
import DiceResultSuggestionModal from "./diceResult/DiceResultSuggestionModal";
import {useDataStore} from "@/dataStore";
import {statify} from "@/utils";
import {ParsedText} from "@components/ParsedChakra";

const Sidebar = () => {
  const getTalent = useDataStore((state) => state.getTalent);
  const allTalents = useDataStore((state) => state.talents);

  const talents = ["Adversary 3", "Durable 3", "Fearsome 3", "Bad Cop 2"]

  return (
    <Center>
      <DiceResultSuggestionModal tableName="combat" diceTableGood={diceTableGood} diceTableBad={diceTableBad}/>
      <List>
        {allTalents.length > 0 && talents.map(talentName => {
            let ranked = talentName.match(/\s(\d+)$/);
            let ranks = ranked ? ranked[1] : 1;

            let description = getTalent(talentName)?.description;
            description = statify(description, "", ranks);

            return (<ParsedText><strong>{talentName}:</strong> {description}</ParsedText>)
          }
        )}
      </List>

    </Center>
  );
};

export default Sidebar;
