import React from "react";
import { Button, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react";

interface Pick {
  id: string;
  name: string;
}

/**
 * Player turn controls:
 *  - When a PC slot is open (no one chosen yet), shows a "who's up?" list of
 *    eligible PCs; tapping a name sets that player active (GM can override).
 *  - When a PC is acting, shows an explicit "End turn" button.
 * NPC turns show nothing — the GM drives those.
 */
const PlayerTurnControls: React.FC<{
  picks: Pick[] | null;
  activeName: string | null;
  onPick: (id: string) => void;
  onEndTurn: () => void;
}> = ({ picks, activeName, onPick, onEndTurn }) => {
  if (picks) {
    if (picks.length === 0) return null;
    return (
      <VStack spacing={3}>
        <Text fontSize={["sm", "md"]} color="whiteAlpha.700" letterSpacing="0.12em">
          WHO'S ACTING?
        </Text>
        <Wrap justify="center" spacing={3} maxW="92vw">
          {picks.map((p) => (
            <WrapItem key={p.id}>
              <Button
                size="lg"
                colorScheme="green"
                variant="outline"
                borderWidth="2px"
                onClick={() => onPick(p.id)}
                sx={{ touchAction: "manipulation" }}
              >
                {p.name}
              </Button>
            </WrapItem>
          ))}
        </Wrap>
      </VStack>
    );
  }

  if (activeName) {
    return (
      <VStack spacing={2}>
        <Text fontSize="sm" color="whiteAlpha.600">
          {activeName}&rsquo;s turn
        </Text>
        <Button
          size="lg"
          colorScheme="orange"
          px={10}
          onClick={onEndTurn}
          sx={{ touchAction: "manipulation" }}
        >
          End turn
        </Button>
      </VStack>
    );
  }

  return null;
};

export default PlayerTurnControls;
