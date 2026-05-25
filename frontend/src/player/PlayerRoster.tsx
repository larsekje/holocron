import React from "react";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import type { PlayerParticipant } from "@/sync/snapshot";
import ChipShatter from "./ChipShatter";

const PC_COLOR = "#3a7e57";
const NPC_COLOR = "#b03030";
const ACTIVE = "#d39939";
// Solid chip surfaces so the chip reads as a real plane and broken-off shards
// (filled with the same color) look like fragments of it. ACTIVE_BG is the gold
// active tint pre-composited over CHIP_BG so it stays opaque.
const CHIP_BG = "#0f131c";
const ACTIVE_BG = "#272320";

/**
 * Read-only roster of who's in the fight: names with acted/active/down state and
 * a ×N count for minion groups. For individuals the chip carries a red shatter
 * that grows with damage (a silent reminder of the GM's narration) — thin
 * fissures when hurt, the chip fully shattered with a pulsing red glow on its
 * last leg. Red so it reads on the dark table screen.
 */
const Chip: React.FC<{ p: PlayerParticipant }> = ({ p }) => {
  const teamColor = p.team === "PC" ? PC_COLOR : NPC_COLOR;
  const individual = !p.down && p.groupTotal == null;
  const shatter = individual && p.health != null && p.health !== "unhurt" ? p.health : null;
  const critical = shatter === "critical";
  return (
    <Box
      position="relative"
      overflow="visible"
      px={3}
      py={1.5}
      borderRadius="full"
      borderWidth="1px"
      borderColor={p.active ? ACTIVE : critical ? "#e2474788" : "whiteAlpha.200"}
      bg={p.active ? ACTIVE_BG : CHIP_BG}
      boxShadow={
        critical
          ? "0 0 16px rgba(226,71,71,0.55)"
          : p.active
          ? "0 0 14px rgba(211,153,57,0.4)"
          : "none"
      }
      opacity={p.down ? 0.4 : p.acted && !p.active ? 0.55 : 1}
      transition="all 0.2s ease"
    >
      <HStack spacing={2}>
        <Box w="9px" h="9px" borderRadius="full" bg={teamColor} flexShrink={0} />
        <Text
          fontSize={["sm", "md"]}
          fontWeight={p.active ? "bold" : "medium"}
          color={p.active ? ACTIVE : "whiteAlpha.900"}
          textDecoration={p.down ? "line-through" : "none"}
          whiteSpace="nowrap"
          textShadow="0 1px 3px rgba(0,0,0,0.85)"
        >
          {p.name}
        </Text>
        {/* Minion group size — thins out as the group is whittled down. */}
        {p.groupTotal != null && !p.down && (
          <Box
            px={2.5}
            py={0.5}
            borderRadius="md"
            bg={`${teamColor}33`}
            borderWidth="1px"
            borderColor={`${teamColor}88`}
          >
            <Text fontSize={["lg", "xl"]} fontWeight="extrabold" color={teamColor} lineHeight="1">
              ×{p.groupAlive ?? p.groupTotal}
            </Text>
          </Box>
        )}
        {/* status marker */}
        {p.down ? (
          <Text fontSize="xs" color="whiteAlpha.500" letterSpacing="0.08em">
            DOWN
          </Text>
        ) : p.active ? (
          <Text fontSize="sm" color={ACTIVE}>
            ▲
          </Text>
        ) : p.acted ? (
          <Text fontSize="sm" color="whiteAlpha.500">
            ✓
          </Text>
        ) : null}
      </HStack>

      {/* Slim wound-bar beneath the name; only for damaged individuals. */}
      {shatter && <ChipShatter state={shatter} />}
    </Box>
  );
};

const PlayerRoster: React.FC<{ participants: PlayerParticipant[] }> = ({
  participants,
}) => {
  if (participants.length === 0) return null;
  return (
    <Flex wrap="wrap" justify="center" gap={2} maxW="92vw">
      {participants.map((p, i) => (
        <Chip key={`${p.name}-${i}`} p={p} />
      ))}
    </Flex>
  );
};

export default PlayerRoster;
