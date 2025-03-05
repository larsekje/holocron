import React, { useState, useEffect } from "react";
import {
    Box,
    Text,
    Heading,
    Stack,
    Badge,
    Divider,
    Switch,
    Flex, HStack, Button,
    useToast,
} from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantsStore from "@/state/participantsStore";
import {createRandomParticipant} from "@/utils/participantUtils";
import {InitiativeSlot} from "@/types/initiativeSlot";
import {Participant} from "@/state/participantsStore";
import adversaryService from "@/services/adversaryService";
import { Adversary } from "@/types/adversaryTypes";

const GameplayInfo: React.FC = () => {
    const { 
        state, 
        context, 
        isTurnBased: turnBased, 
        toggleMode: toggleTurnBased, 
        setActiveParticipantId, 
        getCurrentTurnState, 
        getTurnStateDescription,
        advanceTurn,
        transition,
        setInitiativeModalOpen,
        setInitiativeOrder
    } = useGameplayStore();
    const { activeParticipantId} = useGameplayStore((state) => state.context);
    const { participants, addParticipant, removeParticipant } = useParticipantsStore();
    const toast = useToast();
    
    // State for adversaries
    const [adversaries, setAdversaries] = useState<Adversary[]>([]);
    const [loadingAdversaries, setLoadingAdversaries] = useState(false);

    // Load adversaries when component mounts
    useEffect(() => {
        const loadAdversaries = async () => {
            setLoadingAdversaries(true);
            try {
                const data = await adversaryService.getAdversaries();
                setAdversaries(data);
            } catch (error) {
                console.error('Error loading adversaries:', error);
                toast({
                    title: "Error loading adversaries",
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setLoadingAdversaries(false);
            }
        };
        
        loadAdversaries();
    }, [toast]);

    const mode = context.mode;
    const turnState = getCurrentTurnState();

    const handleAddRandomParticipant = () => {
        const isPC = Math.random() < 0.4
        const newParticipant = createRandomParticipant(isPC ? "PC" : "NPC");
        addParticipant(newParticipant); // Add the participant to the store
    };

    const handleInitTest = async () => {
        // Create some random participants
        const pc1 = createRandomParticipant("PC");
        const pc2 = createRandomParticipant("PC");
        
        // Get adversaries (load if not already loaded)
        let availableAdversaries = adversaries;
        
        // Select two random adversaries from different types if possible
        const allTypes = ["Minion", "Rival", "Nemesis"];
        
        if (!availableAdversaries.length) {
            toast({
                title: "Using default adversaries",
                description: "Could not load adversaries, using generic NPCs instead.",
                status: "warning",
                duration: 3000,
                isClosable: true,
            });
            
            // Create generic NPCs instead
            const npc1 = createRandomParticipant("NPC");
            const npc2 = createRandomParticipant("NPC");
            
            // Add all participants
            addParticipant(pc1);
            addParticipant(pc2);
            addParticipant(npc1);
            addParticipant(npc2);
            
            // Roll initiative for all
            initiativeRoll([pc1, pc2, npc1, npc2]);
            return;
        }
        
        // Filter adversaries by type and pick one of each if possible
        const minionAdversaries = availableAdversaries.filter(adv => adv.type === "Minion");
        const rivalAdversaries = availableAdversaries.filter(adv => adv.type === "Rival");
        const nemesisAdversaries = availableAdversaries.filter(adv => adv.type === "Nemesis");
        
        // Select random adversaries by type
        const selectedAdversaries: Adversary[] = [];
        
        if (minionAdversaries.length) {
            selectedAdversaries.push(minionAdversaries[Math.floor(Math.random() * minionAdversaries.length)]);
        }
        
        if (rivalAdversaries.length) {
            selectedAdversaries.push(rivalAdversaries[Math.floor(Math.random() * rivalAdversaries.length)]);
        }
        
        // If we don't have 2 adversaries yet, add a nemesis or another random type
        if (selectedAdversaries.length < 2 && nemesisAdversaries.length) {
            selectedAdversaries.push(nemesisAdversaries[Math.floor(Math.random() * nemesisAdversaries.length)]);
        }
        
        // If we still don't have 2, add another random adversary of any type
        if (selectedAdversaries.length < 2 && availableAdversaries.length) {
            const randomAdversary = availableAdversaries[Math.floor(Math.random() * availableAdversaries.length)];
            // Avoid duplicates
            if (!selectedAdversaries.some(adv => adv.name === randomAdversary.name)) {
                selectedAdversaries.push(randomAdversary);
            }
        }
        
        // Convert adversaries to participants
        const npcParticipants = selectedAdversaries.map(adv => {
            const participant = adversaryService.convertToParticipant(adv);
            
            // Add some random dice to demonstrate the dice pouch system
            const diceTypes: (keyof DicePouch)[] = ['boost', 'setback', 'advantage', 'threat', 'success', 'failure'];
            const randomDiceType = diceTypes[Math.floor(Math.random() * diceTypes.length)];
            
            // Initialize dice pouch if not present (should be handled by addParticipant, but just to be safe)
            if (!participant.dicePouch) {
                participant.dicePouch = {
                    boost: 0,
                    setback: 0,
                    advantage: 0,
                    threat: 0,
                    success: 0,
                    failure: 0,
                    triumph: 0,
                    despair: 0,
                    force: 0
                };
            }
            
            // Add random dice
            participant.dicePouch[randomDiceType] = Math.floor(Math.random() * 3) + 1;
            
            return participant;
        });
        
        // Add all participants
        addParticipant(pc1);
        addParticipant(pc2);
        npcParticipants.forEach(npc => addParticipant(npc));
        
        // Combine all participants for initiative roll
        const allParticipants = [pc1, pc2, ...npcParticipants];
        
        // Roll initiative for all
        initiativeRoll(allParticipants);
    };

    const initiativeRoll = (participants: Participant[]) => {
        // Map participants to InitiativeSlot[] shape and sort them
        const order = participants
            .map((p) => ({
                team: p.isPC ? "PC" : "NPC",
                initiative: Math.floor(Math.random() * 20) + 1,
                name: p.name,
                participantId: p.id
            }))
            .sort((a, b) => b.initiative - a.initiative) as InitiativeSlot[]; // Sort descending
        
        // Update the initiative in the store
        setInitiativeOrder(order); // Update store
        
        transition('ENTER_STRUCTURED');
        transition('ROLL_INITIATIVE');
        transition('START_ENCOUNTER');
        
        // Explicitly start the turn sequence
        if (order.length > 0) {
            setActiveParticipantId(order[0].participantId!);
        }
        
        toast({
            title: "Encounter started",
            description: `Initiative order set with ${order.length} participants`,
            status: "success",
            duration: 3000,
            isClosable: true,
        });
    };

    const handleSetActive = (participantId: string) => {
        setActiveParticipantId(participantId); // Update active participant in gameplayStore
    };

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            maxWidth="400px"
            mx="auto"
            bg="gray.50"
            boxShadow="md"
        >
            <Heading as="h2" size="lg" mb={4} textAlign="center">
                Gameplay Information
            </Heading>
            <Stack spacing={3}>
                {/* Display Gameplay Mode */}
                <Box>
                    <Text fontWeight="bold">Mode:</Text>
                    <Badge colorScheme="blue" fontSize="md" mt={1} marginRight={2}>
                        {mode}
                    </Badge>
                    <Badge colorScheme="yellow" fontSize="md" mt={1}>
                        {state}
                    </Badge>
                </Box>

                {/* Display Turn State */}
                {turnState && (
                    <Box>
                        <Text fontWeight="bold">Turn Phase:</Text>
                        <Badge 
                            colorScheme={
                                turnState === 'turn_start' ? "green" : 
                                turnState === 'turn_active' ? "blue" : 
                                "purple"
                            } 
                            fontSize="md" 
                            mt={1}
                        >
                            {getTurnStateDescription()}
                        </Badge>
                        
                        {/* Removed the turn progress buttons since we're using the toolbar Next button */}
                    </Box>
                )}

                {/* Round Information */}
                <Box>
                    <Text fontWeight="bold">Round:</Text>
                    <Text>{context.round}</Text>
                </Box>

                {/* Turn-Based Mode Toggle */}
                <Box>
                    <Flex align="center" justify="space-between">
                        <Text fontWeight="bold">Turn-Based:</Text>
                        <Switch
                            colorScheme="green"
                            isChecked={context.mode === "structured"}
                            onChange={toggleTurnBased}
                        />
                    </Flex>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                        {context.mode === "structured" ? "Turn-Based is enabled" : "Turn-Based is disabled"}
                    </Text>
                </Box>
            </Stack>

            <Divider my={4} />

            {/* Participant List */}
            <HStack justify="space-between">
                <Heading as="h3" size="md" mt={2} mb={2}>
                    Participants
                </Heading>
                <HStack>
                    <Button colorScheme="green" size="xs" onClick={handleAddRandomParticipant}>Add</Button>
                    <Button colorScheme="blue" size="xs" onClick={handleInitTest}>Init Test</Button>
                </HStack>
            </HStack>

            {participants.length > 0 ? (
                <Stack spacing={2}>
                    {participants.map((participant) => (
                        <Flex
                            key={participant.id}
                            align="center"
                            bg={participant.id === activeParticipantId ? "teal.100" : "transparent"}
                            borderRadius="md"
                            p={2}
                            _hover={{ cursor: "pointer", bg: "teal.200" }}
                            onClick={() => handleSetActive(participant.id)}
                        >
                             <Badge
                                colorScheme={participant.isPC ? "green" : "purple"}
                                mr={2}
                            >
                                {participant.isPC ? "PC" : "NPC"}
                            </Badge>
                            <Badge>{participant.initiative}</Badge>
                            <Text mr={2}>{participant.name}</Text>
                            <Button
                                size="xs"
                                ml="auto"
                                colorScheme="red"
                                opacity={0}
                                _hover={{ opacity: 1 }}
                                transition="opacity 0.2s ease-in-out"
                                onClick={() => removeParticipant(participant.id)}
                            >
                                REMOVE
                            </Button>
                        </Flex>
                    ))}
                </Stack>
            ) : (
                <Text>No participants currently active.</Text>
            )}
        </Box>
    );
};

export default GameplayInfo;