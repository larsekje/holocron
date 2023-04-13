import React from 'react';
import {
  Heading, ListItem, Table, Tbody, Td, Th, Thead, Tr,
} from "@chakra-ui/react";
import DiceThreat from "../diceSymbols/DiceThreat";
import DiceAdvantage from "../diceSymbols/DiceAdvantage";
import DiceTriumph from "../diceSymbols/DiceTriumph";
import DiceDespair from "../diceSymbols/DiceDespair";
import {DiceResult} from "../../spendingDiceResultsInCombat";
import ParsedList from "../parsedChakra/ParsedList";

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
        <ParsedList>
          {result.result.map(r => <ListItem>{r}</ListItem>)}
        </ParsedList>
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
      <Table variant="striped">
        <Thead>
          <Tr>
            <Th>Cost</Th>
            <Th>Result</Th>
          </Tr>
        </Thead>
        <Tbody>{rows}</Tbody>
      </Table>
    </>
  );
};

export default DiceResultTable;
