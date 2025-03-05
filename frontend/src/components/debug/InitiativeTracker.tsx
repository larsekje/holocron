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
import useGameplayStoreNew from "@/state/newGameplayStore";
import useParticipantsStore from "@/state/participantsStore";

interface InitiativeSlot {
    team: "PC" | "NPC";
    initiative: number;
}

interface Participant {
    id: string;
    name: string;
    isPC: boolean;
}

const InitiativeTracker: React.FC = () => {
    // Get data from stores
    const { currentTurnIndex, nextTurn, prevTurn, resetTurnOrder, setCurrentTurnIndex } = useGameplayStore();
    const { setActiveParticipantId, addActedParticipant, clearActedParticipants, context } = useGameplayStoreNew();
    const participants = useParticipantsStore((state) => state.participants);
    
    const initiativeOrder = context.initiativeOrder || [];
    const activeParticipantId = context.activeParticipantId;
    const actedParticipants = context.actedParticipants || [];

    const [round, setRound] = useState(1);

    // Safety check to prevent errors when initiativeOrder is empty or undefined
    const currentSlot = initiativeOrder.length > 0 && currentTurnIndex !== undefined && currentTurnIndex < initiativeOrder.length
        ? initiativeOrder[currentTurnIndex]
        : undefined;

    // Group participants into PCs and NPCs
    const pcs = participants.filter((p) => p.isPC);
    const npcs = participants.filter((p) => !p.isPC);

    // Reset acted participants at the start of a new round
    useEffect(() => {
        if (currentTurnIndex === 0 && round > 1) {
            clearActedParticipants(); // Clear the list of acted participants at new round
        }
    }, [round, currentTurnIndex, clearActedParticipants]);

    const handleNextTurn = () => {
        // Handle cases where initiativeOrder might be undefined or empty
        if (!initiativeOrder || initiativeOrder.length === 0) return;
        
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
        // Handle cases where initiativeOrder might be undefined or empty
        if (!initiativeOrder || initiativeOrder.length === 0) return;
        
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
        <Box p={4} borderRadius="md" boxShadow="sm" bg="#26292d" color="white">
            <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight="bold">Initiative Tracker</Text>
                <Text>Round: {round}</Text>
            </Flex>
            
            {initiativeOrder && initiativeOrder.length > 0 ? (
                <VStack spacing={3} align="stretch">
                    {/* Turn controls */}
                    <HStack justifyContent="space-between" mb={2}>
                        <Button size="sm" onClick={previousTurn} colorScheme="blue" variant="outline">
                            Previous
                        </Button>
                        <Button size="sm" onClick={handleNextTurn} colorScheme="blue">
                            Next Turn
                        </Button>
                    </HStack>
                    
                    {/* Current turn indicator */}
                    {currentSlot && (
                        <Box p={2} bg={currentTeam === "PC" ? "blue.100" : "red.100"} color="black" borderRadius="md">
                            <Text fontWeight="bold">
                                Current Turn: {currentTeam === "PC" ? "Player Characters" : "Non-Player Characters"}
                            </Text>
                        </Box>
                    )}
                    
                    {/* List of participants with initiative */}
                    <Box mt={2}>
                        {participants.map((participant) => (
                            <Box 
                                key={participant.id}
                                p={2} 
                                mb={1}
                                borderRadius="md"
                                bg={participant.isPC ? "blue.50" : "red.50"}
                                color="black"
                                opacity={actedParticipants.includes(participant.id) ? 0.5 : 1}
                                cursor="pointer"
                                onClick={() => setParticipantAsActive(participant.id)}
                                borderWidth={activeParticipantId === participant.id ? 2 : 0}
                                borderColor={activeParticipantId === participant.id ? "green.500" : undefined}
                            >
                                <Flex justify="space-between">
                                    <Text>{participant.name}</Text>
                                    <Badge colorScheme={participant.isPC ? "blue" : "red"}>
                                        {participant.isPC ? "PC" : "NPC"}
                                    </Badge>
                                </Flex>
                            </Box>
                        ))}
                    </Box>
                </VStack>
            ) : (
                <Box p={4} textAlign="center">
                    <Text color="gray.400">No initiative order set</Text>
                    <Text fontSize="sm" mt={2} color="gray.400">
                        Use the roll initiative button in the toolbar to set initiative order
                    </Text>
                </Box>
            )}
        </Box>
    );
};

export default InitiativeTracker;