export interface HistoryEvent {
  timestamp: number; // When the event was logged
  message: string; // A brief description of the event
  snapshot?: any; // (Optional) A snapshot of the game/combat state at the time
}