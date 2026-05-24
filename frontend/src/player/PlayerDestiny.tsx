import React from "react";
import { Box, HStack, Text } from "@chakra-ui/react";

const LIGHT = "#dfe9ff";
const DARK = "#c0392b";

/**
 * The table's Destiny pool. One tappable pip per point (true = Light); tapping
 * sends a flip back to the GM. Order matches the GM's array so the index lines
 * up. Renders nothing when the pool is empty or the GM has it toggled off.
 */
const PlayerDestiny: React.FC<{
  pool: boolean[];
  onFlip: (index: number) => void;
}> = ({ pool, onFlip }) => {
  if (pool.length === 0) return null;
  return (
    <HStack
      spacing={3}
      px={4}
      py={1.5}
      borderRadius="full"
      bg="blackAlpha.600"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      pointerEvents="auto"
    >
      <Text fontSize="2xs" letterSpacing="0.18em" color="whiteAlpha.700">
        DESTINY
      </Text>
      <HStack spacing="2px">
        {pool.map((isLight, i) => (
          // Comfortable 44px touch target; the visible pip sits inside it.
          <Box
            key={i}
            as="button"
            aria-label={`Flip ${isLight ? "Light" : "Dark"} destiny point`}
            title="Tap to flip"
            onClick={() => onFlip(i)}
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="44px"
            h="44px"
            borderRadius="full"
            cursor="pointer"
            sx={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            transition="transform 0.12s ease"
            _hover={{ transform: "scale(1.12)" }}
            _active={{ transform: "scale(0.9)" }}
          >
            <Box
              w={["24px", "26px"]}
              h={["24px", "26px"]}
              borderRadius="full"
              bg={isLight ? LIGHT : DARK}
              boxShadow={`0 0 10px ${isLight ? "rgba(160,190,255,0.85)" : "rgba(192,57,43,0.85)"}`}
            />
          </Box>
        ))}
      </HStack>
    </HStack>
  );
};

export default PlayerDestiny;
