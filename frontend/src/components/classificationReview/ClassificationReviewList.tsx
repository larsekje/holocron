import React from 'react';
import { Box, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import { FiFlag } from 'react-icons/fi';
import type { SpotlightDetail } from '@/state/spotlightStore';
import type { ClassificationFlag } from '@/state/classificationReviewStore';
import type { GroupBy } from './ClassificationReviewFilters';

// Left pane: the filterable adversary list. Click-to-select only — no global
// keyboard nav, since the detail pane's note textarea owns the keyboard.

interface Props {
  items: SpotlightDetail[];
  groupBy: GroupBy;
  selectedId: string | null;
  onSelect: (id: string) => void;
  flags: Record<string, ClassificationFlag>;
}

const borderCol = 'gray.700';
const headerBg = '#1f2226';

const TIER_COLOR: Record<string, string> = {
  Minion: 'gray.500',
  Rival: 'blue.300',
  Nemesis: 'red.300',
};

const Row: React.FC<{
  adv: SpotlightDetail;
  selected: boolean;
  flagged: boolean;
  onSelect: (id: string) => void;
}> = ({ adv, selected, flagged, onSelect }) => {
  const d = adv as any;
  const tier: string = d.adversaryType ?? '';
  return (
    <HStack
      px={3}
      py={1.5}
      spacing={2}
      cursor="pointer"
      align="center"
      bg={selected ? 'gray.700' : 'transparent'}
      _hover={{ bg: selected ? 'gray.700' : 'gray.600' }}
      borderLeftWidth="3px"
      borderLeftColor={selected ? 'purple.400' : 'transparent'}
      onClick={() => onSelect(adv.id)}
    >
      <Icon
        as={FiFlag}
        boxSize={3}
        flexShrink={0}
        color={flagged ? 'orange.300' : 'transparent'}
        aria-label={flagged ? 'Flagged' : undefined}
      />
      <Box flex="1" minW={0}>
        <Text fontSize="sm" fontWeight="semibold" color="gray.100" noOfLines={1}>
          {adv.name}
        </Text>
        <Text fontSize="xs" color="gray.400" noOfLines={1}>
          {d.coreArchetype || <Text as="span" color="orange.300">no archetype</Text>}
        </Text>
      </Box>
      <Text fontSize="0.62rem" fontWeight="bold" textTransform="uppercase" color={TIER_COLOR[tier] ?? 'gray.500'} flexShrink={0}>
        {tier}
      </Text>
    </HStack>
  );
};

const GroupHeader: React.FC<{ title: string; count: number }> = ({ title, count }) => (
  <Box px={3} py={1.5} bg={headerBg} position="sticky" top={0} zIndex={1} borderBottom="1px solid" borderColor={borderCol}>
    <HStack spacing={2}>
      <Text fontSize="xs" textTransform="uppercase" color="gray.400" fontWeight="bold" letterSpacing="0.08em">
        {title}
      </Text>
      <Text fontSize="xs" color="gray.500">
        · {count}
      </Text>
    </HStack>
  </Box>
);

const ClassificationReviewList: React.FC<Props> = ({ items, groupBy, selectedId, onSelect, flags }) => {
  if (items.length === 0) {
    return (
      <Box px={4} py={6}>
        <Text fontSize="sm" color="gray.500">
          No adversaries match the current filters.
        </Text>
      </Box>
    );
  }

  if (groupBy === 'none') {
    return (
      <VStack align="stretch" spacing={0}>
        {items.map((adv) => (
          <Row
            key={adv.id}
            adv={adv}
            selected={adv.id === selectedId}
            flagged={!!flags[adv.id]}
            onSelect={onSelect}
          />
        ))}
      </VStack>
    );
  }

  // Grouped: bucket by the chosen field, sort group labels alphabetically with
  // an "(unset)" bucket last.
  const groups = new Map<string, SpotlightDetail[]>();
  for (const adv of items) {
    const d = adv as any;
    let key: string;
    if (groupBy === 'coreArchetype') key = d.coreArchetype || '(no archetype)';
    else key = Array.isArray(d.factions) && d.factions.length ? d.factions.join(' / ') : '(no faction)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(adv);
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const aUnset = a.startsWith('(');
    const bUnset = b.startsWith('(');
    if (aUnset !== bUnset) return aUnset ? 1 : -1;
    return a.localeCompare(b);
  });

  return (
    <VStack align="stretch" spacing={0}>
      {sortedKeys.map((key) => (
        <Box key={key}>
          <GroupHeader title={key} count={groups.get(key)!.length} />
          {groups.get(key)!.map((adv) => (
            <Row
              key={adv.id}
              adv={adv}
              selected={adv.id === selectedId}
              flagged={!!flags[adv.id]}
              onSelect={onSelect}
            />
          ))}
        </Box>
      ))}
    </VStack>
  );
};

export default ClassificationReviewList;
