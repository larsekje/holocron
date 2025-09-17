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
import useGameplayStore from "@/state/newGameplayStore";
import RoundNumberDisplay from "@components/turnbar/RoundNumberDisplay";
import EndEncounterModal from "@components/turnbar/EndEncounterModal";
import PocketedResults from "@components/turnbar/PocketedResults";
import CritRollerModal from "@components/crit/CritRollerModal";

interface Props { }

const ToolBarStructured = ({ }: Props) => {

    const transition  = useGameplayStore((state) => state.transition);
    const { canTransition }  = useGameplayStore();
    const round = useGameplayStore((state) => state.context.round);
    const state = useGameplayStore((state) => state.state);

    const [isModalOpen, setModalOpen] = useState(false);
    const [isCritOpen, setCritOpen] = useState(false);

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    return (
        <>
            {/* Left Area */}
            <HStack paddingLeft={4}>
                {/* End Encounter Button */}
                <Button
                    colorScheme="red"
                    size="sm"
                    onClick={openModal}
                    isDisabled={state !== 'inProgress'} // Only enabled during 'inProgress'
                >
                    End Encounter
                </Button>

                {/* End Encounter Modal */}
                <EndEncounterModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onConfirm={() => console.log("Confirmed")}
                />
            </HStack>


        {/* Center Area */}
        {state === 'inProgress' &&
        (
            <HStack textAlign="center">
                {/* Decrease Button */}
                <Button
            colorScheme="teal"
            size="sm"
            onClick={() => transition('PREV_TURN')}
            isDisabled={!canTransition('PREV_TURN')}>
            Previous
            </Button>

            {/* InitiativeOrder */}
            <InitiativeOrder/>

            {/* Increase Button */}
            <Button colorScheme="teal" size="sm" onClick={() => transition('NEXT_TURN')} isDisabled={!canTransition('NEXT_TURN')}>
            Next
            </Button>
            </HStack>
        )}

        {/* Right Area */}
        <Flex gap={4} align="center" pr={4}>
            <RoundNumberDisplay roundNumber={round}/>
            <Button size="sm" colorScheme="purple" onClick={() => setCritOpen(true)}>
                Crit Roller
            </Button>
        </Flex>

        {/* Crit Roller Modal */}
        <CritRollerModal isOpen={isCritOpen} onClose={() => setCritOpen(false)} />
    </>
);
}

export default ToolBarStructured