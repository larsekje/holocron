import React from 'react';
import { HStack, Icon, Input, Kbd, Wrap, WrapItem, Tag, TagCloseButton, TagLabel, Box } from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import type { SpotlightEntityType } from '@/state/spotlightStore';
import type { Token } from '@/data/spotlightQuery';
import { removeTokenSlice } from '@/data/spotlightQuery';

interface SpotlightHeaderProps {
  query: string;
  /** Called whenever the input value or caret moves. */
  onInputChange: (value: string, caret: number) => void;
  /** Called from chip-removal etc. to programmatically rewrite the input. */
  onQueryReplace: (value: string) => void;
  /** Forwarded to the input's onKeyDown so the parent can intercept Tab/Enter etc. */
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  includedTypes: Set<SpotlightEntityType>;
  onToggleType: (t: SpotlightEntityType) => void;
  onSetAll: () => void;
  onSetNone: () => void;
  hideNamedAdversaries: boolean;
  onToggleHideNamed: () => void;
  tokens: Token[];
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

// How a token should read inside its chip — value half is hidden for type-scope.
function chipLabel(t: Token): string {
  if (t.fieldDef.kind === 'type-scope') return `${t.field}:`;
  const op = t.op === '=' ? '' : t.op;
  return `${t.field}:${op}${t.value}`;
}

const SpotlightHeader: React.FC<SpotlightHeaderProps> = ({
  query,
  onInputChange,
  onQueryReplace,
  onInputKeyDown,
  inputRef,
  includedTypes,
  onToggleType,
  onSetAll,
  onSetNone,
  hideNamedAdversaries,
  onToggleHideNamed,
  tokens,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');
  const headerBg = '#1f2226';
  const borderCol = 'gray.700';

  return (
    <Box borderBottom="1px solid" borderColor={borderCol} bg={headerBg}>
      <HStack px={4} height="50px" spacing={3}>
        <Icon as={FiSearch} color="gray.300" boxSize={5} />
        {tokens.length > 0 && (
          <HStack spacing={1.5} flexShrink={0}>
            {tokens.map((t) => (
              <Tag key={`${t.range[0]}-${t.range[1]}`} size="sm" colorScheme="purple" variant="subtle" borderRadius="md">
                <TagLabel fontFamily="mono" fontSize="xs">{chipLabel(t)}</TagLabel>
                <TagCloseButton
                  onClick={() => onQueryReplace(removeTokenSlice(query, t.range))}
                  aria-label={`Remove ${t.field} filter`}
                />
              </Tag>
            ))}
          </HStack>
        )}
        <Input
          ref={inputRef as any}
          variant="unstyled"
          placeholder="Search… try `adv: type:minion soak:>=5` or `t: grit`"
          value={query}
          onChange={(e) => {
            const c = e.target.selectionStart ?? e.target.value.length;
            onInputChange(e.target.value, c);
          }}
          onSelect={(e) => {
            const t = e.currentTarget;
            onInputChange(t.value, t.selectionStart ?? t.value.length);
          }}
          onKeyDown={onInputKeyDown}
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
