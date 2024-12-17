import React, {useEffect} from "react";
import { Box, Button, VStack, Text } from "@chakra-ui/react";
import useGameplayStore from "@/state/gameplayStore";
import useFSMStore from "@/state/FSMStore";

const FSMTester: React.FC = () => {
    const { state, context, transition, setMode } = useFSMStore();
    const mode = useGameplayStore((state) => state.mode);

    // Update FSM mode when gameplay mode changes
    useEffect(() => {
        setMode(mode);
    }, [mode, setMode]);

    const isTransitionAllowed = (event: string): boolean => {
        return useFSMStore.getState().canTransition(event);
    };

    return (
        <Box p={5} borderWidth="1px" borderRadius="lg" maxW="md" mx="auto" textAlign="center">
            <VStack spacing={4}>
                <Text fontSize="2xl" fontWeight="bold">
                    FSM Tester
                </Text>
                <Text>Current State: {state}, Mode: {mode}</Text>
                <Text>Round: {context.round}</Text>
                <Text>Active Turn: {context.activeTurnIndex}</Text>
                <Text>Player Count: {context.participantCount}</Text>
                <Text>Initiative Rolled: {context.isInitiativeRolled ? 'Yes' : 'No'}</Text>
                <Text>Context Mode: {context.mode}</Text>
                <Text>Context Mode: {context.isInitiativeRolled ? 'Yes' : 'No'}</Text>
                <VStack spacing={3}>

                    {/* Button to Roll Initiative */}
                    <Button
                        colorScheme="purple"
                        onClick={() => transition('ROLL_INITIATIVE')}
                        isDisabled={state !== 'preparation' || context.isInitiativeRolled}
                    >
                        Roll Initiative
                    </Button>

                    {/* Button for START_ENCOUNTER */}
                    <Button
                        colorScheme="teal"
                        onClick={() => transition('START_ENCOUNTER')}
                        isDisabled={!isTransitionAllowed('START_ENCOUNTER')}
                    >
                        Start Encounter
                    </Button>

                    {/* Button for NEXT_TURN */}
                    <Button
                        colorScheme="blue"
                        onClick={() => transition('NEXT_TURN')}
                        isDisabled={state !== 'inProgress'}
                    >
                        Next Turn
                    </Button>

                    {/* Button for END_ENCOUNTER */}
                    <Button
                        colorScheme="red"
                        onClick={() => transition('END_ENCOUNTER')}
                        isDisabled={state !== 'inProgress'}
                    >
                        End Encounter
                    </Button>

                    {/* Button for RESET */}
                    <Button
                        colorScheme="orange"
                        onClick={() => transition('RESET')}
                        isDisabled={state !== 'completed'}
                    >
                        Reset FSM
                    </Button>
                </VStack>
            </VStack>
        </Box>
    );
};
export default FSMTester;