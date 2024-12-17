import create from "zustand";
import EventBus from "@/utils/events";

export interface Participant {
    id: string;
    name: string;
    isPC: boolean;
    initiative?: number | null; // Can be number | undefined OR number | null
    stats?: { [key: string]: number };
}

// Zustand Store
interface ParticipantStore {
    participants: Participant[];
    addParticipant: (participant: Participant) => void;
    removeParticipant: (id: string) => void;
    updateParticipants: (updatedParticipants: Participant[]) => void;
}

const useParticipantStore = create<ParticipantStore>((set) => ({
    participants: [],
    addParticipant: (participant) => {
        set((state) => ({ participants: [...state.participants, participant] }));

        // Emit the event when a participant is added
        EventBus.emit("participant-added", participant);
    },
    removeParticipant: (id) =>
        set((state) => ({
            participants: state.participants.filter((p) => p.id !== id),
        })),
    updateParticipants: (updatedParticipants) =>
        set(() => ({ participants: updatedParticipants })),
}));

export default useParticipantStore;