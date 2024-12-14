import create from 'zustand';

export interface Character {
  id: string; // Unique character ID
  name: string; // Character name
  strain: number; // Current strain level
  maxStrain: number; // Maximum strain
  wounds: number; // Current wound level
  maxWounds: number; // Maximum wounds
  equipment: string[]; // List of equipment
  skills: Record<string, number>; // Skills with rank (e.g., {'Pilot': 2, 'Mechanics': 1})
  destinyPoints: number; // Destiny points available
}

interface CharacterStore {
  characters: Character[]; // List of all characters
  activeCharacterId: string | null; // The currently active character ID
  addCharacter: (character: Character) => void; // Add a new character
  removeCharacter: (id: string) => void; // Remove a character by ID
  updateCharacter: (id: string, updates: Partial<Character>) => void; // Update an existing character
  getCharacter: (id: string) => Character | undefined; // Get character by ID
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
  updateCharacter: (id, updates) => {
    set((state) => ({
      characters: state.characters.map((char) =>
        char.id === id ? { ...char, ...updates } : char
      ),
    }));
    console.log(`Character with ID ${id} updated.`);
  },

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