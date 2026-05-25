import React, { useMemo, useState } from 'react';
import { Box, Input, Text, VStack } from '@chakra-ui/react';
import { searchIndex } from '@/data/spotlightIndex';

export interface AdversaryPick {
  /** Spotlight adversary id — usable with getDetail('adversary', id). */
  id: string;
  name: string;
  subtitle?: string;
}

interface Props {
  onPick: (pick: AdversaryPick) => void;
  placeholder?: string;
}

/**
 * Compact inline adversary search → pick. Backed by the same Spotlight index
 * the rest of the app reads, so the ids it returns resolve via getDetail and
 * can be dropped into an encounter. Used by the encounter editor (NPC rows)
 * and the tonight's-roster editor.
 */
const AdversaryPicker: React.FC<Props> = ({ onPick, placeholder }) => {
  const [term, setTerm] = useState('');

  const results = useMemo(() => {
    const t = term.trim();
    if (t.length < 2) return [];
    // `adv:` is the entity-type scope token; the trailing space keeps `t` as the
    // residual search term (no space → the value-less scope token swallows it and
    // returns every adversary). `type:` is a different field (the Minion/Rival/
    // Nemesis tier), which is why `type:adversary` always came back empty.
    return searchIndex(`adv: ${t}`).slice(0, 8);
  }, [term]);

  return (
    <Box>
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder ?? 'Search adversaries…'}
        size="sm"
        bg="#1f2225"
        borderColor="whiteAlpha.200"
        color="whiteAlpha.900"
        fontSize="xs"
        _placeholder={{ color: 'whiteAlpha.400' }}
        _focus={{ borderColor: 'whiteAlpha.400', boxShadow: 'none' }}
      />
      {results.length > 0 && (
        <VStack
          align="stretch"
          spacing={0}
          mt={1}
          maxH="180px"
          overflowY="auto"
          bg="#1a1c1e"
          borderWidth="1px"
          borderColor="whiteAlpha.150"
          borderRadius="md"
        >
          {results.map((r) => (
            <Box
              key={`${r.type}:${r.id}`}
              px={2}
              py={1}
              cursor="pointer"
              _hover={{ bg: 'whiteAlpha.100' }}
              onClick={() => {
                onPick({ id: r.id, name: r.name, subtitle: r.subtitle });
                setTerm('');
              }}
            >
              <Text fontSize="xs" color="whiteAlpha.900" noOfLines={1}>
                {r.name}
              </Text>
              {r.subtitle && (
                <Text fontSize="2xs" color="whiteAlpha.500" noOfLines={1}>
                  {r.subtitle}
                </Text>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default AdversaryPicker;
