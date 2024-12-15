import React from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import useCharacterStore from '@/state/characterStore'; // Zustand store

const Character = () => {

    const initiative = useCharacterStore(
        (state) => state.getActiveCharacter()?.initiative
    );

    const name = useCharacterStore(
        (state) => state.getActiveCharacter()?.name
    );

    const id = useCharacterStore(
        (state) => state.getActiveCharacter()?.id
    );

    // If no characters exist in the store
    if (!name) {
        return (
            <Box p={4} bg="gray.700" borderRadius="md" boxShadow="md">
                <Text color="gray.300">No active character available!</Text>
            </Box>
        );
    }

    return (
        <Box p={4} bg="gray.700" borderRadius="md" boxShadow="md">
            <VStack align="start" spacing={2}>
                <Text fontSize="xl" fontWeight="bold" color="teal.200">Active Character:</Text>
                <Text fontSize="lg" color="white">Name: {name}</Text>
                <Text fontSize="lg" color="white">ID: {id}</Text>
                <Text fontSize="lg" color="white">Initiative: {initiative}</Text>
                {/* Add other character details here */}
            </VStack>
        </Box>
    );
};

export default Character;