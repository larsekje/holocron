import React from 'react';
import { HStack, Icon, Input, Kbd, Wrap, WrapItem, Tag, Box } from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import type { SpotlightEntityType } from '@/state/spotlightStore';

interface SpotlightHeaderProps {
  query: string;
  setQuery: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  includedTypes: Set<SpotlightEntityType>;
  onToggleType: (t: SpotlightEntityType) => void;
  onSetAll: () => void;
  onSetNone: () => void;
  hideNamedAdversaries: boolean;
  onToggleHideNamed: () => void;
}

const typeOrder: SpotlightEntityType[] = [
  'adversary',
  'talent',
  'weapon',
  'rule',
  'quality',
];

const labelFor: Partial<Record<SpotlightEntityType, string>> = {
  adversary: 'Adversaries',
  talent: 'Talents',
  weapon: 'Weapons',
  rule: 'Rules',
  quality: 'Qualities',
};

const SpotlightHeader: React.FC<SpotlightHeaderProps> = ({ query, setQuery, inputRef, includedTypes, onToggleType, onSetAll, onSetNone, hideNamedAdversaries, onToggleHideNamed }) => {
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
          const isActive = includedTypes.has(t);
          return (
            <WrapItem key={t}>
              <Tag
                size="sm"
                colorScheme={isActive ? 'purple' : 'gray'}
                variant={isActive ? 'solid' : 'outline'}
                cursor="pointer"
                onClick={() => onToggleType(t)}
              >
                {labelFor[t] ?? t}
              </Tag>
            </WrapItem>
          );
        })}
        {includedTypes.has('adversary') && (
          <WrapItem>
            <Tag
              size="sm"
              colorScheme={hideNamedAdversaries ? 'orange' : 'gray'}
              variant={hideNamedAdversaries ? 'solid' : 'outline'}
              cursor="pointer"
              onClick={onToggleHideNamed}
              title="Hide named characters (e.g. Darth Vader) from adversary results"
            >
              Hide Named
            </Tag>
          </WrapItem>
        )}
      </Wrap>
    </Box>
  );
};

export default SpotlightHeader;
