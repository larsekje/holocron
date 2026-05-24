import React from "react";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import type { PlayerParticipant } from "@/sync/snapshot";

const PC_COLOR = "#3a7e57";
const NPC_COLOR = "#b03030";
const ACTIVE = "#d39939";

/**
 * Read-only roster of who's in the fight, names only, with acted/active/down
 * state. The acted state is the answer to "who's already gone this round".
 */
const Chip: React.FC<{ p: PlayerParticipant }> = ({ p }) => {
  const teamColor = p.team === "PC" ? PC_COLOR : NPC_COLOR;
  return (
    <HStack
      spacing={2}
      px={3}
      py={1.5}
      borderRadius="full"
      borderWidth="1px"
      borderColor={p.active ? ACTIVE : "whiteAlpha.200"}
      bg={p.active ? "rgba(211,153,57,0.12)" : "blackAlpha.400"}
      boxShadow={p.active ? "0 0 0 1px #d39939, 0 0 14px rgba(211,153,57,0.4)" : "none"}
      opacity={p.down ? 0.4 : p.acted && !p.active ? 0.55 : 1}
      transition="all 0.2s ease"
    >
      <Box w="9px" h="9px" borderRadius="full" bg={teamColor} flexShrink={0} />
      <Text
        fontSize={["sm", "md"]}
        fontWeight={p.active ? "bold" : "medium"}
        color={p.active ? ACTIVE : "whiteAlpha.900"}
        textDecoration={p.down ? "line-through" : "none"}
        whiteSpace="nowrap"
      >
        {p.name}
      </Text>
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
