import React, { useState } from 'react';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { rollNpcDescriptor, rollNpcName } from '@/data/npcDescriptors';
import { SPEND_TABLES, type SpendContext, type SpendCurrency } from '@/data/symbolSpends';

const CURRENCY_META: { key: SpendCurrency; label: string; glyph: string; color: string }[] = [
  { key: 'advantage', label: 'Adv', glyph: '⌒', color: '#7fc8e8' },
  { key: 'threat', label: 'Thr', glyph: '⌓', color: '#e08080' },
  { key: 'triumph', label: 'Tri', glyph: '✦', color: '#f2d16b' },
  { key: 'despair', label: 'Des', glyph: '▼', color: '#c48be0' },
];

const MAX_SPENDS = 5;

interface Props {
  /** Which spend table fits the scene right now (derived from its tags). */
  context: SpendContext;
}

/**
 * SparksPanel — for the empty-handed moment. Two generators (a face/quirk and
 * a name, from the npcDescriptors pool) plus the four symbol buttons, which
 * surface the top published spend suggestions for the scene's context. This is
 * the "3 net Threat and a blank mind" panel: reference, never automation.
 */
const SparksPanel: React.FC<Props> = ({ context }) => {
  const [spark, setSpark] = useState<{ label: string; text: string } | null>(null);
  const [currency, setCurrency] = useState<SpendCurrency | null>(null);

  const table = SPEND_TABLES[context];
  const entries = currency
    ? [...table.positive, ...table.negative].filter((e) => e.currency === currency).slice(0, MAX_SPENDS)
    : [];

  return (
    <VStack align="stretch" spacing={1.5}>
      <HStack spacing={1.5}>
        <Button
          size="xs"
          h="22px"
          flex="1"
          fontSize="2xs"
          variant="outline"
          borderColor="whiteAlpha.200"
          color="whiteAlpha.700"
          _hover={{ color: 'white', borderColor: 'whiteAlpha.400' }}
          onClick={() => setSpark({ label: "who's this", text: rollNpcDescriptor() })}
        >
          🎲 who's this?
        </Button>
        <Button
          size="xs"
          h="22px"
          flex="1"
          fontSize="2xs"
          variant="outline"
          borderColor="whiteAlpha.200"
          color="whiteAlpha.700"
          _hover={{ color: 'white', borderColor: 'whiteAlpha.400' }}
          onClick={() => setSpark({ label: 'name', text: rollNpcName() })}
        >
          🎲 name
        </Button>
      </HStack>

      {spark && (
        <Box bg="rgba(211,153,57,0.10)" borderWidth="1px" borderColor="rgba(211,153,57,0.30)" borderRadius="md" px={2} py={1}>
          <Text fontSize="8px" fontWeight="bold" letterSpacing="0.1em" textTransform="uppercase" color="whiteAlpha.500">
            {spark.label}
          </Text>
          <Text fontSize="2xs" color="#e8d9b8" lineHeight="1.45">
            {spark.text}
          </Text>
        </Box>
      )}

      <HStack spacing={1}>
        {CURRENCY_META.map((c) => {
          const on = currency === c.key;
          return (
            <Button
              key={c.key}
              size="xs"
              h="22px"
              flex="1"
              fontSize="10px"
              fontWeight="bold"
              variant="outline"
              color={c.color}
              borderColor={on ? c.color : 'whiteAlpha.200'}
              bg={on ? 'whiteAlpha.100' : undefined}
              _hover={{ borderColor: c.color }}
              onClick={() => setCurrency(on ? null : c.key)}
            >
              {c.glyph} {c.label}
            </Button>
          );
        })}
      </HStack>

      {currency && (
        <Box bg="#1f2225" borderWidth="1px" borderColor="whiteAlpha.150" borderRadius="md" px={2} py={1.5}>
          <Text fontSize="8px" fontWeight="bold" letterSpacing="0.12em" textTransform="uppercase" color="whiteAlpha.400" mb={1}>
            {table.title} · spend ideas
          </Text>
          <VStack align="stretch" spacing={0.5}>
            {entries.map((e, i) => (
              <HStack key={i} spacing={2} align="baseline">
                <Text fontSize="10px" color="whiteAlpha.400" fontFamily="mono" w="14px" flexShrink={0} textAlign="right">
                  {currency === 'triumph' || currency === 'despair' ? '—' : e.cost}
                </Text>
                <Text fontSize="2xs" color="whiteAlpha.700" lineHeight="1.4">
                  {e.label}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default SparksPanel;
