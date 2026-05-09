import React, {useState} from 'react';
import {
  Box,
  Center,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Progress,
  Text,
} from "@chakra-ui/react";
import AdversaryTypeBadgeOld from "@components/target/AdversaryTypeBadgeOld";
import ApplyEffectsModal from "@components/effects/ApplyEffectsModal";
import CritRollerModal from "@components/crit/CritRollerModal";
import {Participant} from "@/state/participantsStore";
import useParticipantStore from "@/state/participantsStore";
import useGameplayStore from "@/state/newGameplayStore";
import {useEffectStore} from "@/state/effectStore";

interface Props {
  participant: Participant;
  isSelected: boolean;
  isActive: boolean;
  hasActed: boolean;
  isEligible: boolean;
  // True when the row is for the wrong team in the current open slot. Renders dimmed.
  dimmedForSelection?: boolean;
  // Suppress the "has acted" opacity dim — used during target picking where
  // a participant who has already acted is still a valid attack target.
  suppressActedDim?: boolean;
  initiative?: number;
  onClick: () => void;
}

// Tier color → left edge accent + type-square bg.
function tierColor(type: string, isPC: boolean): {bg: string; accent: string} {
  if (isPC) return {bg: "#2f5d3a", accent: "#3a7e57"};
  switch (type.toLowerCase()) {
    case "minion": return {bg: "#3a3f47", accent: "#5b6470"};
    case "rival": return {bg: "#7a4520", accent: "#c75a30"};
    case "nemesis": return {bg: "#6e2727", accent: "#b03030"};
    default: return {bg: "#3a3f47", accent: "#5b6470"};
  }
}

