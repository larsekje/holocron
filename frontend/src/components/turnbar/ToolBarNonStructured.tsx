import React, {useState} from 'react'
import {
    AccordionButton,
    Box,
    Button,
    Center,
    Flex,
    HStack,
    Menu, MenuButton,
    MenuItem,
    Spacer,
    Text,
    VStack
} from "@chakra-ui/react";
import InitiativeOrder from "@components/turnbar/InitiativeOrder";
import useGameplayStore from "@/state/gameplayStore";
import useGameplayStoreNew from "@/state/newGameplayStore";
import RoundNumberDisplay from "@components/turnbar/RoundNumberDisplay";
import {useMachine} from "@xstate/react";
import InitiativeModal from "@components/debug/InitiativeModal";
import useParticipantsStore, {Participant} from "@/state/participantsStore";
import {InitiativeSlot} from "@/types/initiativeSlot";

interface Props { }

const ToolBarNonStructured = ({ }: Props) => {

    const {transition}  = useGameplayStoreNew();
    const isInitiativeModalOpen = useGameplayStoreNew((state) => state.isInitiativeModalOpen);
    const { setInitiativeModalOpen } = useGameplayStoreNew();
    const { updateParticipants } = useParticipantsStore();

    const handleRollInitiative = () => {
        setInitiativeModalOpen(true);
    }

    const handleCloseModal = () => {
        setInitiativeModalOpen(false);
    };

    const {setInitiativeOrder} = useGameplayStoreNew();
    const participants = useParticipantsStore((state) => state.participants);
    const participantCount = useParticipantsStore((state) => state.participants.length);


    const handleSetInitiative = (updatedParticipants: Participant[]) => {
        transition('ENTER_STRUCTURED');
        transition('ROLL_INITIATIVE');

        updateParticipants(updatedParticipants);

        // Map participants to InitiativeSlot[] shape and sort them
        const order = updatedParticipants
            .filter((p) => p.initiative !== null) // Ensure all initiatives are present
            .map((p) => ({
                team: p.isPC ? "PC" : "NPC", // Map to the store's type
                initiative: p.initiative!,
            }))
            .sort((a, b) => b.initiative - a.initiative) as InitiativeSlot[]; // Sort descending

        setInitiativeOrder(order); // Update store

        transition('START_ENCOUNTER');

    };

    return (
      <>

          {/* Left Area */}
          <HStack paddingLeft={4}>

          </HStack>


          {/* Button to Roll Initiative */}
          <Button
              colorScheme="purple"
              onClick={handleRollInitiative}
              isDisabled={participantCount === 0}
          > Roll Initiative
          </Button>

          <InitiativeModal
              isOpen={isInitiativeModalOpen}
              participants={participants} // Pass current participants
              onClose={handleCloseModal}
              onSubmit={handleSetInitiative} // Handle initiative updates
          />



          {/* Right Area */}
          <Flex gap={4}>

          </Flex>


      </>
    );

    return <Text>Non-Structured</Text>
}

export default ToolBarNonStructured