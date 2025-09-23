import React from 'react';
import { HStack, Icon, Input, Kbd, Wrap, WrapItem, Tag, Box } from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import type { SpotlightEntityType } from '@/state/spotlightStore';

interface SpotlightHeaderProps {
  query: string;
  setQuery: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  includedTypes: Set<SpotlightEntityType>;
  onToggleType: (t: SpotlightEntityType | 'items') => void;
  onSetAll: () => void;
  onSetNone: () => void;
}

const typeOrder: Array<SpotlightEntityType | 'items'> = [
  'talent',
  'rule',
  'skill',
  'quality',
  'items',
  'adversary',
];

const labelFor: Record<SpotlightEntityType | 'items', string> = {
  talent: 'Talents',
  rule: 'Rules',
  items: 'Items',
  adversary: 'Adversaries',
  gear: 'Gear',
  armor: 'Armor',
  weapon: 'Weapons',
  attachment: 'Attachments',
  skill: 'Skills',
  vehicle: 'Vehicles',
  career: 'Careers',
  specialization: 'Specs',
  species: 'Species',
  forcepower: 'Force Powers',
  quality: 'Qualities',
};

const SpotlightHeader: React.FC<SpotlightHeaderProps> = ({ query, setQuery, inputRef, includedTypes, onToggleType, onSetAll, onSetNone }) => {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');
  const headerBg = '#1f2226';
  const borderCol = 'gray.700';

  return (
    <Box borderBottom="1px solid" borderColor={borderCol} bg={headerBg}>
      <HStack px={4} height="50px" spacing={3}>
        <Icon as={FiSearch} color="gray.300" boxSize={5} />
        <Input
          ref={inputRef as any}
          variant="unstyled"
          placeholder="Search talents, rules, weapons, items…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          color="gray.100"
          _placeholder={{ color: 'gray.500' }}
        />
        <HStack spacing={1} color="gray.400">
          <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
          <Kbd>K</Kbd>
        </HStack>
      </HStack>

      <Wrap px={4} pb={2} spacing={2} shouldWrapChildren>
        <WrapItem>
          <Tag size="sm" colorScheme="gray" variant="subtle" cursor="pointer" onClick={onSetAll}>
            All
          </Tag>
        </WrapItem>
        <WrapItem>
          <Tag size="sm" colorScheme="gray" variant="subtle" cursor="pointer" onClick={onSetNone}>
            None
          </Tag>
        </WrapItem>
        {typeOrder.map((t) => {
          const isItems = t === 'items';
          const itemTypes = ['weapon', 'armor', 'gear', 'attachment'] as const;
          const isActive = isItems
            ? itemTypes.some((tt) => includedTypes.has(tt))
            : includedTypes.has(t as SpotlightEntityType);

          if (isItems) {
            return (
              <WrapItem key={t}>
                <Tag
                  size="sm"
                  colorScheme={isActive ? 'purple' : 'gray'}
                  variant={isActive ? 'solid' : 'outline'}
                  cursor="pointer"
                  onClick={() => onToggleType('items')}
                >
                  {labelFor[t]}
                </Tag>
              </WrapItem>
            );
          }

          return (
            <WrapItem key={t}>
              <Tag
                size="sm"
                colorScheme={isActive ? 'purple' : 'gray'}
                variant={isActive ? 'solid' : 'outline'}
                cursor="pointer"
                onClick={() => onToggleType(t as SpotlightEntityType)}
              >
                {labelFor[t]}
              </Tag>
            </WrapItem>
          );
        })}
      </Wrap>
    </Box>
  );
};

export default SpotlightHeader;
