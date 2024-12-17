import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Stack,
    Flex,
    Text,
    Badge,
    Input,
} from "@chakra-ui/react";
import {Participant} from "@/state/participantsStore";

interface InitiativeModalProps {
    isOpen: boolean; // Controls when the modal is displayed
    participants: Participant[]; // List of all participants (PC & NPC)
    onClose: () => void; // Function to close the modal
    onSubmit: (updatedParticipants: Participant[]) => void; // Callback function to return updated participants
}

// Rolls a random initiative for NPCs
const rollForNPCInitiative = (): number => Math.floor(Math.random() * 20) + 1;

const InitiativeModal: React.FC<InitiativeModalProps> = ({
                                                             isOpen,
                                                             participants,
                                                             onClose,
                                                             onSubmit,
                                                         }) => {
    const [initiatives, setInitiatives] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isOpen) {
            // Automatically roll NPC initiatives when the modal opens
            const newInitiatives = { ...initiatives };
            participants.forEach((participant) => {
                if (!participant.isPC) {
                    // NPC rolls automatically
                    newInitiatives[participant.id] = rollForNPCInitiative();
                }
            });
            setInitiatives(newInitiatives); // Initialize initiatives state
        }
    }, [isOpen, participants]);

    const handlePCInitiativeChange = (id: string, value: string) => {
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue)) {
            setInitiatives((prev) => ({
                ...prev,
                [id]: numericValue,
            }));
        }
    };

    const handleSubmit = () => {
        // Merge initiatives into participants data and return it via onSubmit callback
        const updatedParticipants = participants.map((participant) => ({
            ...participant,
            initiative: initiatives[participant.id] || null,
        }));
        onSubmit(updatedParticipants); // Pass updated participants to parent
        onClose(); // Close the modal
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Roll for Initiative</ModalHeader>

                <ModalBody>
                    <Stack spacing={4}>
                        {/* Iterate over all participants to display their initiative details */}
                        {participants.map((participant) => (
                            <Flex
                                key={participant.id}
                                justify="space-between"
                                align="center"
                                p={2}
                                borderWidth="1px"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Flex align="center">
                                    <Badge
                                        colorScheme={participant.isPC ? "green" : "purple"}
                                        mr={2}
                                    >
                                        {participant.isPC ? "PC" : "NPC"}
                                    </Badge>
                                    <Text>{participant.name}</Text>
                                </Flex>

                                {/* PC Handling: Input field for manual initiative */}
                                {participant.isPC ? (
                                    <Input
                                        placeholder="Enter initiative"
                                        size="sm"
                                        width="100px"
                                        value={initiatives[participant.id] || ""}
                                        onChange={(e) =>
                                            handlePCInitiativeChange(participant.id, e.target.value)
                                        }
                                    />
                                ) : (
                                    // NPC Handling: Display rolled initiative
                                    <Text>
                                        Rolled: <strong>{initiatives[participant.id]}</strong>
                                    </Text>
                                )}
                            </Flex>
                        ))}
                    </Stack>
                </ModalBody>

                <ModalFooter>
                    <Button
                        colorScheme="blue"
                        mr={3}
                        onClick={handleSubmit}
                        isDisabled={participants.some(
                            (p) => p.isPC && !initiatives[p.id] // Check if all PCs have filled their initiatives
                        )}
                    >
                        Confirm
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default InitiativeModal;