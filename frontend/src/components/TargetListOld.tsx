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

  const livePCs: Participant[] = [];
  const liveNPCs: Participant[] = [];
  const dead: Participant[] = [];
  for (const p of participants) {
    if (isParticipantDead(p)) dead.push(p);
    else if (p.isPC) livePCs.push(p);
    else liveNPCs.push(p);
  }

  const inSelectingMode = isStructured && currentSlotTeam !== undefined;
  const activeParticipant = participants.find((p) => p.id === activeParticipantId);
  const activeIsPC = activeParticipant?.isPC;
  const isPickingActiveForSlot = inSelectingMode && !activeParticipantId;
  const isPickingTarget = isStructured && !!activeParticipantId;

  const renderRow = (participant: Participant) => {
    const hasActed = actedParticipants.includes(participant.id);
    const eligible = eligibleFor(participant.isPC);
    const isActive = participant.id === activeParticipantId;
    // A row click does ONE of two things:
    //  - structured mode + no active yet → claim the active slot (no target
    //    change; the active participant isn't their own target)
    //  - otherwise → retarget (set the participant as the Targeted one)
    const handleClick = () => {
      if (isStructured && !activeParticipantId) {
        setActiveParticipantId(participant.id);
      } else {
        selectParticipant(participant.id);
      }
    };
    // Highlighting/dimming flips with phase:
    //  - picking-active (slot unclaimed) → dim ineligible (wrong team for slot)
    //  - picking-target (active claimed) → dim allies of the active so the
    //    GM's eye lands on the opposing side
    const dimmedForSelection = !isActive && (
      (isPickingActiveForSlot && !eligible) ||
      (isPickingTarget && participant.isPC === activeIsPC)
    );
    // While picking a target, opposing-team rows are valid candidates even
    // if they already acted this round. Suppress the "has acted" opacity dim
    // for them so they don't fade out.
    const suppressActedDim = isPickingTarget && participant.isPC !== activeIsPC;
    return (
      <TargetCardOld
        key={participant.id}
        participant={participant}
        isSelected={participant.id === selectedParticipantId}
        isActive={isActive}
        hasActed={hasActed}
        isEligible={eligible}
        dimmedForSelection={dimmedForSelection}
        suppressActedDim={suppressActedDim}
        initiative={initiativeByName[participant.name]}
        onClick={handleClick}
      />
    );
  };

  const sectionHeader = (label: string, count: number) => (
    <Flex align="center" gap={2} mb={1}>
      <Text
        as="b"
        fontSize="9px"
        letterSpacing="0.18em"
        textTransform="uppercase"
        color="whiteAlpha.500"
      >
        {label} ({count})
      </Text>
      <Box flex="1" h="1px" bg="whiteAlpha.100"/>
    </Flex>
  );

  return (
    // Use the card body's full height so the graveyard can be pushed to the bottom.
    <Flex direction="column" h="100%" minH={0} gap="6px">
      {livePCs.length > 0 && (
        <Box>
          {sectionHeader('Player Characters', livePCs.length)}
          <VStack align="stretch" spacing="6px">
            {livePCs.map(renderRow)}
          </VStack>
        </Box>
      )}

      {liveNPCs.length > 0 && (
        <Box mt={livePCs.length > 0 ? 3 : 0}>
          {sectionHeader('Adversaries', liveNPCs.length)}
          <VStack align="stretch" spacing="6px">
            {liveNPCs.map(renderRow)}
          </VStack>
        </Box>
      )}

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
