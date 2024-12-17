import React, { useState } from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
    Text,
    Switch,
    Button,
    Box,
    Flex,
} from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";

interface EndEncounterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: { removeDeadNpcs: boolean; removeAllNpcs: boolean }) => void;
}

const EndEncounterModal: React.FC<EndEncounterModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 onConfirm,
                                                             }) => {
    const [removeDeadNpcs, setRemoveDeadNpcs] = useState(true); // Default to true
    const [removeAllNpcs, setRemoveAllNpcs] = useState(false); // Default to false

    const transition  = useGameplayStore((state) => state.transition);

    const handleConfirm = () => {
        // Pass both "removeDeadNpcs" and "removeAllNpcs" options back to the parent
        onConfirm({ removeDeadNpcs, removeAllNpcs });
        onClose(); // Close the modal
        transition('END_ENCOUNTER');
        transition("RESET");
        transition("EXIT_STRUCTURED");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>End Encounter</ModalHeader>
                <ModalBody>
                    <Stack spacing={4}>
                        {/* GM Reminder Section */}
                        <Box bg="gray.100" p={4} borderRadius="md">
                            <Text fontWeight="bold">GM Reminder</Text>
                            <Stack spacing={2}>
                                <Text>- Players can attempt a Simple (—) Discipline or Cool check to recover Strain. Each success recovers 1 Strain.</Text>
                                <Text>- Medicine checks can be performed to heal Wounds with varying difficulties (Easy for minor wounds, Hard for severe).</Text>
                                <Text>- Critical Injuries persist even after immediate effects expire and should be treated promptly.</Text>
                                <Text>
                                    - If stimpacks were used during the encounter, remind players of diminishing returns. A full night's rest is
                                    required to reset their effectiveness.
                                </Text>
                                <Text>- Natural rest heals 1 Wound per night and fully removes Strain.</Text>
                            </Stack>
                        </Box>

                        {/* Remove Dead NPCs Option */}
                        <Box>
                            <Flex align="center" justify="space-between">
                                <Text fontWeight="bold">Remove Dead NPCs:</Text>
                                <Switch
                                    colorScheme="red"
                                    isChecked={removeDeadNpcs}
                                    onChange={(e) => setRemoveDeadNpcs(e.target.checked)}
                                />
                            </Flex>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                Remove only NPCs marked as "wounded" to clean up the encounter space.
                            </Text>
                        </Box>

                        {/* Remove All NPCs Option */}
                        <Box>
                            <Flex align="center" justify="space-between">
                                <Text fontWeight="bold">Remove All NPCs:</Text>
                                <Switch
                                    colorScheme="red"
                                    isChecked={removeAllNpcs}
                                    onChange={(e) => setRemoveAllNpcs(e.target.checked)}
                                />
                            </Flex>
                            <Text fontSize="sm" color="gray.500" mt={1}>
                                Remove all NPCs entirely from the encounter, regardless of their status.
                            </Text>
                        </Box>
                    </Stack>
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="red" onClick={handleConfirm}>
                        Confirm
                    </Button>
                    <Button variant="ghost" onClick={onClose} ml={3}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EndEncounterModal;