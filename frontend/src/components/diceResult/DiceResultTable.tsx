import React from 'react';
import {
  Heading, List, ListItem, Tbody, Td, Th, Thead, Tr,
} from "@chakra-ui/react";
import DiceThreat from "@components/diceSymbols/DiceThreat";
import DiceAdvantage from "@components/diceSymbols/DiceAdvantage";
import DiceTriumph from "@components/diceSymbols/DiceTriumph";
import DiceDespair from "@components/diceSymbols/DiceDespair";
import {ParsedTable} from "@components/ParsedChakra";
import {DiceResult} from "@/spendingDiceResultsInCombat";

interface Props {
  tableName: string
  diceTable: DiceResult[];
  positiveResults: boolean;
}

const DiceResultTable = ({tableName, diceTable, positiveResults}: Props) => {

  // create table contents
  const rows = diceTable.map((result) => (
    <Tr key={result.cost}>
      <Td>{result.cost}</Td>
      <Td>
        <List>
          {result.result.map(r => <ListItem>{r}</ListItem>)}
        </List>
      </Td>
    </Tr>
  ));

  // text for header
  const headingText = positiveResults
    ? (<>Spending <DiceAdvantage/> and <DiceTriumph/> in {tableName}</>)
    : (<>Spending <DiceThreat/> and <DiceDespair/> in {tableName}</>);

  return (
    <>
      <Heading as="h2" size="lg">{headingText}</Heading>
      <ParsedTable variant="striped">
        <Thead>
          <Tr>
            <Th>Cost</Th>
            <Th>Result</Th>
          </Tr>
        </Thead>
        <Tbody>{rows}</Tbody>
      </ParsedTable>
    </>
  );
};

export default DiceResultTable;
