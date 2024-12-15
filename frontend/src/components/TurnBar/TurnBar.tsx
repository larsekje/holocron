import React from 'react';
import useCharacterStore from '@/state/characterStore';
import useGameStore, {Phase} from "@/state/gameStore";
import {Button, HStack, } from "@chakra-ui/react";
import {nanoid} from "nanoid";
import InitiativeSlots from "@components/TurnBar/InitiativeSlots";
import {Character} from "@/features/character/Character";

const TurnBar: React.FC = () => {
  const turn = useGameStore((state) => state.activeTurnIndex); // Getting the current turn
  const currentPhase = useGameStore((state) => state.phase);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const transitionTo = useGameStore((state) => state.transitionTo);

  const addCharacter = useCharacterStore((state) => state.addCharacter);
  const updateCharacters = useCharacterStore((state) => state.updateCharacters);

  // Event handler for adding a predefined character
  const handleAddCharacter = () => {
    const newCharacter = new Character("New character", Math.random() < 0.4);
    addCharacter(newCharacter);
    console.log(`${newCharacter.name} added to the game!`);
  };

  const handleRollInititive = () => {
    updateCharacters(
      (character) => !character.isPlayer, // Condition: Only NPCs
      (character) => ({
        initiative: character.rollInitiative(), // Dynamically call rollInitiative
      })
    );
  }

  return (
    <HStack>
      <Button className="turn-button" onClick={nextTurn}>
        Next Turn
      </Button>

      <span className="phase-text">Phase: {currentPhase}</span>
      <span className="phase-text">Turn: {turn}</span>

      {/* Add Predefined Character Button */}
      <Button
        colorScheme="teal"
        size="md"
        onClick={handleAddCharacter}
      >
        Add Predefined Character
      </Button>

      <Button colorScheme="facebook" onClick={handleRollInititive}>
        Roll initiative
      </Button>

      {<InitiativeSlots/>}

    </HStack>
  );
};

export default TurnBar;