import React, { useState } from 'react';
import { Select, Box, Text } from '@chakra-ui/react';
import {Character} from "@/state/characterStore";

// Define the available characters (constant array)
const availableCharacters: Character[] = [
  { id: '1', name: 'Alice', strain: 0, maxStrain: 4, wounds: 0, maxWounds: 10},
  { id: '2', name: 'Bob', strain: 0, maxStrain: 4, wounds: 0, maxWounds: 10},
  { id: '3', name: 'Charlie', strain: 0, maxStrain: 4, wounds: 0, maxWounds: 10},
  { id: '4', name: 'Diana', strain: 0, maxStrain: 4, wounds: 0, maxWounds: 10},
  { id: '5', name: 'Eve', strain: 0, maxStrain: 4, wounds: 0, maxWounds: 10},
];

const CharacterDropdown: React.FC = () => {
  // State to track the selected character
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  // Handle selection change
  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Find the selected character based on its id
    const selected = availableCharacters.find((char) => char.id === event.target.value);
    setSelectedCharacter(selected || null);
  };

  return (
    <Box>
      {/* Dropdown to select a character */}
      <Select
        placeholder="Select a character"
        size="md"
        value={selectedCharacter?.id || ''}
        onChange={handleSelectionChange}
      >
        {availableCharacters.map((character) => (
          <option key={character.id} value={character.id}>
            {character.name}
          </option>
        ))}
      </Select>
    </Box>
  );
};

export default CharacterDropdown;