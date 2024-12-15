import create from 'zustand';
import {Character} from "@/features/character/Character";


interface CharacterStore {
  characters: Character[]; // List of all characters
  activeCharacterId: string | null; // The currently active character ID
  addCharacter: (character: Character) => void; // Add a new character
  removeCharacter: (id: string) => void; // Remove a character by ID
  updateCharacter: (id: string, updates: Partial<Character>) => void; // Update an existing character
  updateCharacters: (
    condition: (character: Character) => boolean,
    updates: Partial<Character> | ((character: Character) => Partial<Character>)
  ) => void;  getCharacter: (id: string) => Character | undefined; // Get character by ID
  setActiveCharacter: (id: string) => void; // Set the active character
  adjustStrain: (id: string, amount: number) => void; // Adjust strain points
  adjustWounds: (id: string, amount: number) => void; // Adjust wounds
}

const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  activeCharacterId: null,

  // Add a new character
  addCharacter: (character) => {
    set((state) => ({
      characters: [...state.characters, character],
    }));
    console.log(`Character ${character.name} added.`);
  },

  // Remove a character by ID
  removeCharacter: (id) => {
    set((state) => ({
      characters: state.characters.filter((char) => char.id !== id),
    }));
    console.log(`Character with ID ${id} removed.`);
  },

  // Update a character by ID
  updateCharacter: (id: string, updates: Partial<Character>) =>
    set((state) => ({
      characters: state.characters.map((character) =>
        character.id === id
          ? { ...character, ...updates }
          : character
      ),
    })),

  // Generic function for updating characters based on a condition
  updateCharacters: (
    condition: (character: Character) => boolean,
    updates: Partial<Character> | ((character: Character) => Partial<Character>)
  ) =>
    set((state) => ({
      characters: state.characters.map((character) =>
        condition(character)
          ? {
            ...character,
            ...(typeof updates === "function" ? updates(character) : updates), // Handle both static and dynamic updates
          }
          : character
      ),
    })),
  
  // Get a character by ID
  getCharacter: (id) => {
    return get().characters.find((char) => char.id === id);
  },

  // Set the active character
  setActiveCharacter: (id) => {
    set(() => ({ activeCharacterId: id }));
    console.log(`Active character set to ID: ${id}`);
  },

  // Adjust strain points
  adjustStrain: (id, amount) => {
    const character = get().getCharacter(id);
    if (character) {
      const newStrain = Math.min(Math.max(character.strain + amount, 0), character.maxStrain);
      get().updateCharacter(id, { strain: newStrain });
      console.log(
        `Adjusted strain for ${character.name} by ${amount}. New strain: ${newStrain}`
      );
    } else {
      console.warn(`Character with ID ${id} not found.`);
    }
  },

  // Adjust wounds
  adjustWounds: (id, amount) => {
    const character = get().getCharacter(id);
    if (character) {
      const newWounds = Math.min(Math.max(character.wounds + amount, 0), character.maxWounds);
      get().updateCharacter(id, { wounds: newWounds });
      console.log(
        `Adjusted wounds for ${character.name} by ${amount}. New wounds: ${newWounds}`
      );
    } else {
      console.warn(`Character with ID ${id} not found.`);
    }
  },
}));

export default useCharacterStore;