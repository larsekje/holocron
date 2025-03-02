import React from "react";
import {
    Box,
    Text,
    Heading,
    Stack,
    Badge,
    Divider,
    Switch,
    Flex, HStack, Button,
} from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantsStore from "@/state/participantsStore";
import {createRandomParticipant} from "@/utils/participantUtils";
import {InitiativeSlot} from "@/types/initiativeSlot";
import {Participant} from "@/state/participantsStore";

const GameplayInfo: React.FC = () => {
    const { 
        state, 
        context, 
        isTurnBased: turnBased, 
        toggleMode: toggleTurnBased, 
        setActiveParticipantId, 
        getCurrentTurnState, 
        getTurnStateDescription,
        advanceTurn,
        transition,
        setInitiativeModalOpen,
        setInitiativeOrder
    } = useGameplayStore();
    const { activeParticipantId} = useGameplayStore((state) => state.context);
    const { participants, addParticipant, removeParticipant } = useParticipantsStore();

    const mode = context.mode;
    const turnState = getCurrentTurnState();

    const handleAddRandomParticipant = () => {
        const isPC = Math.random() < 0.4
        const newParticipant = createRandomParticipant(isPC ? "PC" : "NPC");
        addParticipant(newParticipant); // Add the participant to the store
    };

    const handleInitTest = () => {
        // 1. Add 3 characters (2 PCs and 1 NPC)
        const pc1 = createRandomParticipant("PC");
        const pc2 = createRandomParticipant("PC");
        const npc = createRandomParticipant("NPC");
        
        // Generate random initiatives for all characters
        const updatedParticipants: Participant[] = [
            { ...pc1, initiative: Math.floor(Math.random() * 20) + 1 },
            { ...pc2, initiative: Math.floor(Math.random() * 20) + 1 },
            { ...npc, initiative: Math.floor(Math.random() * 20) + 1 }
        ];
        
        // Add the participants to the store
        updatedParticipants.forEach(p => addParticipant(p));
        
        // Now directly set the initiative order (bypassing the modal)
        transition('ENTER_STRUCTURED');
        transition('ROLL_INITIATIVE');
        
        // Map participants to InitiativeSlot[] shape and sort them
        const order = updatedParticipants
            .map((p) => ({
                team: p.isPC ? "PC" : "NPC",
                initiative: p.initiative!,
                name: p.name
            }))
            .sort((a, b) => b.initiative - a.initiative) as InitiativeSlot[]; // Sort descending
            
        setInitiativeOrder(order); // Update store
        
        transition('START_ENCOUNTER');
        
        // Explicitly start the turn sequence
        setTimeout(() => {
            transition('START_TURN');
        }, 100);
    };

    const handleSetActive = (participantId: string) => {
        setActiveParticipantId(participantId); // Update active participant in gameplayStore
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            maxWidth="400px"
            mx="auto"
            bg="gray.50"
            boxShadow="md"
        >
            <Heading as="h2" size="lg" mb={4} textAlign="center">
                Gameplay Information
            </Heading>
            <Stack spacing={3}>
                {/* Display Gameplay Mode */}
                <Box>
                    <Text fontWeight="bold">Mode:</Text>
                    <Badge colorScheme="blue" fontSize="md" mt={1} marginRight={2}>
                        {mode}
                    </Badge>
                    <Badge colorScheme="yellow" fontSize="md" mt={1}>
                        {state}
                    </Badge>
                </Box>

                {/* Display Turn State */}
                {turnState && (
                    <Box>
                        <Text fontWeight="bold">Turn Phase:</Text>
                        <Badge 
                            colorScheme={
                                turnState === 'turn_start' ? "green" : 
                                turnState === 'turn_active' ? "blue" : 
                                "purple"
                            } 
                            fontSize="md" 
                            mt={1}
                        >
                            {getTurnStateDescription()}
                        </Badge>
                        
                        {/* Removed the turn progress buttons since we're using the toolbar Next button */}
                    </Box>
                )}

                {/* Round Information */}
                <Box>
                    <Text fontWeight="bold">Round:</Text>
                    <Text>{context.round}</Text>
                </Box>

                {/* Turn-Based Mode Toggle */}
                <Box>
                    <Flex align="center" justify="space-between">
                        <Text fontWeight="bold">Turn-Based:</Text>
                        <Switch
                            colorScheme="green"
                            isChecked={context.mode === "structured"}
                            onChange={toggleTurnBased}
                        />
                    </Flex>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                        {context.mode === "structured" ? "Turn-Based is enabled" : "Turn-Based is disabled"}
                    </Text>
                </Box>
            </Stack>

            <Divider my={4} />

            {/* Participant List */}
            <HStack justify="space-between">
                <Heading as="h3" size="md" mt={2} mb={2}>
                    Participants
                </Heading>
                <HStack>
                    <Button colorScheme="green" size="xs" onClick={handleAddRandomParticipant}>Add</Button>
                    <Button colorScheme="blue" size="xs" onClick={handleInitTest}>Init Test</Button>
                </HStack>
            </HStack>

            {participants.length > 0 ? (
                <Stack spacing={2}>
                    {participants.map((participant) => (
                        <Flex
                            key={participant.id}
                            align="center"
                            bg={participant.id === activeParticipantId ? "teal.100" : "transparent"}
                            borderRadius="md"
                            p={2}
                            _hover={{ cursor: "pointer", bg: "teal.200" }}
                            onClick={() => handleSetActive(participant.id)}
                        >
                             <Badge
                                colorScheme={participant.isPC ? "green" : "purple"}
                                mr={2}
                            >
                                {participant.isPC ? "PC" : "NPC"}
                            </Badge>
                            <Badge>{participant.initiative}</Badge>
                            <Text mr={2}>{participant.name}</Text>
                            <Button
                                size="xs"
                                ml="auto"
                                colorScheme="red"
                                opacity={0}
                                _hover={{ opacity: 1 }}
                                transition="opacity 0.2s ease-in-out"
                                onClick={() => removeParticipant(participant.id)}
                            >
                                REMOVE
                            </Button>
                        </Flex>
                    ))}
                </Stack>
            ) : (
                <Text>No participants currently active.</Text>
            )}
        </Box>
    );
};

export default GameplayInfo;