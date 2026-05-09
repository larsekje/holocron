export interface InitiativeSlot {
    team: "PC" | "NPC"; // Team who owns the slot
    initiative: number; // Initiative value rolled
    used?: boolean; // Optional flag to indicate if the slot has been used
    name?: string; // Display name (kept for tooltips); for matching prefer participantId
    participantId?: string; // Stable id of the participant assigned to this slot
}