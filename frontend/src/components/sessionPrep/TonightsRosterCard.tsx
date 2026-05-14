import React from 'react';
import { Badge, Box, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { FaUser } from 'react-icons/fa';
import { TONIGHTS_ROSTER_SAMPLES } from '@/data/tonightsRosterSamples';

/** Faction → accent colour. Anything not listed uses a neutral grey. */
const FACTION_COLOR: Record<string, string> = {
  Empire: '#5a6e80',
  Jabba: '#c8a23a',
  Rebellion: '#b03030',
  Hutt: '#c8a23a',
  Republic: '#3a7e57',
  Separatist: '#7a4fb0',
};

function factionColor(faction?: string): string {
  if (!faction) return '#6f6f6f';
  return FACTION_COLOR[faction] ?? '#5a7fb0';
}

/**
 * TonightsRosterCard — NPC cards in a responsive grid. `minChildWidth` lets
 * the panel flow 2–3 across depending on how wide the Session Prep column
 * is. Taller than a DenseRow on purpose — the note gets room to breathe
 * (up to 3 lines) since this is reference the GM reads, not a list they
 * scan past.
 */
const TonightsRosterCard: React.FC = () => {
  return (
    <SimpleGrid minChildWidth="150px" spacing={1.5}>
      {TONIGHTS_ROSTER_SAMPLES.map((r) => {
        const accent = factionColor(r.faction);
        return (
          <Box
            key={r.id}
            bg="#26292d"
            borderWidth="1px"
            borderColor="whiteAlpha.150"
            borderRadius="md"
            borderLeftWidth="3px"
            borderLeftColor={accent}
            _hover={{ borderColor: 'whiteAlpha.300', borderLeftColor: accent }}
            transition="border-color 120ms"
            px={2}
            py={1.5}
          >
            <HStack spacing={1.5} align="start" minW={0} mb={0.5}>
              <Box color={accent} fontSize="10px" flexShrink={0} display="inline-flex" mt="2px">
                <FaUser />
              </Box>
              <Text
                color="white"
                fontWeight="semibold"
                fontSize="xs"
                lineHeight="1.25"
                noOfLines={2}
                flex="1"
                minW={0}
              >
                {r.name}
              </Text>
            </HStack>
            {r.faction && (
              <Badge
                bg="whiteAlpha.150"
                color="whiteAlpha.700"
                fontSize="9px"
                textTransform="uppercase"
                letterSpacing="0.06em"
                px={1}
                py={0}
                borderRadius="sm"
                lineHeight="1.3"
                mb={1}
              >
                {r.faction}
              </Badge>
            )}
            {r.note && (
              <Text color="whiteAlpha.600" fontSize="2xs" lineHeight="1.35" noOfLines={3}>
                {r.note}
              </Text>
            )}
          </Box>
        );
      })}
    </SimpleGrid>
  );
};

export default TonightsRosterCard;
