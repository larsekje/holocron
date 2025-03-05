import React, { useState } from "react";
import { Box } from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantsStore, {Participant} from "@/state/participantsStore";
import ContentCardTargets from "@components/ContentCardTargets";
import InitiativeModal from "./InitiativeModal";
import InitiativeTracker from "@components/debug/InitiativeTracker";

const StructuredGameplayManager: React.FC = () => {
    // Fetch participants from a participants store
    const participants = useParticipantsStore((state) => state.participants);

    const initiativeOrder = useGameplayStore((state) => state.context.initiativeOrder);
    const setInitiativeOrder = useGameplayStore((state) => state.setInitiativeOrder);
    const mode = useGameplayStore((state) => state.context.mode);

    const [isModalOpen, setModalOpen] = useState(false);

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleSetInitiative = (updatedParticipants: Participant[]) => {
        // Map participants to InitiativeSlot[] shape and sort them
    };

    // Use ContentCardTargets for both structured and non-structured modes
    return (
        <Box height="100%">
            {/* Initiative Modal for setting initiative order */}
            <InitiativeModal
                isOpen={isModalOpen}
                participants={participants}
                onClose={handleCloseModal}
                onSubmit={handleSetInitiative}
            />

            {/* ContentCardTargets for both modes */}
            <ContentCardTargets />
        </Box>
    );
};

export default StructuredGameplayManager;   