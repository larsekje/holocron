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
import useGameplayStore from "@/state/newGameplayStore";
import RoundNumberDisplay from "@components/turnbar/RoundNumberDisplay";

interface Props { }

const ToolBarStructured = ({ }: Props) => {

    const transition  = useGameplayStore((state) => state.transition);
    const { canTransition }  = useGameplayStore();
    const round = useGameplayStore((state) => state.context.round);
    const state = useGameplayStore((state) => state.state);

    return (
        <>
            {/* Left Area */}
            <HStack paddingLeft={4}>

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
        <Flex gap={4}>
            <RoundNumberDisplay roundNumber={round}/>
        </Flex>
    </>
);
}

export default ToolBarStructured