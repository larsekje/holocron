import React from "react";
import { Box, Image, Text, VStack } from "@chakra-ui/react";
import type { PlayerDisplay } from "@/sync/snapshot";

/**
 * A GM-pushed image (e.g. "here's what an ysalamir looks like"), framed over the
 * starfield. `compact` shrinks it to a banner so it can sit above combat info.
 */
const PlayerImage: React.FC<{ display: PlayerDisplay; compact?: boolean }> = ({
  display,
  compact,
}) => (
  <VStack spacing={3} maxW={compact ? "70vw" : "88vw"}>
    <Box
      borderWidth="1px"
      borderColor="whiteAlpha.300"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="0 10px 40px rgba(0,0,0,0.6)"
      bg="blackAlpha.500"
      maxH={compact ? "30vh" : "72vh"}
    >
      <Image
        src={display.imageUrl}
        alt={display.caption ?? "GM display image"}
        maxH={compact ? "30vh" : "72vh"}
        maxW={compact ? "70vw" : "88vw"}
        objectFit="contain"
        // A broken/blocked URL shouldn't leave a busted icon on the table.
        fallback={
          <Box px={6} py={4}>
            <Text color="whiteAlpha.600" fontSize="sm">
              Couldn't load image
            </Text>
          </Box>
        }
      />
    </Box>
    {display.caption && (
      <Text
        fontSize={compact ? "sm" : ["md", "lg"]}
        color="whiteAlpha.800"
        fontStyle="italic"
        textAlign="center"
      >
        {display.caption}
      </Text>
    )}
  </VStack>
);

export default PlayerImage;
