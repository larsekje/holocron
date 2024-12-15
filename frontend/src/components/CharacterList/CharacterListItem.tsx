import React from 'react';
import { HStack, Text, Button, VStack } from '@chakra-ui/react';
import {Character} from "@/features/character/Character";
import useCharacterStore from "@/state/characterStore";



interface Props {
  id: string; // The character data to display
}

const CharacterListItem: React.FC<Props> = ({ id }) => {

  const character = useCharacterStore((state) => state.getCharacter(id));
  const updateCharacter = useCharacterStore((state) => state.updateCharacter);
  const setActiveCharacter = useCharacterStore((state) => state.setActiveCharacter);

  console.log("CharacterListItem", character);

  if (!character) return null;

  const handleRollInitiative = () => {
    console.log("Roll Initiative");

    // Use immutable update principles
    const newInitiative = character.rollInitiative();
    console.log("New Initiative:", newInitiative);

    updateCharacter(character.id, { ...character, initiative: newInitiative });
  };

  const handleSetActive = () => {
    console.log("Set Active Character to id:", id);
    setActiveCharacter(id);
  }

  return (
    <HStack
      justifyContent="space-between"
      bg="gray.800"
      p={3}
      borderRadius="md"
      boxShadow="sm"
      w="100%"
    >
      {/* Character Info */}
      <VStack align="start" spacing={0}>
        <Text fontSize="md" fontWeight="bold" color="white">
          {character.name}
        </Text>
        <Text fontSize="sm" color="gray.400">
          ID: {character.id}
        </Text>
        {/* Add more info here if needed */}
      </VStack>

      {character.isPlayer && (
        <Button onClick={handleRollInitiative}>
          Roll Initiative
        </Button>
      )}

      <Button onClick={handleSetActive}>
        Active
      </Button>

      <Text fontSize="md" fontWeight="bold" color="white">
        {character.initiative}
      </Text>

      <Text fontSize="md" fontWeight="bold" color="white">
        {character.isPlayer ? "PC" : "NPC"}
      </Text>

    </HStack>
  );
};

export default CharacterListItem;