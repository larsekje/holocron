import React from "react";
import {
    Box,
    Button,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spacer,
    VStack,
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
        <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
            <ModalOverlay backdropFilter="blur(4px)" bg="rgba(0,0,0,0.6)"/>
            <ModalContent
                bg="#16181c"
                color="gray.100"
                borderColor="#0a0b0d"
                borderWidth="1px"
                overflow="hidden"
            >
                <Box h="3px" w="100%" bgGradient="linear(to-r, #7c3a2c, #d39939)"/>
                <ModalHeader
                    bg="#0f1114"
                    borderBottomWidth="1px"
                    borderColor="#0a0b0d"
                    fontSize="xs"
                    letterSpacing="0.16em"
                    textTransform="uppercase"
                    color="#d39939"
                    py={2}
                >
                    Edit Destiny Pool
                </ModalHeader>
                <ModalCloseButton color="whiteAlpha.700" _hover={{color: "white"}}/>

                <ModalBody bg="#1d2025" pb={4} pt={4}>
                    <VStack spacing={3} align="stretch">
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

                <ModalFooter bg="#0f1114" borderTopWidth="1px" borderColor="#0a0b0d" py={2}>
                    <HStack width="100%" spacing={2}>
                        <Button
                            size="xs"
                            variant="ghost"
                            color="whiteAlpha.700"
                            _hover={{bg: "whiteAlpha.100", color: "white"}}
                            onClick={onReset}
                        >
                            Reset
                        </Button>
                        <Spacer/>
                        <Button
                            size="xs"
                            variant="ghost"
                            color="whiteAlpha.700"
                            _hover={{bg: "whiteAlpha.100", color: "white"}}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="xs"
                            bg="#d39939"
                            color="#1a1d24"
                            fontWeight="bold"
                            letterSpacing="0.04em"
                            _hover={{bg: "yellow.400"}}
                            onClick={onConfirm}
                        >
                            Confirm
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DestinyEditorModal;