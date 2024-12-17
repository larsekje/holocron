import React from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    VStack,
    HStack,
    Box,
    Text,
    Button,
    ButtonGroup,
    Spacer,
} from "@chakra-ui/react";
import PCContributionRow from "@components/destinyPoints/PCContributionRow";

// Define the types for props and contributions
interface PC {
    id: string; // Each PC must have an ID
    name: string; // Display name for the PC
}

interface DestinyEditorModalProps {
    isOpen: boolean; // Controls the modal's open/close state
    onClose: () => void; // Function to close the modal
    pcs: PC[]; // Array of PCs (participants)
    selectedContributions: { [pcId: string]: string }; // Current contribution selection map
    handleSelection: (pcId: string, value: string) => void; // Function to handle selected contributions
    onReset: () => void; // Function to reset all contributions
    onConfirm: () => void; // Function to confirm and finalize contributions
}

const DestinyEditorModal: React.FC<DestinyEditorModalProps> = ({
                                                                   isOpen,
                                                                   onClose,
                                                                   pcs,
                                                                   selectedContributions,
                                                                   handleSelection,
                                                                   onReset,
                                                                   onConfirm,
                                                               }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalOverlay />
            <ModalContent>
                {/* Modal Header */}
                <ModalHeader>Edit Destiny Pool</ModalHeader>
                <ModalCloseButton />

                {/* Modal Body */}
                <ModalBody pb={4}>
                    <VStack spacing={4} align="stretch">
                        {pcs.map((pc) => (
                            <PCContributionRow
                                key={pc.id}
                                pc={pc}
                                selectedContribution={selectedContributions[pc.id]}
                                handleSelection={handleSelection}
                            />
                        ))}
                    </VStack>
                </ModalBody>

                {/* Modal Footer */}
                <ModalFooter>
                    <HStack width="100%" spacing={2}>
                        {/* Reset button */}
                        <Button size="sm" variant="outline" onClick={onReset}>
                            Reset
                        </Button>
                        <Spacer />
                        {/* Confirm and Cancel buttons */}
                        <Button colorScheme="teal" size="sm" onClick={onConfirm}>
                            Confirm
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DestinyEditorModal;