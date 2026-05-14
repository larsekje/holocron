import React from 'react';
import { HStack, Icon, Input, Kbd, Wrap, WrapItem, Tag, TagCloseButton, TagLabel, Box } from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import type { SpotlightEntityType } from '@/state/spotlightStore';
import type { Token } from '@/data/spotlightQuery';

interface SpotlightHeaderProps {
  /** Committed token chips (parsed from `chips` state in the parent). */
  chipTokens: Token[];
  onChipRemove: (index: number) => void;
  onChipClick: (index: number) => void;
  /** Click on the sort arrow inside a numeric filter chip. */
  onChipSortToggle: (index: number) => void;
  /** Currently active sort, anchored on a chip's field. */
  activeSort: { field: string; direction: 'asc' | 'desc' } | null;
  /** Freeform residual text — what the user is currently typing. */
  residual: string;
  onResidualChange: (value: string, caret: number) => void;
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  includedTypes: Set<SpotlightEntityType>;
  onToggleType: (t: SpotlightEntityType) => void;
  onSetAll: () => void;
  onSetNone: () => void;
  hideNamedAdversaries: boolean;
  onToggleHideNamed: () => void;
  hideAdventureAdversaries: boolean;
  onToggleHideAdventure: () => void;
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

// How a token should read inside its chip — value half is hidden for
// type-scope tokens; numeric chips with no value render as just the field
// name (they're sort handles, not filters).
function chipLabel(t: Token): string {
  if (t.fieldDef.kind === 'type-scope') return `${t.field}:`;
  if (t.fieldDef.kind === 'numeric' && t.value.trim() === '') return t.field;
  const op = t.op === '=' ? '' : t.op;
  return `${t.field}:${op}${t.value}`;
}

// The clickable sort arrow on a numeric filter chip. Three states: inactive
// (`–`, low contrast), active asc (`↑`), active desc (`↓`).
const SortArrow: React.FC<{ state: 'asc' | 'desc' | 'none'; onClick: () => void }> = ({ state, onClick }) => {
  const glyph = state === 'asc' ? '↑' : state === 'desc' ? '↓' : '–';
  return (
    <Box
      as="button"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }}
      px={1}
      mr={0.5}
      fontFamily="mono"
      fontSize="xs"
      fontWeight="bold"
      color={state === 'none' ? 'gray.500' : 'orange.300'}
      _hover={{ color: state === 'none' ? 'gray.300' : 'orange.200' }}
      title={state === 'none' ? 'Sort by this field' : 'Click to toggle direction'}
    >
      {glyph}
    </Box>
  );
};

const SpotlightHeader: React.FC<SpotlightHeaderProps> = ({
  chipTokens,
  onChipRemove,
  onChipClick,
  onChipSortToggle,
  activeSort,
  residual,
  onResidualChange,
  onInputKeyDown,
  inputRef,
  includedTypes,
  onToggleType,
  onSetAll,
  onSetNone,
  hideNamedAdversaries,
  onToggleHideNamed,
  hideAdventureAdversaries,
  onToggleHideAdventure,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');
  const headerBg = '#1f2226';
  const borderCol = 'gray.700';

  return (
    <Box borderBottom="1px solid" borderColor={borderCol} bg={headerBg}>
      <HStack px={4} height="44px" spacing={3}>
        <Icon as={FiSearch} color="gray.400" boxSize={4} />
        {chipTokens.length > 0 && (
          <HStack spacing={1.5} flexShrink={0}>
            {chipTokens.map((t, i) => {
              const isNumericFilter = t.fieldDef.kind === 'numeric';
              const isSorted = isNumericFilter && activeSort?.field === t.fieldDef.name;
              const sortState: 'asc' | 'desc' | 'none' = isSorted
                ? activeSort!.direction
                : 'none';
              return (
                <Tag
                  key={`${i}-${t.field}-${t.value}`}
                  size="sm"
                  colorScheme={isSorted ? 'orange' : 'purple'}
                  variant="subtle"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => onChipClick(i)}
                  title="Click to edit"
                >
                  {isNumericFilter && (
                    <SortArrow state={sortState} onClick={() => onChipSortToggle(i)} />
                  )}
                  <TagLabel fontFamily="mono" fontSize="xs">{chipLabel(t)}</TagLabel>
                  <TagCloseButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onChipRemove(i);
                    }}
                    aria-label={`Remove ${t.field} filter`}
                  />
                </Tag>
              );
            })}
          </HStack>
        )}
        <Input
          ref={inputRef as any}
          variant="unstyled"
          placeholder={chipTokens.length === 0 ? 'Search… try `adv:` then `type:minion soak:high`' : ''}
          value={residual}
          onChange={(e) => {
            const c = e.target.selectionStart ?? e.target.value.length;
            onResidualChange(e.target.value, c);
          }}
          onSelect={(e) => {
            const t = e.currentTarget;
            onResidualChange(t.value, t.selectionStart ?? t.value.length);
          }}
          onKeyDown={onInputKeyDown}
          color="gray.100"
          fontSize="sm"
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
                variant={isActive ? 'subtle' : 'outline'}
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
              variant={hideNamedAdversaries ? 'subtle' : 'outline'}
              cursor="pointer"
              onClick={onToggleHideNamed}
              title="Hide named characters (e.g. Darth Vader) from adversary results"
            >
              Hide Named
            </Tag>
          </WrapItem>
        )}
        {includedTypes.has('adversary') && (
          <WrapItem>
            <Tag
              size="sm"
              colorScheme={hideAdventureAdversaries ? 'orange' : 'gray'}
              variant={hideAdventureAdversaries ? 'subtle' : 'outline'}
              cursor="pointer"
              onClick={onToggleHideAdventure}
              title="Hide characters that appear in a pre-written adventure, leaving sourcebook/generic profiles"
            >
              Hide Adventure NPCs
            </Tag>
          </WrapItem>
        )}
      </Wrap>
    </Box>
  );
};

export default SpotlightHeader;
