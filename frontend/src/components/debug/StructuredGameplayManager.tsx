import React, { useState } from "react";
import { Box, Button, Heading, VStack, Text } from "@chakra-ui/react";
import useGameplayStore, {InitiativeSlot} from "@/state/gameplayStore";
import InitiativeModal from "./InitiativeModal";
import useParticipantsStore, {Participant} from "@/state/participantsStore";
import InitiativeList from "@components/debug/InitiativeList";
import InitiativeTracker from "@components/debug/InitiativeTracker"; // Hypothetical participants store

const StructuredGameplayManager: React.FC = () => {
    // Fetch participants from a participants store
    const participants = useParticipantsStore((state) => state.participants);

    const initiativeOrder = useGameplayStore((state) => state.initiativeOrder);
    const setInitiativeOrder = useGameplayStore((state) => state.setInitiativeOrder);
    const mode = useGameplayStore((state) => state.mode);

    const [isModalOpen, setModalOpen] = useState(false);

    const handleOpenModal = () => {
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleSetInitiative = (updatedParticipants: Participant[]) => {
        // Map participants to InitiativeSlot[] shape and sort them
        const order = updatedParticipants
            .filter((p) => p.initiative !== null) // Ensure all initiatives are present
            .map((p) => ({
                team: p.isPC ? "PC" : "NPC", // Map to the store's type
                initiative: p.initiative!,
            }))
            .sort((a, b) => b.initiative - a.initiative) as InitiativeSlot[]; // Sort descending

        setInitiativeOrder(order); // Update store
    };

    if (mode !== "structured") return (
        <Box>
            <Heading>Initiative Order</Heading>
            <Text>This feature is only available in structured gameplay.</Text>
        </Box>
    )

    return (
        <Box>
            <Heading>Initiative Order</Heading>
            <InitiativeTracker initiativeOrder={initiativeOrder} participants={participants}/>
            <Button colorScheme="blue" mt={4} onClick={handleOpenModal}>
                Set Initiative
            </Button>

            <InitiativeModal
                isOpen={isModalOpen}
                participants={participants} // Pass current participants
                onClose={handleCloseModal}
                onSubmit={handleSetInitiative} // Handle initiative updates
            />
        </Box>
    );
};

export default StructuredGameplayManager;