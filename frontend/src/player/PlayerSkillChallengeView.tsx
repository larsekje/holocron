import React from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import type { PlayerSkillChallenge } from "@/sync/snapshot";

const SUCCESS = "#3a7e57";
const FAILURE = "#b03030";
const ACCENT = "#d39939";

/** A row of pips, filled up to `value` of `max`. */
const Pips: React.FC<{ value: number; max: number; color: string }> = ({
  value,
  max,
  color,
}) => (
  <HStack spacing="6px" wrap="wrap" justify="center" maxW="80vw">
    {Array.from({ length: Math.max(max, value) }).map((_, i) => (
      <Box
        key={i}
        w={["14px", "18px"]}
        h={["14px", "18px"]}
        borderRadius="full"
        bg={i < value ? color : "transparent"}
        borderWidth="2px"
        borderColor={i < value ? color : "whiteAlpha.300"}
        boxShadow={i < value ? `0 0 8px ${color}` : "none"}
        transition="all 0.2s ease"
      />
    ))}
  </HStack>
);

const PlayerSkillChallengeView: React.FC<{ challenge: PlayerSkillChallenge }> = ({
  challenge: c,
}) => {
  const outcome =
    c.status === "won" ? "SUCCESS" : c.status === "lost" ? "FAILURE" : null;
  const outcomeColor = c.status === "won" ? SUCCESS : FAILURE;

  return (
    <VStack spacing={[6, 8]} px={4} textAlign="center">
      <VStack spacing={1}>
        <Text
          fontSize="sm"
          letterSpacing="0.25em"
          color="whiteAlpha.600"
          textTransform="uppercase"
        >
          Skill Challenge
        </Text>
        <Text fontSize={["2xl", "3xl", "4xl"]} fontWeight="extrabold" color="white">
          {c.name}
        </Text>
        {c.description && (
          <Text fontSize={["sm", "md"]} color="whiteAlpha.700" maxW="70vw">
            {c.description}
          </Text>
        )}
      </VStack>

      {outcome ? (
        <Text
          fontSize={["4xl", "5xl"]}
          fontWeight="extrabold"
          color={outcomeColor}
          textShadow={`0 0 24px ${outcomeColor}`}
          letterSpacing="0.1em"
        >
          {outcome}
        </Text>
      ) : (
        <VStack spacing={[5, 7]}>
          <VStack spacing={2}>
            <Text fontSize="sm" color={SUCCESS} letterSpacing="0.15em">
              SUCCESSES {c.successes}/{c.targetSuccesses}
            </Text>
            <Pips value={c.successes} max={c.targetSuccesses} color={SUCCESS} />
          </VStack>
          <VStack spacing={2}>
            <Text fontSize="sm" color={FAILURE} letterSpacing="0.15em">
              FAILURES {c.failures}/{c.allowedFailures}
            </Text>
            <Pips value={c.failures} max={c.allowedFailures} color={FAILURE} />
          </VStack>
        </VStack>
      )}

      {c.turnLimit != null && (
        <Text fontSize={["md", "lg"]} color={ACCENT} letterSpacing="0.1em">
          TURN {Math.min(c.currentTurn, c.turnLimit)} / {c.turnLimit}
        </Text>
      )}
    </VStack>
  );
};

export default PlayerSkillChallengeView;
