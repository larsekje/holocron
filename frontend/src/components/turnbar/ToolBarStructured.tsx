import React, {useState} from 'react'
import {
    Box,
    Button,
    Flex,
    HStack,
} from "@chakra-ui/react";
import InitiativeOrder from "@components/turnbar/InitiativeOrder";
import useGameplayStore from "@/state/newGameplayStore";
import RoundNumberDisplay from "@components/turnbar/RoundNumberDisplay";
import EndEncounterModal from "@components/turnbar/EndEncounterModal";
import TurnActionsHint from "@components/turnbar/TurnActionsHint";

interface Props { }

const ToolBarStructured = ({ }: Props) => {

    const transition  = useGameplayStore((state) => state.transition);
    const { canTransition }  = useGameplayStore();
    const round = useGameplayStore((state) => state.context.round);
    const state = useGameplayStore((state) => state.state);

    const [isModalOpen, setModalOpen] = useState(false);

    const openModal = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);

    return (
        <Flex position="relative" align="center" justify="space-between" h="100%" w="100%" px={4}>
            {/* Left */}
            <HStack>
                <Button
                    size="sm"
                    bg="#3a1c1c"
                    color="#ffd2d2"
                    borderWidth="1px"
                    borderColor="#7a3535"
                    _hover={{bg: "#5a2a2a", color: "white"}}
                    onClick={openModal}
                    isDisabled={state !== 'inProgress'}
                >
                    End Encounter
                </Button>
                <EndEncounterModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onConfirm={() => console.log("Confirmed")}
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
                    <Button
                        size="sm"
                        bg="#26292d"
                        color="whiteAlpha.800"
                        borderWidth="1px"
                        borderColor="whiteAlpha.150"
                        _hover={{bg: "#33363c", color: "white"}}
                        onClick={() => transition('PREV_TURN')}
                        isDisabled={!canTransition('PREV_TURN')}
                    >
                        Previous
                    </Button>
                    <InitiativeOrder/>
                    <Button
                        size="sm"
                        bg="#d39939"
                        color="#1a1d24"
                        fontWeight="bold"
                        letterSpacing="0.04em"
                        _hover={{bg: "yellow.400"}}
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
