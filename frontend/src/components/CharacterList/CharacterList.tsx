import React, {useMemo} from "react";
import { Box, VStack, Text } from "@chakra-ui/react";
import useCharacterStore from "@/state/characterStore";
import CharacterListItem from "./CharacterListItem";
import {shallow} from "zustand/shallow";

const CharacterList = () => {
  // const characters = useCharacterStore((state) => state.characters);

  const characterIds = useCharacterStore(
      (state) => Object.values(state.characters).map(character => character.id),
      shallow // Zustand's shallow selector
  );

  console.log("characterIds", characterIds);

  const memoizedIds = useMemo(() => characterIds, [characterIds]);

  // const characters = useCharacterStore((state) =>
  //   [...state.characters].sort((a, b) => b.initiative - a.initiative)
  // );

  // If the list is empty
  if (!memoizedIds || memoizedIds.length === 0) {
    return (
      <Box p={4} bg="gray.700" borderRadius="md" boxShadow="md">
        <Text color="gray.300">No characters to display!</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={4} p={4} bg="gray.700" borderRadius="md" boxShadow="md">
      {memoizedIds.map((id) => (
        <CharacterListItem key={id} id={id} />
      ))}
    </VStack>
  );
};

export default CharacterList;