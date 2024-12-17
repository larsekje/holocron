import { nanoid } from "nanoid";

// Star Wars-themed name pools for PCs and NPCs
const PC_NAMES = [
    "Luke Skywalker",
    "Leia Organa",
    "Han Solo",
    "Obi-Wan Kenobi",
    "Yoda",
    "Darth Vader",
    "Ahsoka Tano",
    "Kylo Ren",
    "Rey Skywalker",
    "Mace Windu",
];

const NPC_NAMES = [
    "Stormtrooper",
    "Jabba the Hutt",
    "Boba Fett",
    "Tusken Raider",
    "R2-D2",
    "C-3PO",
    "Wookiee",
    "Ewok",
    "Bantha",
    "Sith Lord",
];

// Helper function to get a random name
const getRandomName = (isPC: boolean): string => {
    const names = isPC ? PC_NAMES : NPC_NAMES;
    return names[Math.floor(Math.random() * names.length)];
};

// Reusable utility function to create a new participant
export const createRandomParticipant = (type: string) => {
    const isPC = type === "PC"; // Check if the type is PC
    return {
        id: nanoid(),
        name: getRandomName(isPC), // Assign random name based on type
        isPC,
    };
};