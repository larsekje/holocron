export interface InitiativeSlot {
    team: "PC" | "NPC"; // Team who owns the slot
    initiative: number; // Initiative value rolled
    used?: boolean; // Optional flag to indicate if the slot has been used
    name?: string;
}