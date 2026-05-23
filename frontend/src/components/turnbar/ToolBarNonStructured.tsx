import React from 'react'
import {
    AccordionButton,
    Box,
    Button,
    Center,
    HStack,
    Menu, MenuButton,
    MenuItem,
    Spacer,
    Text,
    VStack
} from "@chakra-ui/react";
import InitiativeOrder from "@components/turnbar/InitiativeOrder";
import useGameplayStore from "@/state/gameplayStore";
import useGameplayStoreNew from "@/state/newGameplayStore";
import RoundNumberDisplay from "@components/turnbar/RoundNumberDisplay";
import {useMachine} from "@xstate/react";
import InitiativeModal from "@components/turnbar/InitiativeModal";
import useParticipantsStore, {Participant} from "@/state/participantsStore";
import {InitiativeSlot} from "@/types/initiativeSlot";
import DestinyPointManager from "@components/destinyPoints/DestinyPointManager";
import SkillChallengeStartButton from "@components/skillChallenge/SkillChallengeStartButton";

interface Props { }

const ToolBarNonStructured = ({ }: Props) => {

    const {transition, getCurrentTurnState, advanceTurn}  = useGameplayStoreNew();
    const isInitiativeModalOpen = useGameplayStoreNew((state) => state.isInitiativeModalOpen);
    const { setInitiativeModalOpen, setActiveParticipantId } = useGameplayStoreNew();
    const { context, state } = useGameplayStoreNew();
    const { updateParticipants } = useParticipantsStore();
    const turnState = getCurrentTurnState();
    const activeParticipantId = context.activeParticipantId;

    const handleRollInitiative = () => {
        setInitiativeModalOpen(true);
    }

    const handleCloseModal = () => {
        setInitiativeModalOpen(false);
    };

    const {setInitiativeOrder} = useGameplayStoreNew();
    const participants = useParticipantsStore((state) => state.participants);
    const participantCount = useParticipantsStore((state) => state.participants.length);

    // Get current initiative slot participants
    const getCurrentInitiativeSlot = () => {
        if (!context.initiativeOrder || context.initiativeOrder.length === 0) {
            return null;
        }
        
        // Get the current initiative slot
        const currentSlot = context.initiativeOrder[context.currentTurnIndex];
        
        // Find all participants that match this initiative
        const slotParticipants = participants.filter(p => 
            p.initiative === currentSlot.initiative && 
            (p.isPC ? currentSlot.team === 'PC' : currentSlot.team === 'NPC')
        );
        
        return {
            slot: currentSlot,
            participants: slotParticipants
        };
    };

    const currentSlotData = getCurrentInitiativeSlot();

    const handleSetActiveParticipant = (participantId: string) => {
        setActiveParticipantId(participantId);
    };

    const handleAdvanceTurn = () => {
        advanceTurn();
    };

    const handleSetInitiative = (updatedParticipants: Participant[]) => {
        transition('ENTER_STRUCTURED');
        transition('ROLL_INITIATIVE');

        updateParticipants(updatedParticipants);

        // Map participants to InitiativeSlot[] shape and sort them
        const order = updatedParticipants
            .filter((p) => p.initiative !== null) // Ensure all initiatives are present
            .map((p) => ({
                team: p.isPC ? "PC" : "NPC", // Map to the store's type
                initiative: p.initiative!,
                name: p.name,
                participantId: p.id,
            }))
            .sort((a, b) => b.initiative - a.initiative) as InitiativeSlot[]; // Sort descending

        setInitiativeOrder(order); // Update store

        transition('START_ENCOUNTER');
        
        // Explicitly start the turn sequence to ensure turnState is set to 'turn_start'
        setTimeout(() => {
            transition('START_TURN');
        }, 100);
    };

    return (
      <>
          {/* Left Area — round / turn status, then encounter / skill
            * challenge starters. Grouped so the parent Flex's
            * `justify="space-between"` pushes the whole left cluster against
            * the left edge instead of centring the starters. */}
          <HStack paddingLeft={4} spacing={3}>
            {state === 'inProgress' && (
                <Box>
                    <Text fontSize="sm" fontWeight="bold">Round: {context.round}</Text>

                    {/* Current Turn Phase */}
                    {turnState && (
                        <Text fontSize="sm">
                            {turnState === 'turn_start' ? 'Select active participant' :
                             turnState === 'turn_active' ? 'Taking actions' :
                             'Ending turn'}
                        </Text>
                    )}
                </Box>
            )}
            {/* Encounter / Skill Challenge starters — siblings since the two
              * modes of structured play are mutually exclusive. */}
            <HStack spacing={2}>
                <Button
                    size="sm"
                    bg="#d39939"
                    color="#1a1d24"
                    fontWeight="semibold"
                    borderRadius="md"
                    transition="all 0.15s ease"
                    _hover={{ bg: "#e3a948" }}
                    _active={{ bg: "#c08a30" }}
                    _disabled={{ opacity: 0.4, cursor: "not-allowed", _hover: { bg: "#d39939" } }}
                    onClick={handleRollInitiative}
                    isDisabled={participantCount === 0 || state === 'inProgress'}
                >
                    Roll Initiative
                </Button>
                <SkillChallengeStartButton/>
            </HStack>
          </HStack>

          {/* Turn management buttons */}
          {state === 'inProgress' && (
            <HStack spacing={2}>
                {/* Show set active buttons only in turn_start phase */}
                {turnState === 'turn_start' && currentSlotData && (
                    <HStack>
                        <Text fontSize="sm">Set Active:</Text>
                        {currentSlotData.participants.map(p => (
                            <Button 
                                key={p.id}
                                size="sm"
                                colorScheme={activeParticipantId === p.id ? "green" : "gray"}
                                onClick={() => handleSetActiveParticipant(p.id)}
                            >
                                {p.name}
                            </Button>
                        ))}
                    </HStack>
                )}
                
                {/* We're not showing these buttons anymore since we'll use the Next button in the toolbar */}
            </HStack>
          )}

          <InitiativeModal
              isOpen={isInitiativeModalOpen}
              participants={participants} // Pass current participants
              onClose={handleCloseModal}
              onSubmit={handleSetInitiative} // Handle initiative updates
          />
      </>
    );
}

export default ToolBarNonStructured