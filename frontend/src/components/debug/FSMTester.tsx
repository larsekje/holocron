import React, {useEffect} from "react";
import { Box, Button, VStack, Text } from "@chakra-ui/react";
import { create } from "zustand";
import {EncounterContext, FSM} from "@/state/FSM";
import useGameplayStore from "@/state/gameplayStore";

function canStartEncounter(context: EncounterContext): boolean {
    return context.isInitiativeRolled && context.participantCount > 0 && context.mode === "structured";
}

const encounterFSM = new FSM(
    'preparation', // Initial state
    {
        mode: 'structured', // Default mode, added to align with updated EncounterContext
        round: 1,
        activeTurnIndex: 0,
        participantCount: 3,
        isInitiativeRolled: false,
    },
    {
        idle: {
            on: {
                ENTER_STRUCTURED: {
                    target: 'preparation',
                    action: (context: EncounterContext) => {
                        context.mode = 'structured';
                        console.log('Entering structured mode');
                    },
                },
            },
        },
        preparation: {
            on: {
                ROLL_INITIATIVE: {
                    target: 'preparation', // Stay in the same state
                    action: (context: EncounterContext) => {
                        context.isInitiativeRolled = true;
                        console.log('Initiative rolled!');
                    },
                },
                START_ENCOUNTER: {
                    target: 'inProgress',
                    guard: canStartEncounter,
                    action: (context: EncounterContext) => {
                        console.log('Encounter started!');
                    },
                },
                EXIT_STRUCTURED: {
                    target: 'idle',
                    action: (context) => {
                        context.mode = 'idle';
                        context.round = 1;
                        context.activeTurnIndex = 0;
                        context.participantCount = 3;
                        context.isInitiativeRolled = false;
                        console.log('Exiting structured mode and resetting FSM');
                    },
                },
            },
        },
        inProgress: {
            on: {
                NEXT_TURN: {
                    target: 'inProgress', // Stays in the same state
                    action: (context) => {
                        const isLast = context.activeTurnIndex + 1 >= context.participantCount;
                        if (isLast) {
                            context.round += 1;
                            context.activeTurnIndex = 0; // Reset turn index for the next round
                        } else {
                            context.activeTurnIndex += 1; // Move to the next player
                        }
                        console.log(`Turn advanced: Round ${context.round}, Active Turn ${context.activeTurnIndex}`);
                    },
                },
                END_ENCOUNTER: {
                    target: 'completed',
                    action: (context) => {
                        console.log('Encounter ended!');
                    },
                },
                EXIT_STRUCTURED: {
                    target: 'idle',
                    action: (context) => {
                        context.mode = 'idle';
                        console.log('Exiting structured mode from inProgress');
                    },
                },
            },
        },
        completed: {
            on: {
                RESET: {
                    target: 'preparation',
                    action: (context) => {
                        context.round = 1;
                        context.activeTurnIndex = 0;
                        context.participantCount = 3;
                        context.isInitiativeRolled = false;
                        console.log('FSM reset to preparation');
                    },
                },
                EXIT_STRUCTURED: {
                    target: 'idle',
                    action: (context) => {
                        context.mode = 'idle';
                        console.log('Exiting structured mode from completed');
                    },
                },
            },
        },
    }
);

interface FSMStore {
    state: string;
    context: EncounterContext;
    transition: (event: string) => void;
    setMode: (mode: string) => void;
    canTransition: (event: string) => boolean;
}

const useFSMStore = create<FSMStore>((set) => ({
    state: encounterFSM.state,
    context: encounterFSM.context,
    transition: (event: string) => {
        encounterFSM.transition(event as any);
        set({
            state: encounterFSM.state,
            context: encounterFSM.context,
        });
    },
    setMode: (mode: string) => {
        if (mode === 'structured') {
            encounterFSM.transition('ENTER_STRUCTURED');
        } else {
            encounterFSM.transition('EXIT_STRUCTURED');
        }
        set({
            state: encounterFSM.state,
            context: encounterFSM.context,
        });
    },
    canTransition: (event: string) => encounterFSM.canTransition(event), // New helper method

}));

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