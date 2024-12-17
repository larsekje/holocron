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
import useGameplayStore from "@/state/gameplayStore";
import useParticipantsStore from "@/state/participantsStore";
import {createRandomParticipant} from "@/utils/participantUtils";

const GameplayInfo: React.FC = () => {
    const { mode, turnBased, skillChallengeActive, toggleTurnBased } =
        useGameplayStore();
    const { participants, addParticipant, removeParticipant } = useParticipantsStore();

    const handleAddRandomParticipant = () => {
        const isPC = Math.random() < 0.4
        const newParticipant = createRandomParticipant(isPC ? "PC" : "NPC");
        addParticipant(newParticipant); // Add the participant to the store
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
                    <Badge colorScheme="blue" fontSize="md" mt={1}>
                        {mode}
                    </Badge>
                </Box>

                {/* Turn-Based Mode Toggle */}
                <Box>
                    <Flex align="center" justify="space-between">
                        <Text fontWeight="bold">Turn-Based:</Text>
                        <Switch
                            colorScheme="green"
                            isChecked={turnBased}
                            onChange={toggleTurnBased}
                        />
                    </Flex>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                        {turnBased ? "Turn-Based is enabled" : "Turn-Based is disabled"}
                    </Text>
                </Box>

                {/* Display Skill Challenge Status */}
                <Box>
                    <Text fontWeight="bold">Skill Challenge Active:</Text>
                    <Badge
                        colorScheme={skillChallengeActive ? "green" : "red"}
                        fontSize="md"
                        mt={1}
                    >
                        {skillChallengeActive ? "Yes" : "No"}
                    </Badge>
                </Box>
            </Stack>

            <Divider my={4} />

            {/* Participant List */}
            <HStack justify="space-between">
                <Heading as="h3" size="md" mt={2} mb={2}>
                    Participants
                </Heading>
                <Button colorScheme="green" size="xs" onClick={handleAddRandomParticipant}>Add</Button>
            </HStack>

            {participants.length > 0 ? (
                <Stack spacing={2}>
                    {participants.map((participant) => (
                        <Flex key={participant.id} align="center">
                            <Badge
                                colorScheme={participant.isPC ? "green" : "purple"}
                                mr={2}
                            >
                                {participant.isPC ? "PC" : "NPC"}
                            </Badge>
                            <Text>{participant.name}</Text>
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