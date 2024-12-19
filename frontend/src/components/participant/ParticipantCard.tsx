import React from "react";
import { Box, Text, VStack } from "@chakra-ui/react";
import { Participant } from "@/state/participantsStore";

interface ParticipantCardProps {
    participant: Participant;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant }) => {
    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            padding={4}
            shadow="md"
            bg={participant.isPC ? "blue.50" : "gray.50"} // Differentiate PCs from NPCs
        >
            <VStack align="start" spacing={2}>
                <Text fontSize="xl" fontWeight="bold">
                    {participant.name}
                </Text>
                {participant.initiative !== null && (
                    <Text fontSize="sm">Initiative: {participant.initiative}</Text>
                )}
            </VStack>
        </Box>
    );
};

export default ParticipantCard;