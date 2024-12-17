import React from 'react'
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
import RoundNumberDisplay from "@components/turnbar/RoundNumberDisplay";
import {useMachine} from "@xstate/react";

interface Props { }

const ToolBar = ({ }: Props) => {

    const { nextTurn, prevTurn, currentTurnIndex, round } = useGameplayStore();
    const { activeParticipantId } = useGameplayStore();

    const { mode, turnBased } = useGameplayStore();

    return (
        <Flex borderRadius="md" bg="#2A2C30" align="center" justify="space-between" h="100%" w="100%">
            {/* Left Area */}
            <HStack paddingLeft={4}>

            </HStack>

            {/* Center Area */}
            {mode === 'structured' &&
                (
                    <HStack textAlign="center">
                        {/* Decrease Button */}
                        <Button
                            colorScheme="teal"
                            size="sm"
                            onClick={prevTurn}
                            isDisabled={currentTurnIndex === 0}>
                            Previous
                        </Button>

                        {/* InitiativeOrder */}
                        <InitiativeOrder/>

                        {/* Increase Button */}
                        <Button colorScheme="teal" size="sm" onClick={nextTurn} isDisabled={!activeParticipantId}>
                            Next
                        </Button>
                    </HStack>
                )}

            {/* Right Area */}
            <Flex gap={4}>
                <RoundNumberDisplay roundNumber={round}/>
            </Flex>
        </Flex>
    );
}

export default ToolBar