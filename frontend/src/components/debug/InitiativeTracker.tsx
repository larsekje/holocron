import React, { useState, useEffect } from "react";
import {
    Box,
    Text,
    Flex,
    Badge,
    VStack,
    Button,
    HStack,
    Stack,
    Select,
    Divider,
} from "@chakra-ui/react";
import useGameplayStore from "@/state/gameplayStore";

interface InitiativeSlot {
    team: "PC" | "NPC";
    initiative: number;
}

interface Participant {
    id: string;
    name: string;
    isPC: boolean;
}

interface InitiativeTrackerProps {
    initiativeOrder: InitiativeSlot[];
    participants: Participant[];
}

const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({
                                                                 initiativeOrder,
                                                                 participants,
                                                             }) => {
    // const [currentTurnIndex, setCurrentTurnIndex] = useState(0); // Current turn index in initiative order
    const { currentTurnIndex, nextTurn, prevTurn, resetTurnOrder, setCurrentTurnIndex, setActiveParticipantId, activeParticipantId } = useGameplayStore();
    const { actedParticipants, addActedParticipant, clearActedParticipants } = useGameplayStore();

    const [round, setRound] = useState(1); // Tracks the current round
    //const [actedParticipants, setActedParticipants] = useState<string[]>([]); // Tracks participants who have already acted

    const currentSlot = initiativeOrder[currentTurnIndex!];

    // Group participants into PCs and NPCs
    const pcs = participants.filter((p) => p.isPC);
    const npcs = participants.filter((p) => !p.isPC);

    // Reset acted participants at the start of a new round
    useEffect(() => {
        if (currentTurnIndex === 0 && round > 1) {
            clearActedParticipants(); // Clear the list of acted participants at new round
        }
    }, [round, currentTurnIndex]);

    const handleNextTurn = () => {
        const isLastTurn = currentTurnIndex === initiativeOrder.length - 1;

        if (activeParticipantId) {
            // Add the active participant to actedParticipants
            addActedParticipant(activeParticipantId);
        }

        if (isLastTurn) {
            setRound((prev) => prev + 1); // Increment the round
            resetTurnOrder(); // Reset turn index for the new round
        } else {
            nextTurn();
        }

        setActiveParticipantId(null); // Clear the active participant
    };

    const previousTurn = () => {
        const isFirstTurn = currentTurnIndex === 0;

        if (isFirstTurn && round > 1) {
            setRound((prev) => prev - 1); // Roll back the round
            setCurrentTurnIndex(initiativeOrder.length - 1); // Move to the final slot of the previous round
        } else if (!isFirstTurn) {
            prevTurn(); // Move to the previous slot
        }

        setActiveParticipantId(null); // Clear the active participant
    };

    const setParticipantAsActive = (id: string) => {
        setActiveParticipantId(id); // Set the selected participant as active
    };

    const currentTeam = currentSlot?.team ?? null; // Determine the current team's turn (PC/NPC)

    return (
        <Box mt={4} p={4} borderWidth="1px" borderRadius="md" boxShadow="sm">

            {/* Participants Manager */}
            <Box mt={6} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                <Flex align="center" justify="space-between" mb={4}>
                    <Text fontWeight="bold">Participants Manager</Text>
                    {currentTeam && (
                        <Badge
                            colorScheme={currentTeam === "PC" ? "green" : "purple"}
                            fontSize="md"
                        >
                            Currently Selecting: {currentTeam} Team
                        </Badge>
                    )}
                </Flex>

                <Text fontWeight="semibold">--- PCs ---</Text>
                {pcs.map((participant) => (
                    <Flex
                        key={participant.id}
                        align="center"
                        justify="space-between"
                        mt={2}
                        color="green.700"
                    >
                        <Text color="green.700" fontWeight="bold">
                            {participant.name}
                            {activeParticipantId === participant.id && (
                                <Badge colorScheme="yellow" ml={2}>
                                    Active
                                </Badge>
                            )}
                        </Text>
                        <Flex align="center">
                            {actedParticipants.includes(participant.id) ? (
                                <>
                                    <Badge colorScheme="red" mr={2}>
                                        Acted
                                    </Badge>
                                    <Button
                                        size="xs"
                                        colorScheme={
                                            currentTeam === "PC" ? "green" : "gray"
                                        }
                                        disabled={currentTeam !== "PC"}
                                        onClick={() => setParticipantAsActive(participant.id)}
                                    >
                                        Set Active (override)
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="xs"
                                    colorScheme={currentTeam === "PC" ? "green" : "gray"}
                                    disabled={currentTeam !== "PC"}
                                    onClick={() => setParticipantAsActive(participant.id)}
                                >
                                    Set Active
                                </Button>
                            )}
                        </Flex>
                    </Flex>
                ))}

                <Divider my={4} />

                <Text fontWeight="semibold">--- NPCs ---</Text>
                {npcs.map((participant) => (
                    <Flex
                        key={participant.id}
                        align="center"
                        justify="space-between"
                        mt={2}
                        color="purple.700"
                    >
                        <Text color="purple.700" fontWeight="bold">
                            {participant.name}
                            {activeParticipantId === participant.id && (
                                <Badge colorScheme="yellow" ml={2}>
                                    Active
                                </Badge>
                            )}
                        </Text>
                        <Flex align="center">
                            {actedParticipants.includes(participant.id) ? (
                                <>
                                    <Badge colorScheme="red" mr={2}>
                                        Acted
                                    </Badge>
                                    <Button
                                        size="xs"
                                        colorScheme={
                                            currentTeam === "NPC" ? "purple" : "gray"
                                        }
                                        disabled={currentTeam !== "NPC"}
                                        onClick={() => setParticipantAsActive(participant.id)}
                                    >
                                        Set Active (override)
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="xs"
                                    colorScheme={currentTeam === "NPC" ? "purple" : "gray"}
                                    disabled={currentTeam !== "NPC"}
                                    onClick={() => setParticipantAsActive(participant.id)}
                                >
                                    Set Active
                                </Button>
                            )}
                        </Flex>
                    </Flex>
                ))}
            </Box>

            {/* Navigation Buttons */}
            <HStack mt={6} spacing={4} justify="space-between">
                <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={previousTurn}
                    isDisabled={round === 1 && currentTurnIndex === 0}
                >
                    Previous Turn
                </Button>
                <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={handleNextTurn}
                    isDisabled={!activeParticipantId}
                >
                    Next Turn
                </Button>
            </HStack>
        </Box>
    );
};

export default InitiativeTracker;