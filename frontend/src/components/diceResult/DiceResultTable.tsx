import React from 'react';
import {
  Heading, List, ListItem, Tbody, Td, Th, Thead, Tr,
} from "@chakra-ui/react";
import SymbolThreat from "@components/dice/SymbolThreat";
import SymbolAdvantage from "@components/dice/SymbolAdvantage";
import SymbolTriumph from "@components/dice/SymbolTriumph";
import SymbolDespair from "@components/dice/SymbolDespair";
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
    ? (<>Spending <SymbolAdvantage/> and <SymbolTriumph/> in {tableName}</>)
    : (<>Spending <SymbolThreat/> and <SymbolDespair/> in {tableName}</>);

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
