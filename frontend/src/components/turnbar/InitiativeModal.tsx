import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    Button,
    Flex,
    Text,
    IconButton,
    Input,
    InputGroup,
    InputLeftAddon,
    Tooltip,
    Box,
    Stack,
    HStack,
    Badge,
    Switch,
} from "@chakra-ui/react";
import {Participant} from "@/state/participantsStore";
import { MdRefresh } from "react-icons/md";
import '../../assets/sass/dice.sass'; // Import dice styles

interface InitiativeModalProps {
    isOpen: boolean; // Controls when the modal is displayed
    participants: Participant[]; // List of all participants (PC & NPC)
    onClose: () => void; // Function to close the modal
    onSubmit: (updatedParticipants: Participant[]) => void; // Callback function to return updated participants
}

// Edge of the Empire dice symbol mapping
type DiceSymbol = 's' | 'f' | 'a' | 't' | 'X' | 'Y';
type DieName = 'ability' | 'proficiency' | 'boost' | 'difficulty' | 'challenge' | 'setback' | 'force';

// Component for displaying dice symbols
const DiceSymbol: React.FC<{ symbol: DiceSymbol, size?: string, color?: string }> = ({ symbol, size = '1.5em', color = 'black' }) => {
    const symbolClass = {
        's': 'success',
        'f': 'failure',
        'a': 'advantage',
        't': 'threat',
        'X': 'despair',
        'Y': 'triumph'
    }[symbol];

    return (
        <Box as="span" className={`icon ${symbolClass}`} fontSize={size} color={color} />
    );
};

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
    // Edge of the Empire dice results
    const [diceResults, setDiceResults] = useState<Record<string, DiceSymbol[]>>({});
    // Dice pools for each participant
    const [dicePools, setDicePools] = useState<Record<string, DieName[]>>({});

    // Dark mode color constants
    const coolColor = 'cyan.400';
    const vigilanceColor = 'green.400';

    // Dark mode UI elements
    const modalBg = "gray.800";
    const cardBg = "gray.700";
    const infoBg = "gray.900";
    const textColor = "whiteAlpha.900";
    const secondaryTextColor = "whiteAlpha.700";
    const inputBg = "gray.600";
    const inputColor = "white";

    useEffect(() => {
        console.log("Modal opened, isOpen=", isOpen);

        if (isOpen) {

            // Generate dice pools for all participants
            const newDicePools = { ...dicePools };
            participants.forEach(participant => {
                newDicePools[participant.id] = generateDicePoolForParticipant(participant);
            });
            setDicePools(newDicePools);

            console.log("Do stuff when modal is opened");

            // Automatically roll NPC initiatives when the modal opens
            rollAllNpcInitiatives();
            // setOverriddenNpcs({});  // Reset overrides when modal reopens
            setDiceResults({});     // Reset dice results when modal reopens
        }
    }, [isOpen, participants, pcUseCool]);

    // Define dice face distributions according to the Star Wars RPG system
    const diceFaces = {
        boost: [
            null, // Blank
            null, // Blank
            's',  // Success
            'sa', // Success + Advantage
            'aa', // Double Advantage
            'a'   // Advantage
        ],
        ability: [
            null, // Blank
            's',  // Success
            's',  // Success
            'ss', // Double Success
            'a',  // Advantage
            'a',  // Advantage
            'sa', // Success + Advantage
            'aa'  // Double Advantage
        ],
        proficiency: [
            null, // Blank
            's',  // Success
            's',  // Success
            'ss', // Double Success
            'ss', // Double Success
            'a',  // Advantage
            'sa', // Success + Advantage
            'sa', // Success + Advantage
            'sa', // Success + Advantage
            'aa', // Double Advantage
            'aa', // Double Advantage
            'Y'   // Triumph
        ]
    };

    // Roll a specific die type and return the results
    const rollDie = (dieType: DieName): DiceSymbol[] => {
        let faces: (string | null)[] = [];
        
        // Get the appropriate face distribution
        if (dieType === 'boost') {
            faces = diceFaces.boost;
        } else if (dieType === 'ability') {
            faces = diceFaces.ability;
        } else if (dieType === 'proficiency') {
            faces = diceFaces.proficiency;
        } else {
            // For other dice types (not needed for initiative)
            return [];
        }
        
        // Roll the die
        const roll = Math.floor(Math.random() * faces.length);
        const result = faces[roll];
        
        // Convert the result to individual symbols
        if (!result) return []; // Blank result
        
        const symbols: DiceSymbol[] = [];
        
        // Split the result into individual symbols
        for (const char of result) {
            symbols.push(char as DiceSymbol);
        }
        
        return symbols;
    };

    // Generate a dice pool based on participant skills
    const generateDicePoolForParticipant = (participant: Participant): DieName[] => {
        const skill = getSkillForParticipant(participant.isPC, participant.id);
        const stats = participant.stats || {};
        const dicePool: DieName[] = [];
        
        // In Edge of the Empire, Vigilance is based on Willpower, Cool is based on Presence
        // Get the relevant characteristic value
        const characteristicValue = skill === 'Cool' 
            ? (stats.presence || 2) // Presence for Cool
            : (stats.willpower || 2); // Willpower for Vigilance
        
        // Get skill ranks - skills are stored with first letter capitalized
        const skills = stats.skills || {};
        
        // The skill value is stored with the first letter capitalized
        let skillRank = 0;
        if (skills && typeof skills === 'object') {
            // Skills are stored with first letter capitalized (e.g., "Vigilance", "Cool")
            skillRank = skills[skill] || 0;
        }
        
        // Per Edge of the Empire rules:
        // 1. Total dice count is the higher of characteristic value or skill rank
        // 2. Yellow dice (proficiency) equal skill rank (limited by total dice count)
        // 3. Green dice (ability) are the remainder
        
        const totalDice = Math.max(characteristicValue, skillRank);
        const yellowDice = Math.min(skillRank, characteristicValue);
        const greenDice = totalDice - yellowDice;
        
        // Add proficiency dice (yellow)
        for (let i = 0; i < yellowDice; i++) {
            dicePool.push('proficiency');
        }
        
        // Add ability dice (green)
        for (let i = 0; i < greenDice; i++) {
            dicePool.push('ability');
        }
        
        // Add boost/setback dice from the dice pouch if present
        if (participant.dicePouch) {
            // Add boost dice from the dice pouch
            for (let i = 0; i < (participant.dicePouch.boost || 0); i++) {
                dicePool.push('boost');
            }
            
            // Add setback dice from the dice pouch
            for (let i = 0; i < (participant.dicePouch.setback || 0); i++) {
                dicePool.push('setback');
            }
        }
        
        return dicePool;
    };

    // Generate random dice results for Edge of the Empire initiative roll
    // based on the participant's dice pool
    const generateRandomDiceResults = (pool: DieName[]): DiceSymbol[] => {
        // const pool = dicePools[participantId] || [];
        let results: DiceSymbol[] = [];

        //console.log("Dice pool for", participantId, ":", pool);

        // Roll each die in the pool
        for (const dieType of pool) {
            const dieResults = rollDie(dieType);

            console.log("Die result", dieResults);
            results = [...results, ...dieResults];
        }

        return results;
    };

    const calculateInitiativeFromResults = (results: DiceSymbol[]): number => {
        // Count successes (s and Y)
        const successCount = results.filter(
            symbol => symbol === 's' || symbol === 'Y'
        ).length;
        
        // Count advantages (a)
        const advantageCount = results.filter(
            symbol => symbol === 'a'
        ).length;
        
        // Initiative is success count with advantages as decimal
        // For example, 4 successes and 3 advantages would be 4.3
        return Math.max(0, successCount) + (advantageCount / 10);
    };

    const rollAllNpcInitiatives = () => {
        const newInitiatives = { ...initiatives };
        const newDiceResults = { ...diceResults };
        const newDicePools = { ...dicePools };
        
        participants.forEach((participant) => {
            if (!participant.isPC) {

                // Generate dice pool for the NPC
                newDicePools[participant.id] = generateDicePoolForParticipant(participant);

                console.log("Dice pool for NPC", participant.name, ":", newDicePools[participant.id]);
                
                // Generate random dice results by rolling the dice pool
                newDiceResults[participant.id] = generateRandomDiceResults(newDicePools[participant.id]);

                console.log("Dice results for NPC", participant.name, ":", newDiceResults[participant.id]);
                
                // Calculate initiative value from dice results
                newInitiatives[participant.id] = calculateInitiativeFromResults(newDiceResults[participant.id]);

                console.log("Initiative roll for NPC", participant.name, ":", newInitiatives[participant.id]);

            }
        });

        console.log("Initiative rolls:", newInitiatives);

        setInitiatives(newInitiatives);
        setDiceResults(newDiceResults);
        setDicePools(newDicePools);
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
        
        // Update dice pools when initiative skill changes
        const newDicePools = { ...dicePools };
        participants.forEach(participant => {
            newDicePools[participant.id] = generateDicePoolForParticipant(participant);
        });
        setDicePools(newDicePools);
    };

    const toggleNpcOverride = (npcId: string) => {
        setOverriddenNpcs(prev => ({
            ...prev,
            [npcId]: !prev[npcId]
        }));
    };

    // Re-roll initiative for a specific NPC
    const rerollInitiative = (npcId: string) => {
        // Make sure the dice pool is updated
        const participant = participants.find(p => p.id === npcId);
        if (participant) {
            setDicePools(prev => ({
                ...prev,
                [npcId]: generateDicePoolForParticipant(participant)
            }));
            
            // Generate new dice results
            const newResults = generateRandomDiceResults(dicePools[npcId]);
            setDiceResults(prev => ({
                ...prev,
                [npcId]: newResults
            }));
            
            // Calculate initiative value from dice results
            const initiativeValue = calculateInitiativeFromResults(newResults);
            
            // Update the initiative value
            setInitiatives(prev => ({
                ...prev,
                [npcId]: initiativeValue
            }));
        }
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

    const handleSuccessChange = (id: string, value: string) => {
        // Remove any leading zeros to prevent numbers like "03"
        const cleanValue = value.replace(/^0+/, '') || "0";
        const successes = parseInt(cleanValue, 10);
        if (isNaN(successes) || successes < 0) return;
        
        // Get current initiative value and extract the advantage part
        const currentValue = initiatives[id] || 0;
        const advantages = Math.round((currentValue - Math.floor(currentValue)) * 10);
        
        // Construct new initiative value with updated successes
        const newValue = successes + (advantages / 10);
        
        setInitiatives((prev) => ({
            ...prev,
            [id]: newValue,
        }));
    };
    
    const handleAdvantageChange = (id: string, value: string) => {
        // Remove any leading zeros to prevent numbers like "03"
        const cleanValue = value.replace(/^0+/, '') || "0";
        const advantages = parseInt(cleanValue, 10);
        if (isNaN(advantages) || advantages < 0) return;
        
        // Get current initiative value and extract the success part
        const currentValue = initiatives[id] || 0;
        const successes = Math.floor(currentValue);
        
        // Construct new initiative value with updated advantages
        const newValue = successes + (advantages / 10);
        
        setInitiatives((prev) => ({
            ...prev,
            [id]: newValue,
        }));
    };

    // Add a simple component for displaying initiative with different styling for success vs advantage
    const InitiativeDisplay = ({ value }: { value: number }) => {
        const successes = Math.floor(value);
        const advantages = Math.round((value - successes) * 10);
        
        // If no successes or advantages, show 0
        if (successes === 0 && advantages === 0) {
            return <Text>0</Text>;
        }
        
        return (
            <>
                {successes > 0 && (
                    <Text as="span" fontWeight="bold" fontSize="md" mr={1}>
                        {successes}<DiceSymbol symbol="s" color="white" />
                    </Text>
                )}
                
                {advantages > 0 && (
                    <Text as="span" fontSize="sm" color="gray.300">
                        {advantages}<DiceSymbol symbol="a" color="white" />
                    </Text>
                )}
            </>
        );
    };

    // Reference for the first PC input field
    const firstPCInputRef = useRef<HTMLInputElement>(null);

    // Focus the first PC input when the modal opens
    useEffect(() => {
        if (isOpen && firstPCInputRef.current) {
            // Use a small timeout to ensure the modal is fully rendered
            setTimeout(() => {
                firstPCInputRef.current?.focus();
                firstPCInputRef.current?.select();
            }, 100);
        }
    }, [isOpen]);

    // Handler to select all text when any input is focused
    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    // PCs first — the GM only ever types values for PCs, so keep them above
    // the fold; the auto-rolled NPCs follow under their own label. Display
    // order only; handleSubmit and the FSM re-sort by initiative anyway.
    const orderedParticipants = React.useMemo(
        () => [...participants].sort((a, b) => Number(b.isPC) - Number(a.isPC)),
        [participants],
    );
    const firstPcIndex = orderedParticipants.findIndex((p) => p.isPC);

    // Handler for keyboard shortcuts within the modal.
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Cmd/Ctrl+Enter submits from any focus, so the GM can confirm without
        // tabbing to the last input. Disabled-state guard mirrors the button.
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            const blocked = participants.some((p) => p.isPC && !initiatives[p.id]);
            if (!blocked) {
                e.preventDefault();
                handleSubmit();
            }
            return;
        }

        // R re-rolls all NPC initiatives. Number inputs reject alphabetic
        // keystrokes so it's safe to hijack inside the modal.
        if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            rollAllNpcInitiatives();
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
            // Plain Enter: walk through inputs, submit on the last.
            const activeElement = document.activeElement;
            if (activeElement &&
                activeElement.tagName === 'INPUT' &&
                activeElement.getAttribute('type') === 'number') {
                const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
                const currentIndex = inputs.indexOf(activeElement as HTMLInputElement);

                if (currentIndex < inputs.length - 1) {
                    (inputs[currentIndex + 1] as HTMLInputElement).focus();
                } else {
                    handleSubmit();
                }
            } else {
                handleSubmit();
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside" size="lg">
            <ModalOverlay backdropFilter="blur(10px)" />
            <ModalContent bg={modalBg} color={textColor} borderRadius="lg" boxShadow="dark-lg" onKeyDown={handleKeyDown} my={6}>
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
                    <Stack spacing={2} pt={1}>
                        {/* Explanatory text about skills */}
                        <Box
                            mb={0}
                            p={2.5}
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

                        {/* PCs first (the GM only inputs PC values); the
                          * auto-rolled NPCs follow under their own label. */}
                        {orderedParticipants.map((participant, index) => {
                            const showPcHeader = participant.isPC && index === firstPcIndex;
                            const showNpcHeader =
                                !participant.isPC &&
                                (index === 0 || orderedParticipants[index - 1].isPC);
                            return (
                            <React.Fragment key={participant.id}>
                            {showPcHeader && (
                                <Text fontSize="xs" fontWeight="bold" letterSpacing="0.08em"
                                    textTransform="uppercase" color={secondaryTextColor} mt={1}>
                                    Player Characters
                                </Text>
                            )}
                            {showNpcHeader && (
                                <Text fontSize="xs" fontWeight="bold" letterSpacing="0.08em"
                                    textTransform="uppercase" color={secondaryTextColor} mt={2}>
                                    NPCs
                                </Text>
                            )}
                            <Flex
                                justify="space-between"
                                align="center"
                                p={2}
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

                                {/* PC Handling: Input fields for success and advantage */}
                                {participant.isPC ? (
                                    <Flex direction="column" align="center">
                                        <Flex justify="space-between" width="100%" mb={2}>
                                            <InputGroup size="sm" mr={2}>
                                                <InputLeftAddon bg="gray.700" borderColor="gray.600">
                                                    <DiceSymbol symbol="s" color="white" size="1.4em" />
                                                </InputLeftAddon>
                                                <Input
                                                    placeholder="0"
                                                    width="60px"
                                                    type="number"
                                                    min="0"
                                                    value={Math.floor(initiatives[participant.id] || 0)}
                                                    onChange={(e) => handleSuccessChange(participant.id, e.target.value)}
                                                    bg={inputBg}
                                                    color={inputColor}
                                                    borderColor="gray.600"
                                                    _hover={{
                                                        bg: inputBg,
                                                    }}
                                                    // Add ref to the first PC's input field
                                                    ref={index === firstPcIndex ? firstPCInputRef : undefined}
                                                    tabIndex={participant.isPC ? (index * 2) + 1 : undefined}
                                                    onFocus={handleInputFocus}
                                                />
                                            </InputGroup>
                                            
                                            <InputGroup size="sm">
                                                <InputLeftAddon bg="gray.700" borderColor="gray.600">
                                                    <DiceSymbol symbol="a" color="white" size="1.4em" />
                                                </InputLeftAddon>
                                                <Input
                                                    placeholder="0"
                                                    width="60px"
                                                    type="number"
                                                    min="0"
                                                    value={Math.round(((initiatives[participant.id] || 0) % 1) * 10)}
                                                    onChange={(e) => handleAdvantageChange(participant.id, e.target.value)}
                                                    bg={inputBg}
                                                    color={inputColor}
                                                    borderColor="gray.600"
                                                    _hover={{
                                                        bg: inputBg,
                                                    }}
                                                    tabIndex={participant.isPC ? (index * 2) + 2 : undefined}
                                                    onFocus={handleInputFocus}
                                                />
                                            </InputGroup>
                                        </Flex>
                                    </Flex>
                                ) : (
                                    // NPC Handling: Display rolled initiative with re-roll button
                                    <Flex align="center">
                                        <Box mr={2} fontWeight="bold">
                                            <InitiativeDisplay value={initiatives[participant.id] || 0} />
                                        </Box>
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
                            </React.Fragment>
                            );
                        })}
                    </Stack>
                </ModalBody>

                <ModalFooter>
                    <Tooltip label="Re-roll initiative for all NPCs (R)" bg="gray.900" color="white">
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