import React from 'react';
import { Box, Heading, HStack, Kbd, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { FIELDS } from '@/data/spotlightQuery';
import type { FieldDef } from '@/data/spotlightQuery';

type Props = {
  onClose: () => void;
};

const KeyHint: React.FC<{ keys: string[]; label: string }> = ({ keys, label }) => (
  <HStack spacing={1.5}>
    {keys.map((k, i) => (
      <Kbd key={i} fontSize="xs" px={1.5} py={0} borderColor="gray.600" color="gray.300">
        {k}
      </Kbd>
    ))}
    <Text fontSize="sm" color="gray.400">{label}</Text>
  </HStack>
);

const FieldRow: React.FC<{ field: FieldDef }> = ({ field }) => {
  const tokens = [field.name, ...(field.aliases || [])];
  return (
    <Box>
      <HStack spacing={1.5} flexWrap="wrap">
        {tokens.map((t) => (
          <Text key={t} fontFamily="mono" fontSize="xs" color="purple.200" bg="gray.700" px={1.5} py={0.5} borderRadius="sm">
            {t}:
          </Text>
        ))}
      </HStack>
      <Text fontSize="sm" color="gray.300" mt={1}>
        {field.description}
      </Text>
      {field.examples?.length > 0 && (
        <Text fontFamily="mono" fontSize="xs" color="gray.500" mt={0.5}>
          {field.examples.join('  ')}
        </Text>
      )}
    </Box>
  );
};

const SpotlightHelpOverlay: React.FC<Props> = ({ onClose }) => {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');
  const cmd = isMac ? '⌘' : 'Ctrl';

  // Group fields by their `group` property; preserve declaration order.
  const groups = React.useMemo(() => {
    const out: Array<{ name: string; fields: FieldDef[] }> = [];
    const byName = new Map<string, FieldDef[]>();
    for (const f of FIELDS) {
      if (!byName.has(f.group)) {
        byName.set(f.group, []);
        out.push({ name: f.group, fields: byName.get(f.group)! });
      }
      byName.get(f.group)!.push(f);
    }
    return out;
  }, []);

  return (
    <Box
      position="absolute"
      inset={0}
      bg="rgba(15, 17, 20, 0.97)"
      zIndex={30}
      overflowY="auto"
      onClick={onClose}
    >
      <Box maxW="900px" mx="auto" px={8} py={6} onClick={(e) => e.stopPropagation()}>
        <HStack justify="space-between" mb={4}>
          <Heading size="md" color="gray.100">Spotlight cheatsheet</Heading>
          <KeyHint keys={['esc']} label="close" />
        </HStack>

        <VStack align="stretch" spacing={2} mb={6}>
          <Heading size="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.08em">Shortcuts</Heading>
          <HStack spacing={6} flexWrap="wrap">
            <KeyHint keys={[cmd, 'K']} label="open / close" />
            <KeyHint keys={['↑', '↓']} label="navigate" />
            <KeyHint keys={['⇥']} label="accept suggestion" />
            <KeyHint keys={['↵']} label="accept suggestion" />
            <KeyHint keys={['?']} label="this help" />
          </HStack>
        </VStack>

        <VStack align="stretch" spacing={2} mb={6}>
          <Heading size="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.08em">Examples</Heading>
          <VStack align="stretch" spacing={1.5}>
            {[
              ['adv: type:minion soak:>=5', 'Minions with soak 5 or higher'],
              ['adv: type:minion hp:<6 brawl:>=3', 'Minions with low HP but high Brawl'],
              ['adv: talent:adversary chew', 'Anyone with the Adversary talent matching "chew"'],
              ['adv: tag:imperial named:false', 'Generic Imperial NPCs'],
              ['adv: named:false adventure:false', 'Reusable profiles — no named or adventure-specific NPCs'],
              ['t: grit', 'Talents matching "grit"'],
            ].map(([q, hint]) => (
              <HStack key={q} spacing={3}>
                <Text fontFamily="mono" fontSize="sm" color="purple.200" bg="gray.700" px={2} py={0.5} borderRadius="sm">{q}</Text>
                <Text fontSize="sm" color="gray.400">{hint}</Text>
              </HStack>
            ))}
          </VStack>
        </VStack>

        <VStack align="stretch" spacing={5}>
          {groups.map((g) => (
            <Box key={g.name}>
              <Heading size="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.08em" mb={2}>
                {g.name}
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {g.fields.map((f) => (
                  <FieldRow key={f.name} field={f} />
                ))}
              </SimpleGrid>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

export default SpotlightHelpOverlay;
