import React, { useState } from "react";
import {
    Heading,
    Button,
    Select,
    Stack,
    Flex,
    Badge,
    Text,
} from "@chakra-ui/react";
import useParticipantsStore from "@/state/participantsStore";
import { nanoid } from "nanoid"; // For generating unique IDs

// Star Wars-themed name pools for PCs and NPCs
const PC_NAMES = [
    "Luke Skywalker",
    "Leia Organa",
    "Han Solo",
    "Obi-Wan Kenobi",
    "Yoda",
    "Darth Vader",
    "Ahsoka Tano",
    "Kylo Ren",
    "Rey Skywalker",
    "Mace Windu",
];

const NPC_NAMES = [
    "Stormtrooper",
    "Jabba the Hutt",
    "Boba Fett",
    "Tusken Raider",
    "R2-D2",
    "C-3PO",
    "Wookiee",
    "Ewok",
    "Bantha",
    "Sith Lord",
];

// Helper function to get a random name
const getRandomName = (isPC: boolean): string => {
    const names = isPC ? PC_NAMES : NPC_NAMES;
    return names[Math.floor(Math.random() * names.length)];
};

const ParticipantManager: React.FC = () => {
    const { participants, addParticipant, removeParticipant } =
        useParticipantsStore();

    const [newParticipantType, setNewParticipantType] = useState("PC");

    const handleAddParticipant = () => {
        const isPC = Math.random() < 0.4

        // Create a new participant with a randomly assigned Star Wars-themed name
        const newParticipant = {
            id: nanoid(),
            name: getRandomName(newParticipantType === "PC"), // Assign random name
            isPC
        };

        addParticipant(newParticipant); // Add the participant to the store
    };

    const handleRemoveParticipant = (id: string) => {
        removeParticipant(id); // Remove participant by ID
    };

    return (
        <Stack spacing={4} mt={4}>
            {/* Add Participant */}
            <Heading as="h3" size="md" mt={2} mb={2}>
                Add Random Star Wars Participant
            </Heading>
            <Button colorScheme="blue" onClick={handleAddParticipant}>
                Add Random Participant
            </Button>

            {/* Star Wars Participants List */}
            <Heading as="h3" size="md" mt={4} mb={2}>
                Active Participants
            </Heading>
            {participants.length > 0 ? (
                <Stack spacing={2}>
                    {participants.map((participant) => (
                        <Flex
                            key={participant.id}
                            justify="space-between"
                            align="center"
                            p={2}
                            borderWidth="1px"
                            borderRadius="md"
                            boxShadow="sm"
                        >
                            <Flex align="center">
                                <Badge
                                    colorScheme={participant.isPC ? "green" : "purple"}
                                    mr={2}
                                >
                                    {participant.isPC ? "PC" : "NPC"}
                                </Badge>
                                <Text>{participant.name}</Text> {/* Display assigned name */}
                            </Flex>
                            <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleRemoveParticipant(participant.id)}
                            >
                                Remove
                            </Button>
                        </Flex>
                    ))}
                </Stack>
            ) : (
                <Text>No participants currently active.</Text>
            )}
        </Stack>
    );
};

export default ParticipantManager;