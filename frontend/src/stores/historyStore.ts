import create from 'zustand';
import {HistoryEvent} from "@/types/historyEvent";


interface HistoryStore {
  events: HistoryEvent[]; // The list of logged events
  addEvent: (message: string, snapshot?: any) => void; // Add a new log entry
  clearHistory: () => void; // Clear all history
  getLatestEvent: () => HistoryEvent | null; // Retrieve the latest event
  getFullHistory: () => HistoryEvent[]; // Retrieve all events
}

// Zustand store definition
export const useHistoryStore = create<HistoryStore>((set, get) => ({
  events: [],

  // Add a new history event
  addEvent: (message, snapshot) => {
    if (!message || typeof message !== 'string') {
      console.error('[History] Invalid event message provided.');
      return;
    }

    set((state) => ({
      events: [
        ...state.events,
        {
          timestamp: Date.now(),
          message,
          snapshot: snapshot ?? null,
        },
      ],
    }));

    console.log(`[History] Event logged: ${message}`);
  },

  // Clears the history log
  clearHistory: () => {
    set({ events: [] });
    console.log('[History] History has been cleared.');
  },

  // Get the latest logged event
  getLatestEvent: () => {
    const { events } = get(); // Gets the current state of the store
    return events.length > 0 ? events[events.length - 1] : null;
  },

  // Retrieve all events
  getFullHistory: () => {
    const { events } = get(); // Gets the current state of the store
    return events;
  },
}));