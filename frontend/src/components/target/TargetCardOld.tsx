import React, {useState} from 'react';
import {
  Box,
  Flex,
  HStack,
  Kbd,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Progress,
  Text,
  VStack,
} from "@chakra-ui/react";
import {BsThreeDotsVertical} from "react-icons/bs";
import {nanoid} from "nanoid";
import AdversaryTypeBadgeOld from "@components/target/AdversaryTypeBadgeOld";
import WoundBar from "@components/target/WoundBar";
import ApplyEffectsModal from "@components/effects/ApplyEffectsModal";
import CritRollerModal from "@components/crit/CritRollerModal";
import AttachVehicleModal from "@components/vehicle/AttachVehicleModal";
import {Participant} from "@/state/participantsStore";
import useParticipantStore, {teamOf} from "@/state/participantsStore";
import useGameplayStore from "@/state/newGameplayStore";
import {useEffectStore} from "@/state/effectStore";

interface Props {
  participant: Participant;
  isSelected: boolean;
  isActive: boolean;
  hasActed: boolean;
  // True when the row is for the wrong team in the current open slot. Renders dimmed.
  dimmedForSelection?: boolean;
  // Suppress the "has acted" opacity dim — used during target picking where
  // a participant who has already acted is still a valid attack target.
  suppressActedDim?: boolean;
  // 1-based hotkey shown while the GM is picking the actor for an open slot.
  slotHotkey?: number;
  onClick: () => void;
}

// Compact status indicator — a colour-coded dot + count. Renders nothing at
// 0. Replaces the old inline effect chips, which were too wide for the row.
const StatusDot: React.FC<{ color: string; count: number; label: string }> = ({
  color,
  count,
  label,
}) => {
  if (count <= 0) return null;
  return (
    <HStack spacing="2px" flexShrink={0} title={label}>
      <Box w="7px" h="7px" borderRadius="full" bg={color} flexShrink={0} />
      <Text fontSize="10px" fontWeight="bold" lineHeight="1" color="whiteAlpha.900">
        {count}
      </Text>
    </HStack>
  );
};

