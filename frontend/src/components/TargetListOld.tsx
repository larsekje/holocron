import React, {useEffect, useRef, useState} from 'react';
import {Box, Collapse, Flex, Text, VStack} from "@chakra-ui/react";
import TargetCardOld from "@components/target/TargetCardOld";
import VehicleTargetCardOld from "@components/target/VehicleTargetCardOld";
import useParticipantStore, {Participant} from "@/state/participantsStore";
import useActiveVehicleStore, {isVehicleDead, type ActiveVehicle} from "@/state/activeVehicleStore";
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

// Graveyard expand/collapse timing — quick, but not instant. The
// scroll-into-view waits out the enter duration so it lands on the final,
// full-height position rather than a half-open one.
const GRAVEYARD_ENTER_S = 0.22;
const GRAVEYARD_EXIT_S = 0.16;

const TargetListOld = () => {
  const participants = useParticipantStore((state) => state.participants);
  const selectedParticipantId = useParticipantStore((state) => state.selectedParticipantId);
  const selectParticipant = useParticipantStore((state) => state.selectParticipant);

  const vehicles = useActiveVehicleStore((s) => s.vehicles);
  const vehicleList = Object.values(vehicles);
  const selectedVehicleId = useActiveVehicleStore((s) => s.selectedVehicleId);
  const selectVehicle = useActiveVehicleStore((s) => s.selectVehicle);

  const activeParticipantId = useGameplayStore((state) => state.context.activeParticipantId);
  const initiativeOrder = useGameplayStore((state) => state.context.initiativeOrder);
  const currentTurnIndex = useGameplayStore((state) => state.context.currentTurnIndex);
  const actedParticipants = useGameplayStore((state) => state.context.actedParticipants);
  const isStructured = useGameplayStore((state) => state.context.mode === "structured");
  const setActiveParticipantId = useGameplayStore((state) => state.setActiveParticipantId);

  // Graveyard starts collapsed — downed combatants are reference, not the
  // GM's working set. Click the header to expand.
  const [graveyardOpen, setGraveyardOpen] = useState(false);
  const graveyardRef = useRef<HTMLDivElement | null>(null);

  // On expand, keep the graveyard's bottom pinned to the viewport as it
  // slides open — re-aligning every animation frame for the duration of the
  // enter animation. The scroll then tracks the expansion in lockstep, so
  // the two read as one continuous motion rather than expand-then-jump.
  useEffect(() => {
    if (!graveyardOpen) return;
    let raf = 0;
    const start = performance.now();
    // Small buffer past the enter duration so the final frame lands after
    // Collapse has fully settled at its auto height.
    const runFor = GRAVEYARD_ENTER_S * 1000 + 60;
    const tick = (now: number) => {
      graveyardRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      if (now - start < runFor) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [graveyardOpen]);

  const currentSlot = initiativeOrder?.[currentTurnIndex];
  const currentSlotTeam = currentSlot?.team;
  const eligibleFor = (isPC: boolean) =>
    isStructured && currentSlotTeam !== undefined && (isPC ? currentSlotTeam === "PC" : currentSlotTeam === "NPC");

  const livePCs: Participant[] = [];
  const liveNPCs: Participant[] = [];
  const dead: Participant[] = [];
  for (const p of participants) {
    if (isParticipantDead(p)) dead.push(p);
    else if (p.isPC) livePCs.push(p);
    else liveNPCs.push(p);
  }
  const liveVehicles: ActiveVehicle[] = [];
  const deadVehicles: ActiveVehicle[] = [];
  for (const v of vehicleList) {
    if (isVehicleDead(v)) deadVehicles.push(v);
    else liveVehicles.push(v);
  }
  const graveyardCount = dead.length + deadVehicles.length;

  const inSelectingMode = isStructured && currentSlotTeam !== undefined;
  const activeParticipant = participants.find((p) => p.id === activeParticipantId);
  const activeIsPC = activeParticipant?.isPC;
  const isPickingActiveForSlot = inSelectingMode && !activeParticipantId;
  const isPickingTarget = isStructured && !!activeParticipantId;

  // While a slot is open and unclaimed (structured play, no active
  // participant yet), the slot's-team eligible-and-not-yet-acted rows get a
  // digit hotkey (render order) — a single press claims the slot. Once
  // someone is active, `pickable` is empty so the digits disappear and the
  // keys go inert; overriding the active character is done with the A verb
  // (see GlobalCombatHotkeys), which double-taps to confirm so a stray
  // keypress can't yank the active mid-turn.
  const pickable: Participant[] = inSelectingMode && !activeParticipantId
    ? (currentSlotTeam === "PC" ? livePCs : liveNPCs).filter(
        (p) => !actedParticipants.includes(p.id),
      )
    : [];
  const slotHotkeyById = new Map<string, number>();
  pickable.forEach((p, i) => {
    if (i < 9) slotHotkeyById.set(p.id, i + 1);
  });

  // Bound once per selecting-mode toggle; reads the latest pickable list via
  // a ref so it doesn't re-bind on every render.
  const pickableRef = useRef<Participant[]>([]);
  pickableRef.current = pickable;
  useEffect(() => {
    if (!inSelectingMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (!/^[1-9]$/.test(e.key)) return;
      const picked = pickableRef.current[parseInt(e.key, 10) - 1];
      if (!picked) return;
      e.preventDefault();
      // A single press claims the open slot. There's no override path here:
      // once someone is active, `pickable` is empty so this never fires.
      setActiveParticipantId(picked.id);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [inSelectingMode, setActiveParticipantId]);

  // Empty state. Must come AFTER every hook above: returning earlier would skip
  // the hooks below it (pickableRef / keyboard handler) and break the Rules of
  // Hooks the moment the first participant is added.
  if (participants.length === 0 && vehicleList.length === 0) {
    return <Text color="gray.400">No targets — add adversaries from the header.</Text>;
  }

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
        // Cross-clear: a participant and a vehicle can't both be the
        // "Targeted" entity at once.
        selectVehicle(null);
      }
    };
    // Dimming is reserved for one case only: while picking the actor for an
    // open slot, the wrong-team rows are dimmed. The old "dim allies during
    // target-picking" behavior was removed — GMs found the team-based fade
    // confusing.
    const dimmedForSelection =
      !isActive && isPickingActiveForSlot && !eligible;
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
        dimmedForSelection={dimmedForSelection}
        suppressActedDim={suppressActedDim}
        slotHotkey={slotHotkeyById.get(participant.id)}
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

      {liveVehicles.length > 0 && (
        <Box mt={livePCs.length > 0 || liveNPCs.length > 0 ? 3 : 0}>
          {sectionHeader('Ships and vehicles', liveVehicles.length)}
          <VStack align="stretch" spacing="6px">
            {liveVehicles.map((v) => (
              <VehicleTargetCardOld
                key={v.id}
                vehicle={v}
                isSelected={selectedVehicleId === v.id}
                onClick={() => {
                  selectVehicle(v.id);
                  // Cross-clear participant selection so the right pane
                  // shows the ship, not whoever was previously targeted.
                  selectParticipant(null);
                }}
              />
            ))}
          </VStack>
        </Box>
      )}

      {graveyardCount > 0 && (
        // mt="auto" pins this section to the bottom of the available column space.
        <Box mt="auto" ref={graveyardRef}>
          <Flex
            align="center"
            gap={2}
            mt={2}
            mb={1}
            cursor="pointer"
            role="button"
            aria-expanded={graveyardOpen}
            onClick={() => setGraveyardOpen((open) => !open)}
          >
            <Box flex="1" h="1px" bg="whiteAlpha.150"/>
            <Text
              as="b"
              fontSize="9px"
              letterSpacing="0.18em"
              textTransform="uppercase"
              color="whiteAlpha.500"
            >
              <Box
                as="span"
                display="inline-block"
                mr="3px"
                transform={graveyardOpen ? "rotate(90deg)" : "rotate(0deg)"}
                transition="transform 0.18s ease"
              >
                ▸
              </Box>
              Graveyard ({graveyardCount})
            </Text>
            <Box flex="1" h="1px" bg="whiteAlpha.150"/>
          </Flex>
          <Collapse
            in={graveyardOpen}
            animateOpacity
            transition={{
              enter: { duration: GRAVEYARD_ENTER_S },
              exit: { duration: GRAVEYARD_EXIT_S },
            }}
          >
            <VStack align="stretch" spacing="6px" opacity={0.55}>
              {dead.map(renderRow)}
              {deadVehicles.map((v) => (
                <VehicleTargetCardOld
                  key={v.id}
                  vehicle={v}
                  isSelected={selectedVehicleId === v.id}
                  onClick={() => {
                    selectVehicle(v.id);
                    selectParticipant(null);
                  }}
                />
              ))}
            </VStack>
          </Collapse>
        </Box>
      )}
    </Flex>
  );
};

export default TargetListOld;
