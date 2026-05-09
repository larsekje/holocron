import React, {useState} from "react";
import {
    Box,
    Button,
    Flex,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
    Switch,
    Text,
} from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";

interface EndEncounterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: { removeDeadNpcs: boolean; removeAllNpcs: boolean }) => void;
}

const SectionLabel: React.FC<{children: React.ReactNode}> = ({children}) => (
    <Text
        as="b"
        fontSize="10px"
        letterSpacing="0.16em"
        textTransform="uppercase"
        color="#d39939"
    >
        {children}
    </Text>
);

const EndEncounterModal: React.FC<EndEncounterModalProps> = ({isOpen, onClose, onConfirm}) => {
    const [removeDeadNpcs, setRemoveDeadNpcs] = useState(true);
    const [removeAllNpcs, setRemoveAllNpcs] = useState(false);

    const transition = useGameplayStore((state) => state.transition);

    const handleConfirm = () => {
        onConfirm({removeDeadNpcs, removeAllNpcs});
        onClose();
        transition('END_ENCOUNTER');
        transition("RESET");
        transition("EXIT_STRUCTURED");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
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
                    End Encounter
                </ModalHeader>
                <ModalCloseButton color="whiteAlpha.700" _hover={{color: "white"}}/>

                <ModalBody bg="#1d2025" pb={4} pt={4}>
                    <Stack spacing={4}>
                        <Box bg="#16181c" p={3} borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.150">
                            <SectionLabel>GM Reminder</SectionLabel>
                            <Stack spacing={2} mt={2} fontSize="sm" color="whiteAlpha.800">
                                <Text>· PCs can attempt a Simple (—) Discipline or Cool check to recover Strain. Each success recovers 1 Strain.</Text>
                                <Text>· Medicine checks heal Wounds; difficulty scales with severity (Easy → Hard).</Text>
                                <Text>· Critical Injuries persist even after immediate effects expire — treat promptly.</Text>
                                <Text>· If stimpacks were used, remind players of diminishing returns. A full night's rest resets effectiveness.</Text>
                                <Text>· Natural rest heals 1 Wound per night and fully removes Strain.</Text>
                            </Stack>
                        </Box>

                        <Box>
                            <Flex align="center" justify="space-between">
                                <SectionLabel>Remove Dead NPCs</SectionLabel>
                                <Switch
                                    colorScheme="orange"
                                    isChecked={removeDeadNpcs}
                                    onChange={(e) => setRemoveDeadNpcs(e.target.checked)}
                                />
                            </Flex>
                            <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                                Remove only NPCs marked as wounded to clean up the encounter space.
                            </Text>
                        </Box>

                        <Box>
                            <Flex align="center" justify="space-between">
                                <SectionLabel>Remove All NPCs</SectionLabel>
                                <Switch
                                    colorScheme="orange"
                                    isChecked={removeAllNpcs}
                                    onChange={(e) => setRemoveAllNpcs(e.target.checked)}
                                />
                            </Flex>
                            <Text fontSize="xs" color="whiteAlpha.600" mt={1}>
                                Remove all NPCs from the encounter, regardless of their status.
                            </Text>
                        </Box>
                    </Stack>
                </ModalBody>
                <ModalFooter bg="#0f1114" borderTopWidth="1px" borderColor="#0a0b0d" py={2}>
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
                        ml={2}
                        bg="#d39939"
                        color="#1a1d24"
                        fontWeight="bold"
                        letterSpacing="0.04em"
                        _hover={{bg: "yellow.400"}}
                        onClick={handleConfirm}
                    >
                        Confirm
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EndEncounterModal;
