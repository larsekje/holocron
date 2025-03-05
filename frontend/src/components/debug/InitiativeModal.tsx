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
    Switch,
    Box,
    HStack,
    IconButton,
    Tooltip,
    useTheme,
} from "@chakra-ui/react";
import {Participant} from "@/state/participantsStore";
import { MdRefresh } from "react-icons/md";

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
    // By default, PCs use Vigilance and NPCs use Cool (the opposite)
    const [pcUseCool, setPcUseCool] = useState<boolean>(false);
    // Track which NPCs have their skills overridden
    const [overriddenNpcs, setOverriddenNpcs] = useState<Record<string, boolean>>({});

    // Dark mode color constants
    const coolColor = 'cyan.400';
    const vigilanceColor = 'green.400';
    const inactiveColor = "gray.500";
    
    // Dark mode UI elements
    const modalBg = "gray.800";
    const cardBg = "gray.700";
    const infoBg = "gray.900";
    const textColor = "whiteAlpha.900";
    const secondaryTextColor = "whiteAlpha.700";
    const inputBg = "gray.600";
    const inputColor = "white";

    useEffect(() => {
        if (isOpen) {
            // Automatically roll NPC initiatives when the modal opens
            rollAllNpcInitiatives();
            setOverriddenNpcs({});  // Reset overrides when modal reopens
        }
    }, [isOpen, participants]);

    const rollAllNpcInitiatives = () => {
        const newInitiatives = { ...initiatives };
        
        participants.forEach((participant) => {
            if (!participant.isPC) {
                // NPC rolls automatically
                newInitiatives[participant.id] = rollForNPCInitiative();
            }
        });
        
        setInitiatives(newInitiatives);
    };

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
            // Store which skill was used for this specific participant
            initiativeSkill: getSkillForParticipant(participant.isPC, participant.id)
        }));
        onSubmit(updatedParticipants); // Pass updated participants to parent
        onClose(); // Close the modal
    };

    const toggleInitiativeSkill = () => {
        setPcUseCool(!pcUseCool);
    };

    const toggleNpcOverride = (npcId: string) => {
        setOverriddenNpcs(prev => ({
            ...prev,
            [npcId]: !prev[npcId]
        }));
    };

    // Re-roll initiative for a specific NPC
    const rerollInitiative = (npcId: string) => {
        setInitiatives(prev => ({
            ...prev,
            [npcId]: rollForNPCInitiative()
        }));
    };

    // Helper function to determine which skill a participant is using
    const getSkillForParticipant = (isPC: boolean, participantId: string) => {
        if (isPC) {
            return pcUseCool ? "Cool" : "Vigilance";
        } else {
            // Check if this NPC is overridden
            if (overriddenNpcs[participantId]) {
                // If overridden, use same skill as PCs
                return pcUseCool ? "Cool" : "Vigilance";
            }
            // Otherwise use the opposite skill of PCs
            return pcUseCool ? "Vigilance" : "Cool";
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bg={modalBg} color={textColor} borderRadius="lg" boxShadow="dark-lg">
                <ModalHeader borderBottomWidth="1px" borderColor="gray.600">
                    <Flex justify="space-between" align="center" width="100%">
                        <Text fontWeight="bold">Roll for Initiative</Text>
                        <HStack spacing={2}>
                            <Text 
                                fontSize="sm"
                                fontWeight={!pcUseCool ? "bold" : "normal"}
                                color={vigilanceColor}
                                opacity={!pcUseCool ? 1 : 0.7}
                            >
                                Vigilance
                            </Text>
                            <Switch 
                                id="initiative-skill-toggle" 
                                isChecked={pcUseCool}
                                onChange={toggleInitiativeSkill}
                                colorScheme="cyan"
                                size="sm"
                                sx={{
                                    '& .chakra-switch__track': {
                                        bg: pcUseCool ? coolColor : vigilanceColor,
                                    }
                                }}
                            />
                            <Text 
                                fontSize="sm"
                                fontWeight={pcUseCool ? "bold" : "normal"}
                                color={coolColor}
                                opacity={pcUseCool ? 1 : 0.7}
                            >
                                Cool
                            </Text>
                        </HStack>
                    </Flex>
                </ModalHeader>

                <ModalBody>
                    <Stack spacing={4} pt={3}>
                        {/* Explanatory text about skills */}
                        <Box 
                            mb={4} 
                            p={3} 
                            borderWidth="1px" 
                            borderRadius="md" 
                            backgroundColor={infoBg}
                            borderColor="gray.600"
                        >
                            <Text fontSize="sm" mb={1} fontWeight="medium">
                                Player characters roll: <strong style={{ color: pcUseCool ? coolColor : vigilanceColor }}>{pcUseCool ? "Cool" : "Vigilance"}</strong>
                            </Text>
                            <Text 
                                fontSize="sm" 
                                color={!pcUseCool ? vigilanceColor : secondaryTextColor} 
                                fontWeight={!pcUseCool ? "bold" : "normal"}
                                opacity={!pcUseCool ? 1 : 0.8}
                            >
                                Vigilance: Used when prepared or alert for danger
                            </Text>
                            <Text 
                                fontSize="sm" 
                                color={pcUseCool ? coolColor : secondaryTextColor} 
                                fontWeight={pcUseCool ? "bold" : "normal"}
                                opacity={pcUseCool ? 1 : 0.8}
                            >
                                Cool: Used for surprise situations or when caught off-guard
                            </Text>
                        </Box>

                        {/* Iterate over all participants to display their initiative details */}
                        {participants.map((participant) => (
                            <Flex
                                key={participant.id}
                                justify="space-between"
                                align="center"
                                p={3}
                                borderWidth="1px"
                                borderRadius="md"
                                boxShadow="sm"
                                backgroundColor={cardBg}
                                borderColor="gray.600"
                            >
                                <Flex align="center" direction="column" alignItems="flex-start">
                                    <Flex align="center">
                                        <Badge
                                            colorScheme={participant.isPC ? "green" : "purple"}
                                            mr={2}
                                            variant="solid"
                                        >
                                            {participant.isPC ? "PC" : "NPC"}
                                        </Badge>
                                        <Text fontWeight="medium">{participant.name}</Text>
                                    </Flex>
                                    <Flex align="center">
                                        <Text fontSize="xs" color={secondaryTextColor}>
                                            Using: {!participant.isPC ? (
                                                <Tooltip 
                                                    label={overriddenNpcs[participant.id] 
                                                        ? "Using PC skill instead of opposite" 
                                                        : "Click to use same skill as PCs"} 
                                                    fontSize="xs"
                                                    bg="gray.900"
                                                    color="white"
                                                >
                                                    <Text
                                                        as="span"
                                                        fontWeight="bold"
                                                        color={getSkillForParticipant(participant.isPC, participant.id) === "Cool" ? 
                                                            coolColor : vigilanceColor}
                                                        cursor="pointer"
                                                        _hover={{ textDecoration: "underline" }}
                                                        onClick={() => toggleNpcOverride(participant.id)}
                                                    >
                                                        {getSkillForParticipant(participant.isPC, participant.id)}
                                                    </Text>
                                                </Tooltip>
                                            ) : (
                                                <Text
                                                    as="span"
                                                    fontWeight="bold"
                                                    color={getSkillForParticipant(participant.isPC, participant.id) === "Cool" ? 
                                                        coolColor : vigilanceColor}
                                                >
                                                    {getSkillForParticipant(participant.isPC, participant.id)}
                                                </Text>
                                            )}
                                        </Text>
                                    </Flex>
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
                                        bg={inputBg}
                                        color={inputColor}
                                        borderColor="gray.600"
                                        _focus={{
                                            borderColor: "cyan.400",
                                            boxShadow: "0 0 0 1px cyan.400"
                                        }}
                                    />
                                ) : (
                                    // NPC Handling: Display rolled initiative with re-roll button
                                    <Flex align="center">
                                        <Text mr={2}>
                                            Rolled: <strong>{initiatives[participant.id]}</strong>
                                        </Text>
                                        <Tooltip label="Re-roll initiative" fontSize="xs" bg="gray.900" color="white">
                                            <IconButton
                                                aria-label="Re-roll initiative"
                                                icon={<MdRefresh />}
                                                size="sm"
                                                colorScheme="purple"
                                                variant="ghost"
                                                onClick={() => rerollInitiative(participant.id)}
                                            />
                                        </Tooltip>
                                    </Flex>
                                )}
                            </Flex>
                        ))}
                    </Stack>
                </ModalBody>

                <ModalFooter>
                    <Tooltip label="Re-roll initiative for all NPCs" bg="gray.900" color="white">
                        <Button
                            leftIcon={<MdRefresh />}
                            mr={3}
                            onClick={rollAllNpcInitiatives}
                            size="sm"
                            variant="solid"
                            bg="#1e5b94" // More saturated, deeper blue
                            color="white"
                            _hover={{ bg: "#164673" }}
                        >
                            Re-roll
                        </Button>
                    </Tooltip>
                    <Button
                        mr={3}
                        onClick={handleSubmit}
                        isDisabled={participants.some(
                            (p) => p.isPC && !initiatives[p.id] // Check if all PCs have filled their initiatives
                        )}
                        size="sm"
                        bg="#2e8b57" // More saturated forest green
                        color="white"
                        _hover={{ bg: "#22734a" }}
                    >
                        Confirm
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        _hover={{
                            bg: "whiteAlpha.100"
                        }}
                        color="#d4af37" // Star Wars gold
                        size="sm"
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default InitiativeModal;