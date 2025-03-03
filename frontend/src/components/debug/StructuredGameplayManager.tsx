import React, { useState } from "react";
import { Box, Button, Heading, VStack, Text } from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";
import InitiativeModal from "./InitiativeModal";
import useParticipantsStore, {Participant} from "@/state/participantsStore";
import InitiativeList from "@components/debug/InitiativeList";
import InitiativeTracker from "@components/debug/InitiativeTracker";
import {ParticipantsList} from "@components/debug/ParticipantsList";
import ParticipantStatusList from "@components/participantStatus/ParticipantStatusList";

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

    if (mode !== "structured") return (
        <ParticipantsList/>
    )

    return (
        <Box>
            <InitiativeModal
                isOpen={isModalOpen}
                participants={participants} // Pass current participants
                onClose={handleCloseModal}
                onSubmit={handleSetInitiative} // Handle initiative updates
            />

            <ParticipantStatusList/>
        </Box>

    );
};

export default StructuredGameplayManager;