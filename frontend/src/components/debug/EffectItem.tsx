import React from 'react';
import {Badge, Box, Button, Divider, HStack, Input, Stack, Text} from "@chakra-ui/react";
import {Effect, ParticipantEffect} from "@/types/effect";

interface Props {
    effect: ParticipantEffect;
}

const EffectItem: React.FC<Props> = ({ effect }) => {
    return (
        <Box
            key={effect.id}
            borderWidth="1px"
            borderRadius="md"
            p={4}
            bg="gray.50"
            _hover={{ bg: "gray.100" }}
            shadow="sm"
        >
            {/* Header Section */}
            <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    {effect.name}
                </Text>
                <Badge colorScheme="purple">{effect.type}</Badge>
            </HStack>

            {/* Effect Description */}
            <Text fontSize="sm" mt={2}>
                {effect.description}
            </Text>

            <Divider my={2} />

            {/* Metadata: Trigger, Scope, Target */}
            <Stack spacing={1} fontSize="sm">
                <Text>
                    <strong>Trigger:</strong> {effect.trigger}
                </Text>
                <Text>
                    <strong>Scope:</strong> {effect.scope}
                </Text>
                {effect.target && (
                    <Text>
                        <strong>Target:</strong> {effect.target.participantId ? "Specific Participant" : "N/A"}
                    </Text>
                )}
            </Stack>

            <Divider my={2} />

            {/* Customization Input Fields */}
            <HStack justify="space-between">
                {/* Apply Button */}
                <Button colorScheme="blue" size="sm" onClick={() => console.log(effect)}>
                    Apply
                </Button>
            </HStack>
        </Box>
    );
}

export default EffectItem;