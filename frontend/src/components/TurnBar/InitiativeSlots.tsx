import React from "react";
import {VStack, Text, Box, HStack} from "@chakra-ui/react";
import useCharacterStore from "@/state/characterStore";

const InitiativeSlots = () => {
  // Retrieve characters from Zustand store
  const characters = useCharacterStore((state) =>
    state.characters.map(({ initiative, isPlayer }) => ({ initiative, isPlayer }))
  );

  // Group and sort initiative slots
  const initiativeSlots = [...characters]
    .sort((a, b) => b.initiative - a.initiative) // Sort by initiative (highest first)
    .map((character) => (character.isPlayer ? "PC" : "NPC")); // Map to PC or NPC slots

  return (
    <HStack align="stretch" spacing={4} bg="gray.700" borderRadius="md" boxShadow="md" mt={4}>
      {initiativeSlots.map((slot, index) => (
        <Box
          key={index}
          p={2}
          bg={slot === "PC" ? "blue.600" : "red.600"} // Different colors for PC and NPC
          borderRadius="md"
          textAlign="center"
        >
          <Text fontSize="md" fontWeight="bold" color="white">
            {slot}
          </Text>
        </Box>
      ))}
    </HStack>
  );
};

export default InitiativeSlots;