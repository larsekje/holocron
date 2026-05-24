import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import type { PlayerSlot } from "@/sync/snapshot";

/**
 * Read-only, TV/phone-scale mirror of the GM's InitiativeOrder bar. Standalone
 * by design — it must NOT import any zustand store. Shows who acted in each slot
 * this round (history). Turn control lives in the separate End-turn button.
 */
const PC_COLOR = "#3a7e57";
const NPC_COLOR = "#b03030";
const ACTIVE = "#d39939";

const PlayerInitiativeBar: React.FC<{ slots: PlayerSlot[] }> = ({ slots }) => (
  <HStack spacing="10px" align="end" px={4} maxW="96vw" overflowX="auto" justify="center" wrap="nowrap">
    {slots.map((slot, i) => {
      const teamColor = slot.team === "PC" ? PC_COLOR : NPC_COLOR;
      return (
        <Box key={i} position="relative" flexShrink={0}>
          <Box
            position="relative"
            w={["72px", "100px", "120px"]}
            h={["56px", "72px", "88px"]}
            bg="#221c1d"
            borderWidth="2px"
            borderColor={slot.active ? ACTIVE : "whiteAlpha.200"}
            borderRadius="md"
            boxShadow={
              slot.active ? "0 0 0 2px #d39939, 0 6px 18px rgba(211,153,57,0.45)" : "none"
            }
            opacity={slot.down ? 0.35 : slot.past ? 0.55 : 1}
            transition="all 0.2s ease"
            overflow="hidden"
          >
            {/* Team-coloured cap */}
            <Box position="absolute" top={0} left={0} right={0} h="10px" bg={teamColor} opacity={slot.down ? 0.5 : 1} />
            {/* Team label */}
            <Text
              position="absolute"
              top="42%"
              left={0}
              right={0}
              textAlign="center"
              fontSize={["lg", "xl", "2xl"]}
              fontWeight="bold"
              letterSpacing="0.14em"
              color={slot.active ? ACTIVE : "whiteAlpha.800"}
              lineHeight="1"
              textDecoration={slot.down ? "line-through" : "none"}
            >
              {slot.team}
            </Text>
            {/* Active arrow */}
            {slot.active && !slot.down && (
              <Text position="absolute" bottom="6px" left="50%" transform="translateX(-50%)" fontSize={["sm", "md"]} color={ACTIVE} lineHeight="1">
                ▲
              </Text>
            )}
            {/* Down marker */}
            {slot.down && (
              <Text position="absolute" bottom="5px" left="50%" transform="translateX(-50%)" fontSize="xs" color="whiteAlpha.500" letterSpacing="0.10em" lineHeight="1">
                DOWN
              </Text>
            )}
          </Box>
          {/* Who acted here this round (history): active = gold, past = muted. */}
          <Text
            mt="4px"
            textAlign="center"
            fontSize={["2xs", "xs"]}
            fontWeight={slot.active ? "bold" : "medium"}
            color={slot.active ? ACTIVE : "whiteAlpha.600"}
            noOfLines={1}
            maxW={["72px", "100px", "120px"]}
            minH="1em"
            lineHeight="1"
          >
            {slot.actorName ?? ""}
          </Text>
        </Box>
      );
    })}
  </HStack>
);

export default PlayerInitiativeBar;