const TargetCardOld = ({
  participant,
  isSelected,
  isActive,
  hasActed,
  dimmedForSelection = false,
  suppressActedDim = false,
  slotHotkey,
  onClick,
}: Props) => {
  const stats = participant.stats || {};
  const woundThreshold = stats.woundThreshold ?? (participant.isPC ? 12 : 8);
  const wounds = stats.wounds ?? 0;
  const minions = stats.minions;
  const groupTotal = minions ? woundThreshold * minions : woundThreshold;
  const remaining = Math.max(groupTotal - wounds, 0);
  const type = stats.type ?? (participant.isPC ? "PC" : "Minion");

  const strainThreshold = stats.strainThreshold ?? (participant.isPC ? 14 : 0);
  const strain = (stats as Record<string, number>).strain ?? 0;
  const tracksStrain = participant.isPC || stats.type === "Nemesis";
  const strainRatio = strainThreshold > 0 ? Math.max(0, (strainThreshold - strain) / strainThreshold) * 100 : 0;

  const setActiveParticipantId = useGameplayStore((s) => s.setActiveParticipantId);
  const toggleActed = useGameplayStore((s) => s.toggleActedParticipant);
  const removeParticipant = useParticipantStore((s) => s.removeParticipant);
  const addParticipant = useParticipantStore((s) => s.addParticipant);
  const setSide = useParticipantStore((s) => s.setSide);
  const updateParticipants = useParticipantStore((s) => s.updateParticipants);
  const setStat = useParticipantStore((s) => s.setStat);
  const addWounds = useParticipantStore((s) => s.addWounds);

  const handleRename = () => {
    const next = window.prompt("Rename", participant.name);
    if (next == null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === participant.name) return;
    const all = useParticipantStore.getState().participants;
    updateParticipants(
      all.map((p) =>
        p.id === participant.id
          ? // Capture the original on the first rename only — keep it stable
            // across later renames so the subtitle always shows the true
            // original.
            { ...p, name: trimmed, originalName: p.originalName ?? p.name }
          : p,
      ),
    );
  };

  const handleDuplicate = () => {
    // Deep clone so the copy doesn't share nested objects (stats, dicePouch,
    // criticalInjuries). All of those are plain data, so JSON round-trips
    // cleanly. addParticipant fills in any missing defaults.
    const clone: Participant = JSON.parse(JSON.stringify(participant));
    clone.id = nanoid();
    clone.name = `${participant.name} (copy)`;
    // The copy is its own thing — don't inherit a rename history.
    clone.originalName = undefined;
    addParticipant(clone);
  };

  // Counts behind the compact status dots.
  const allEffects = useEffectStore((s) => s.effects);
  const effectsCount = allEffects.filter(
    (ae) => ae.target?.type === "character" && ae.target.participantId === participant.id,
  ).length;
  const critCount = participant.criticalInjuries?.length ?? 0;
  const pouchCount = participant.dicePouch
    ? Object.values(participant.dicePouch).reduce((sum, n) => sum + (n ?? 0), 0)
    : 0;

  const [effectsOpen, setEffectsOpen] = useState(false);
  const [critOpen, setCritOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  // ── Visual states ───────────────────────────────────────────────────────
  // Three independent, non-competing channels so a row reads at a glance:
  //   • Active (whose turn)  → gold left edge + faint gold tint + ACTIVE badge
  //   • Targeted (selected)  → blue border + faint blue tint
  //   • Has acted            → dimmed + strikethrough name
  // dimmedForSelection (wrong team for the open slot) dims hardest — it's a
  // transient state during slot picking. suppressActedDim keeps an already-
  // acted row full-strength while it's still a valid attack target.
  const opacity = dimmedForSelection
    ? 0.3
    : hasActed && !suppressActedDim
    ? 0.5
    : 1;
  const isDead = remaining <= 0;
  // Active = gold, Targeted = blue — deliberately different hues so the two
  // never read as the same thing.
  const cardBg = isActive ? "#322e22" : isSelected ? "#252a33" : "#26292d";
  const cardBorder = isSelected ? "#5fa3ff" : "whiteAlpha.100";

  return (
    <>
      <Flex
        h="40px"
        bg={cardBg}
        borderRadius="md"
        overflow="hidden"
        borderWidth="1px"
        borderColor={cardBorder}
        opacity={opacity}
        transition="opacity 0.1s ease, background 0.1s ease"
        position="relative"
      >
        {/* Left edge — gold marks the active participant, blue the targeted
            one (active wins if a row is somehow both). Fixed 4px, transparent
            when neither, so rows stay aligned. */}
        <Box
          w="4px"
          h="100%"
          flexShrink={0}
          bg={isActive ? "#f1c043" : isSelected ? "#5fa3ff" : "transparent"}
        />

        {/* Initiative-slot hotkey — overlaid in the upper-left corner so it
            never shifts the row's contents. Only while picking the actor for
            an open, unclaimed slot. A single press claims it. */}
        {slotHotkey != null && (
          <Kbd
            position="absolute"
            top="2px"
            left="2px"
            zIndex={2}
            bg="gray.700"
            color="gray.100"
            borderColor="whiteAlpha.300"
            fontSize="xs"
            px="6px"
            lineHeight="1.3"
          >
            {slotHotkey}
          </Kbd>
        )}

        {/* Health bar spans the whole row; the dice icon, name, status dots
            and wound count are overlaid on top of it. */}
        <Box flex="1" position="relative" h="100%" onClick={onClick} cursor="pointer" overflow="hidden">
          {/* Wound bar — fills the upper portion when strain is shown, else full height */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h={tracksStrain && strainThreshold > 0 ? "calc(100% - 8px)" : "100%"}
            bg="#1a1d21"
          >
            <WoundBar wounds={wounds} total={groupTotal} minions={minions}/>
          </Box>
          {/* Strain sliver — 8px tall, blue */}
          {tracksStrain && strainThreshold > 0 && (
            <Box position="absolute" bottom={0} left={0} right={0} h="8px" bg="#0e1622">
              <Progress
                value={strainRatio}
                colorScheme="blue"
                bg="#0e1622"
                h="100%"
                size="sm"
              />
            </Box>
          )}

          <HStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            h={tracksStrain && strainThreshold > 0 ? "calc(100% - 8px)" : "100%"}
            pl={2}
            pr={3}
            justify="space-between"
            color="white"
            spacing={2}
          >
            <HStack spacing={2} minW={0} flex="1">
              {/* Dice icon (adversary tier) in front of the name. */}
              <Box w="24px" h="24px" flexShrink={0}>
                <AdversaryTypeBadgeOld type={type} isPC={participant.isPC}/>
              </Box>
              <VStack align="start" spacing={0} minW={0}>
                <Text
                  userSelect="none"
                  noOfLines={1}
                  fontWeight={hasActed ? "normal" : "semibold"}
                  textDecoration={hasActed || isDead ? "line-through" : "none"}
                  textShadow="0 1px 2px rgba(0,0,0,0.7)"
                  lineHeight="1.15"
                >
                  {participant.name}
                </Text>
                {participant.originalName &&
                  participant.originalName !== participant.name && (
                    <Text
                      userSelect="none"
                      noOfLines={1}
                      fontSize="2xs"
                      color="whiteAlpha.500"
                      lineHeight="1"
                      textShadow="0 1px 2px rgba(0,0,0,0.7)"
                    >
                      {participant.originalName}
                    </Text>
                  )}
              </VStack>
              {isActive && (
                <Box
                  px="6px"
                  py="1px"
                  bg="#f1c043"
                  color="#1a1d24"
                  fontSize="9px"
                  fontWeight="extrabold"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  borderRadius="sm"
                  flexShrink={0}
                >
                  Active
                </Box>
              )}
            </HStack>
            <HStack spacing={2} flexShrink={0} textShadow="0 1px 2px rgba(0,0,0,0.7)">
              {/* Compact status indicators — effect / crit / pouch counts */}
              <StatusDot color="#9b6fce" count={effectsCount} label={`${effectsCount} ongoing effect(s)`} />
              <StatusDot color="#e06b6b" count={critCount} label={`${critCount} critical injury/injuries`} />
              <StatusDot color="#d9b14a" count={pouchCount} label={`${pouchCount} symbol(s) in pouch`} />
              <HStack spacing={0}>
                <Text fontWeight="bold" fontSize="md" lineHeight="1">{remaining}</Text>
                <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1">/{groupTotal}</Text>
              </HStack>
            </HStack>
          </HStack>
        </Box>

        {/* Context menu — narrow button. `as={Center}` only swaps the DOM
            element, NOT Center's flex-centering recipe, so the centering
            props have to be set explicitly here. */}
        <Menu placement="bottom-end" isLazy>
          <MenuButton
            as={Box}
            role="button"
            aria-label="More actions"
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="24px"
            h="100%"
            bg="#1c1e21"
            color="whiteAlpha.600"
            cursor="pointer"
            flexShrink={0}
            _hover={{bg: "yellow.500", color: "gray.900"}}
            transition="background 0.1s ease, color 0.1s ease"
          >
            <BsThreeDotsVertical size={13}/>
          </MenuButton>
          <Portal>
          <MenuList
            bg="#1f2125"
            borderColor="whiteAlpha.200"
            color="gray.100"
            minW="180px"
            py={1}
            boxShadow="0 14px 32px rgba(0,0,0,0.6)"
            zIndex={9999}
            sx={{
              // Tighter than Chakra's default — the GM doesn't need a big menu.
              "& button": { fontSize: "sm", paddingTop: "5px", paddingBottom: "5px" },
            }}
          >
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              isDisabled={isActive}
              onClick={() => setActiveParticipantId(participant.id)}
            >
              Set Active
            </MenuItem>
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              onClick={() => toggleActed(participant.id)}
            >
              {hasActed ? "Mark as not acted" : "Mark as acted"}
            </MenuItem>
            <MenuDivider borderColor="whiteAlpha.200"/>
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              onClick={handleRename}
            >
              Rename…
            </MenuItem>
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              onClick={handleDuplicate}
            >
              Duplicate
            </MenuItem>
            {!participant.isPC && (
              <MenuItem
                bg="transparent"
                _hover={{bg: "whiteAlpha.100"}}
                onClick={() => setSide(participant.id, teamOf(participant) === "PC" ? "NPC" : "PC")}
              >
                {teamOf(participant) === "PC" ? "Make adversary" : "Make companion (party side)"}
              </MenuItem>
            )}
            {/* Only offer attaching while the character isn't already aboard
                a ship — mirrors the rocket button on the full stat sheet. */}
            {!participant.equippedVehicleId && (
              <MenuItem
                bg="transparent"
                _hover={{bg: "whiteAlpha.100"}}
                onClick={() => setAttachOpen(true)}
              >
                Attach ship…
              </MenuItem>
            )}
            <MenuDivider borderColor="whiteAlpha.200"/>
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              onClick={() => setEffectsOpen(true)}
            >
              Apply effect…
            </MenuItem>
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              onClick={() => setCritOpen(true)}
            >
              Roll critical injury…
            </MenuItem>
            <MenuDivider borderColor="whiteAlpha.200"/>
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              onClick={() => addWounds(participant.id, 5)}
            >
              +5 wounds
            </MenuItem>
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              color="red.300"
              onClick={() => setStat(participant.id, "wounds", groupTotal)}
            >
              {minions ? "Wipe out group" : "Kill"}
            </MenuItem>
            <MenuItem
              bg="transparent"
              _hover={{bg: "whiteAlpha.100"}}
              color="red.400"
              onClick={() => removeParticipant(participant.id)}
            >
              Remove from encounter
            </MenuItem>
          </MenuList>
          </Portal>
        </Menu>
      </Flex>

      <ApplyEffectsModal
        isOpen={effectsOpen}
        onClose={() => setEffectsOpen(false)}
        participant={participant}
      />
      <CritRollerModal
        isOpen={critOpen}
        onClose={() => setCritOpen(false)}
        participantId={participant.id}
      />
      <AttachVehicleModal
        isOpen={attachOpen}
        onClose={() => setAttachOpen(false)}
        participant={participant}
      />
    </>
  );
};

export default TargetCardOld;