const TargetCardOld = ({
  participant,
  isSelected,
  isActive,
  hasActed,
  isEligible,
  dimmedForSelection = false,
  suppressActedDim = false,
  initiative,
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
  const setStat = useParticipantStore((s) => s.setStat);
  const addWounds = useParticipantStore((s) => s.addWounds);

  // Status effects targeted at this participant.
  const allEffects = useEffectStore((s) => s.effects);
  const statusEffects = allEffects.filter(
    (ae) => ae.target?.type === "character" && ae.target.participantId === participant.id,
  );

  const [effectsOpen, setEffectsOpen] = useState(false);
  const [critOpen, setCritOpen] = useState(false);

  const tier = tierColor(type, participant.isPC);

  // Visual states. dimmedForSelection takes priority over hasActed-dim because the GM is
  // making a fresh choice and "wrong team" is more important to surface.
  // suppressActedDim wins over hasActed — used during target picking where an
  // already-acted adversary is still a valid target and shouldn't fade.
  const opacity = dimmedForSelection ? 0.35 : (hasActed && !suppressActedDim) ? 0.5 : 1;
  const isDead = remaining <= 0;
  const leftEdgeColor = isActive
    ? "#f1c043"            // active: yellow (thick)
    : isEligible && !hasActed
    ? "#5fa3ff"            // eligible: blue
    : "transparent";
  const leftEdgeWidth = isActive ? "5px" : "3px";
  // Active rows get a yellow tint so they can't be missed even at a glance.
  const cardBg = isActive ? "#3a3324" : isSelected ? "#33363c" : "#26292d";
  const cardBorder = isActive
    ? "#f1c043"
    : isSelected
    ? "yellow.500"
    : "whiteAlpha.100";

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
        {/* Left active/eligible edge */}
        <Box w={leftEdgeWidth} h="100%" bg={leftEdgeColor}/>

        {/* Tier square with type icon */}
        <Center
          w="40px"
          h="100%"
          bg={tier.bg}
          flexShrink={0}
          onClick={onClick}
          cursor="pointer"
          position="relative"
          _hover={{bg: tier.accent}}
        >
          <Box w="22px" h="22px">
            <AdversaryTypeBadgeOld type={type} isPC={participant.isPC}/>
          </Box>
          {hasActed && (
            <Center
              position="absolute"
              top={0}
              right={0}
              w="14px"
              h="14px"
              bg="green.600"
              borderBottomLeftRadius="md"
              fontSize="9px"
              fontWeight="bold"
              color="white"
            >
              ✓
            </Center>
          )}
        </Center>

        {/* Initiative slot */}
        <Center
          w="32px"
          h="100%"
          bg="#1c1e21"
          flexShrink={0}
          flexDirection="column"
          onClick={onClick}
          cursor="pointer"
        >
          <Text fontSize="10px" color="whiteAlpha.500" lineHeight="1" letterSpacing="0.05em">
            INIT
          </Text>
          <Text fontWeight="bold" color="white" fontSize="md" lineHeight="1.1">
            {initiative ?? "—"}
          </Text>
        </Center>

        {/* Wound bar (segmented for minions) with optional strain sliver below + name overlay */}
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
            {minions && minions > 1
              ? renderMinionWoundSegments(wounds, woundThreshold, minions)
              : (
                <Progress
                  value={woundThreshold > 0 ? Math.max(0, (woundThreshold - wounds) / woundThreshold) * 100 : 0}
                  colorScheme="green"
                  bg="#1a1d21"
                  h="100%"
                />
              )}
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
            px={3}
            justify="space-between"
            color="white"
            spacing={2}
          >
            <HStack spacing={2} minW={0} flex="1">
              <Text
                userSelect="none"
                noOfLines={1}
                fontWeight={hasActed ? "normal" : "semibold"}
                textDecoration={hasActed || isDead ? "line-through" : "none"}
                textShadow="0 1px 2px rgba(0,0,0,0.7)"
              >
                {participant.name}
              </Text>
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
              {statusEffects.length > 0 && (
                <HStack spacing={1} flexShrink={0}>
                  {statusEffects.slice(0, 3).map((ae, i) => (
                    <Box
                      key={`${ae.id}-${i}`}
                      px="6px"
                      py="1px"
                      bg="#5a2f8a"
                      color="white"
                      fontSize="9px"
                      fontWeight="bold"
                      letterSpacing="0.06em"
                      textTransform="uppercase"
                      borderRadius="sm"
                      title={ae.effect.description ?? ae.effect.name}
                    >
                      {ae.effect.name}
                      {typeof ae.remainingDuration === "number" ? ` ${ae.remainingDuration}` : ""}
                    </Box>
                  ))}
                  {statusEffects.length > 3 && (
                    <Box
                      px="6px"
                      py="1px"
                      bg="#5a2f8a"
                      color="white"
                      fontSize="9px"
                      fontWeight="bold"
                      borderRadius="sm"
                    >
                      +{statusEffects.length - 3}
                    </Box>
                  )}
                </HStack>
              )}
            </HStack>
            <HStack spacing={0} flexShrink={0} textShadow="0 1px 2px rgba(0,0,0,0.7)">
              <Text fontWeight="bold" fontSize="md" lineHeight="1">{remaining}</Text>
              <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1">/{groupTotal}</Text>
            </HStack>
          </HStack>
        </Box>

        {/* Context menu — visible button with prominent hover */}
        <Menu placement="bottom-end" isLazy>
          <MenuButton
            as={Center}
            role="button"
            aria-label="More actions"
            w="36px"
            h="100%"
            bg="#1c1e21"
            color="whiteAlpha.700"
            cursor="pointer"
            flexShrink={0}
            _hover={{bg: "yellow.500", color: "gray.900"}}
            transition="background 0.1s ease, color 0.1s ease"
          >
            <Text fontSize="lg" fontWeight="bold" lineHeight="1" letterSpacing="-0.05em">⋮</Text>
          </MenuButton>
          <Portal>
          <MenuList
            bg="#1f2125"
            borderColor="whiteAlpha.200"
            color="gray.100"
            minW="220px"
            boxShadow="0 14px 32px rgba(0,0,0,0.6)"
            zIndex={9999}
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
    </>
  );
};

// Render N progress segments side-by-side for minion groups. Right-most segments fill
// first as wounds accrue, so each filled segment "kills" one minion visually.
function renderMinionWoundSegments(current: number, perMinion: number, minions: number): React.ReactNode {
  const segments: React.ReactNode[] = [];
  for (let i = 0; i < minions; i++) {
    const woundsRemaining = perMinion * minions - current;
    const cappedRemaining = Math.max(Math.min(woundsRemaining - i * perMinion, perMinion), 0);
    const remainingPct = perMinion > 0 ? (cappedRemaining / perMinion) * 100 : 0;
    segments.unshift(
      <Box key={i} flex="1" h="100%" bg="#1a1d21" position="relative" overflow="hidden">
        <Progress
          value={remainingPct}
          colorScheme="green"
          bg="transparent"
          h="100%"
        />
      </Box>,
    );
  }
  return (
    <HStack spacing="2px" h="100%" w="100%">
      {segments}
    </HStack>
  );
}

export default TargetCardOld;
