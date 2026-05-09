import React from 'react';
import {Box, Flex, Text, VStack} from "@chakra-ui/react";
import TargetCardOld from "@components/target/TargetCardOld";
import useParticipantStore, {Participant} from "@/state/participantsStore";
import useGameplayStore from "@/state/newGameplayStore";

function isParticipantDead(p: Participant): boolean {
  const stats = p.stats ?? {};
  const wt = stats.woundThreshold ?? (p.isPC ? 12 : 8);
  const wounds = stats.wounds ?? 0;
  if (stats.minions !== undefined) {
    const alive = Math.max(stats.minions - Math.floor(wounds / Math.max(wt, 1)), 0);
    return alive === 0;
  }
  return wounds >= wt;
}

const TargetListOld = () => {
  const participants = useParticipantStore((state) => state.participants);
  const selectedParticipantId = useParticipantStore((state) => state.selectedParticipantId);
  const selectParticipant = useParticipantStore((state) => state.selectParticipant);

  const activeParticipantId = useGameplayStore((state) => state.context.activeParticipantId);
  const initiativeOrder = useGameplayStore((state) => state.context.initiativeOrder);
  const currentTurnIndex = useGameplayStore((state) => state.context.currentTurnIndex);
  const actedParticipants = useGameplayStore((state) => state.context.actedParticipants);
  const isStructured = useGameplayStore((state) => state.context.mode === "structured");
  const setActiveParticipantId = useGameplayStore((state) => state.setActiveParticipantId);

  const initiativeByName: Record<string, number> = {};
  for (const slot of initiativeOrder ?? []) {
    if (slot?.name != null) initiativeByName[slot.name] = slot.initiative ?? 0;
  }

  const currentSlot = initiativeOrder?.[currentTurnIndex];
  const currentSlotTeam = currentSlot?.team;
  const eligibleFor = (isPC: boolean) =>
    isStructured && currentSlotTeam !== undefined && (isPC ? currentSlotTeam === "PC" : currentSlotTeam === "NPC");

  if (participants.length === 0) {
    return <Text color="gray.400">No targets — add adversaries from the header.</Text>;
  }

  const live: Participant[] = [];
  const dead: Participant[] = [];
  for (const p of participants) {
    (isParticipantDead(p) ? dead : live).push(p);
  }

  const inSelectingMode = isStructured && currentSlotTeam !== undefined;

  const renderRow = (participant: Participant) => {
    const hasActed = actedParticipants.includes(participant.id);
    const eligible = eligibleFor(participant.isPC);
    const isActive = participant.id === activeParticipantId;
    // In structured mode any row click changes the active participant.
    // Out of structured mode, click just selects so the Targeted card updates.
    const handleClick = () => {
      selectParticipant(participant.id);
      if (isStructured && !isActive) {
        setActiveParticipantId(participant.id);
      }
    };
    // Dim ineligible rows during structured mode so the GM sees at a glance who can take
    // the current slot. Active and eligible rows stay at full opacity.
    const dimmedForSelection = inSelectingMode && !eligible && !isActive;
    return (
      <TargetCardOld
        key={participant.id}
        participant={participant}
        isSelected={participant.id === selectedParticipantId}
        isActive={isActive}
        hasActed={hasActed}
        isEligible={eligible}
        dimmedForSelection={dimmedForSelection}
        initiative={initiativeByName[participant.name]}
        onClick={handleClick}
      />
    );
  };

  return (
    // Use the card body's full height so the graveyard can be pushed to the bottom.
    <Flex direction="column" h="100%" minH={0} gap="6px">
      <VStack align="stretch" spacing="6px">
        {live.map(renderRow)}
      </VStack>

      {dead.length > 0 && (
        // mt="auto" pins this section to the bottom of the available column space.
        <Box mt="auto">
          <Flex align="center" gap={2} mt={2} mb={1}>
            <Box flex="1" h="1px" bg="whiteAlpha.150"/>
            <Text
              as="b"
              fontSize="9px"
              letterSpacing="0.18em"
              textTransform="uppercase"
              color="whiteAlpha.500"
            >
              Graveyard ({dead.length})
            </Text>
            <Box flex="1" h="1px" bg="whiteAlpha.150"/>
          </Flex>
          <VStack align="stretch" spacing="6px" opacity={0.55}>
            {dead.map(renderRow)}
          </VStack>
        </Box>
      )}
    </Flex>
  );
};

export default TargetListOld;
