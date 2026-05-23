import React, {useState} from 'react'
import {
    Box,
    Button,
    Flex,
    HStack,
    IconButton,
} from "@chakra-ui/react";
import {ChevronLeftIcon, ChevronRightIcon, CloseIcon} from "@chakra-ui/icons";
import InitiativeOrder from "@components/turnbar/InitiativeOrder";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantsStore, {isParticipantDead} from "@/state/participantsStore";
import RoundNumberDisplay from "@components/turnbar/RoundNumberDisplay";
import EndEncounterModal from "@components/turnbar/EndEncounterModal";
import TurnActionsHint from "@components/turnbar/TurnActionsHint";

interface Props { }

const ToolBarStructured = ({ }: Props) => {

    const transition  = useGameplayStore((state) => state.transition);
    const { canTransition }  = useGameplayStore();
    const round = useGameplayStore((state) => state.context.round);
    const state = useGameplayStore((state) => state.state);
    const clearEncounterState = useGameplayStore((state) => state.clearEncounterState);

    const [isModalOpen, setModalOpen] = useState(false);

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    return (
        <Flex position="relative" align="center" justify="space-between" h="100%" w="100%" px={4}>
            {/* Left */}
            <HStack>
                <Button
                    size="sm"
                    leftIcon={<CloseIcon boxSize="2" />}
                    bg="#26292d"
                    color="whiteAlpha.700"
                    fontWeight="medium"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                    borderRadius="md"
                    transition="all 0.15s ease"
                    _hover={{bg: "#33363c", color: "white", borderColor: "whiteAlpha.300"}}
                    _active={{bg: "#1f2125"}}
                    onClick={openModal}
                    isDisabled={state !== 'inProgress'}
                >
                    End Encounter
                </Button>
                <EndEncounterModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onConfirm={({removeDeadNpcs, removeAllNpcs}) => {
                        const {participants, updateParticipants} = useParticipantsStore.getState();
                        if (removeAllNpcs) {
                            updateParticipants(participants.filter((p) => p.isPC));
                        } else if (removeDeadNpcs) {
                            updateParticipants(participants.filter((p) => p.isPC || !isParticipantDead(p)));
                        }
                        // Wipe initiative / active-participant scratch so it
                        // doesn't bleed into the next encounter's prep.
                        clearEncounterState();
                    }}
                />
            </HStack>

            {/* Center — pinned to the viewport's horizontal center, not the
              * toolbar's. The toolbar only spans the first three grid columns
              * (the log column on the right is excluded), so an "absolute,
              * left:50%" inside the toolbar sits left-of-screen-center.
              * Using position:fixed with left:50vw locks the cluster to the
              * actual screen center; the y-offset matches the toolbar's row
              * (50px header + 5px grid padding + 30px to the row centerline). */}
            {state === 'inProgress' && (
                <HStack
                    position="fixed"
                    left="50vw"
                    top="85px"
                    transform="translate(-50%, -50%)"
                    spacing={2}
                    zIndex={2}
                >
                    <IconButton
                        aria-label="Previous turn"
                        icon={<ChevronLeftIcon boxSize="4" />}
                        size="xs"
                        variant="ghost"
                        color="whiteAlpha.500"
                        transition="all 0.15s ease"
                        _hover={{bg: "whiteAlpha.100", color: "whiteAlpha.800"}}
                        _active={{bg: "whiteAlpha.50"}}
                        onClick={() => transition('PREV_TURN')}
                        isDisabled={!canTransition('PREV_TURN')}
                    />
                    <InitiativeOrder/>
                    <Button
                        size="xs"
                        rightIcon={<ChevronRightIcon boxSize="3.5" />}
                        bg="#d39939"
                        color="#1a1d24"
                        fontWeight="semibold"
                        borderRadius="md"
                        transition="all 0.15s ease"
                        _hover={{bg: "#e3a948"}}
                        _active={{bg: "#c08a30"}}
                        onClick={() => transition('NEXT_TURN')}
                        isDisabled={!canTransition('NEXT_TURN')}
                    >
                        Next
                    </Button>
                    <TurnActionsHint/>
                </HStack>
            )}

            {/* Right */}
            <HStack spacing={4}>
                <RoundNumberDisplay roundNumber={round}/>
            </HStack>
        </Flex>
    );
}

export default ToolBarStructured
