import React from "react";
import { Text, VStack } from "@chakra-ui/react";

/**
 * Big, readable round counter for the player view (TV / phone scale). Mirrors
 * the GM's RoundNumberDisplay, just larger.
 */
const PlayerRound: React.FC<{ round: number }> = ({ round }) => (
  <VStack spacing={0} align="center">
    <Text
      color="white"
      fontSize={["5xl", "6xl", "7xl"]}
      fontWeight="extrabold"
      lineHeight="1"
    >
      {round}
    </Text>
    <Text
      color="gray.400"
      fontSize={["sm", "md"]}
      lineHeight="1"
      letterSpacing="widest"
    >
      ROUND
    </Text>
  </VStack>
);

export default PlayerRound;
