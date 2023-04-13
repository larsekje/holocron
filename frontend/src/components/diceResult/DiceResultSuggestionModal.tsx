import React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay, Tab, TabList, TabPanel, TabPanels, Tabs, Tooltip, useDisclosure,
} from "@chakra-ui/react";
import {useHotkeys} from "react-hotkeys-hook";
import DiceThreat from "@components/diceSymbols/DiceThreat";
import DiceAdvantage from "@components/diceSymbols/DiceAdvantage";
import {DiceResult} from "@/spendingDiceResultsInCombat";
import DiceResultTable from "./DiceResultTable";

interface Props {
  tableName: string
  diceTableGood: DiceResult[];
  diceTableBad: DiceResult[];
}

const DiceResultSuggestionModal = ({tableName, diceTableGood, diceTableBad}: Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const toggleOpen = () => {
    if(isOpen)
      onClose();
    else
      onOpen();
  }

  // hotkeys
  useHotkeys("t", toggleOpen);

  return (
    <>
      <Tooltip label={"Spending dice results on combat [t]"}>
        <Button onClick={onOpen}><DiceThreat/></Button>
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose} size="3xl" >
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <Tabs isFitted defaultIndex={0} variant="enclosed">
              <TabList>
                <Tab><DiceAdvantage/></Tab>
                <Tab><DiceThreat/></Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <DiceResultTable tableName={tableName} diceTable={diceTableGood} positiveResults={true}/>
                </TabPanel>
                <TabPanel>
                  <DiceResultTable tableName={tableName} diceTable={diceTableBad} positiveResults={false}/>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DiceResultSuggestionModal;
