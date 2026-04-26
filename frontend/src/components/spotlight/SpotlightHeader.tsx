import React from 'react';
import { Box, HStack, Icon, IconButton, Input, Kbd, Tag, TagCloseButton, TagLabel, Wrap, WrapItem } from '@chakra-ui/react';
import { FiArrowDown, FiArrowUp, FiMinus, FiSearch } from 'react-icons/fi';
import type { SpotlightEntityType } from '@/state/spotlightStore';
import type { Token } from '@/data/spotlightQuery';

export interface ChipTokenView {
  token: Token;
  sort: 'asc' | 'desc' | null;
}

interface SpotlightHeaderProps {
  /** Committed token chips (parsed + sort role from the parent). */
  chipTokens: ChipTokenView[];
  onChipRemove: (index: number) => void;
  onChipClick: (index: number) => void;
  /** Cycle a chip's sort role (none → default → opposite → none). */
  onChipArrow: (index: number) => void;
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

// How a token reads inside its chip body. Type-scope hides the empty value
// half; order tokens (`:high` / `:low`) show their semantic name; everything
// else shows the operator + value.
function chipLabel(t: Token): string {
  if (t.fieldDef.kind === 'type-scope') return `${t.field}:`;
  if (t.order) return `${t.field}:${t.value}`;
  const op = t.op === '=' ? '' : t.op;
  return `${t.field}:${op}${t.value}`;
}

const SpotlightHeader: React.FC<SpotlightHeaderProps> = ({
  chipTokens,
  onChipRemove,
  onChipClick,
  onChipArrow,
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
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');
  const headerBg = '#1f2226';
  const borderCol = 'gray.700';

  return (
    <Box borderBottom="1px solid" borderColor={borderCol} bg={headerBg}>
      <HStack px={4} height="50px" spacing={3}>
        <Icon as={FiSearch} color="gray.300" boxSize={5} />
        {chipTokens.length > 0 && (
          <HStack spacing={1.5} flexShrink={0}>
            {chipTokens.map((c, i) => {
              const t = c.token;
              const sortable = t.fieldDef.kind === 'numeric';
              const sortIcon = c.sort === 'desc' ? FiArrowDown : c.sort === 'asc' ? FiArrowUp : FiMinus;
              const sortColor = c.sort ? 'orange.300' : 'gray.500';
              return (
                <Tag
                  key={`${i}-${t.field}-${t.value}`}
                  size="sm"
                  colorScheme={c.sort ? 'orange' : 'purple'}
                  variant="subtle"
                  borderRadius="md"
                >
                  <TagLabel
                    fontFamily="mono"
                    fontSize="xs"
                    cursor="pointer"
                    onClick={() => onChipClick(i)}
                    title="Click to edit"
                  >
                    {chipLabel(t)}
                  </TagLabel>
                  {sortable && (
                    <IconButton
                      aria-label={
                        c.sort
                          ? `Sort by ${t.field} ${c.sort === 'desc' ? 'descending' : 'ascending'} (click to cycle)`
                          : `Sort by ${t.field}`
                      }
                      title={
                        c.sort
                          ? `Sort by ${t.field} ${c.sort === 'desc' ? 'descending' : 'ascending'} — click to cycle`
                          : `Click to sort by ${t.field}`
                      }
                      icon={<Icon as={sortIcon} boxSize={2.5} />}
                      size="xs"
                      variant="ghost"
                      minW="18px"
                      h="18px"
                      ml={1}
                      px={0}
                      color={sortColor}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChipArrow(i);
                      }}
                    />
                  )}
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
