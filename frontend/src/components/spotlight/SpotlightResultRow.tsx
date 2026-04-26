import React from 'react';
import { Badge, Box, HStack, Text } from '@chakra-ui/react';
import type { SpotlightResult } from '@/state/spotlightStore';
import { getDetail } from '@/data/spotlightIndex';

type SpotlightResultRowProps = {
  r: SpotlightResult;
  idx: number;
  isSelected: boolean;
  onHoverIndex: (idx: number) => void;
  onClickResult: (r: SpotlightResult) => void;
  rowHeight: number;
  rowHoverBg?: string;
  rowSelectedBg?: string;
};

const charKeyToName = (k?: string): string | undefined => {
  const v = (k || '').toUpperCase();
  switch (v) {
    case 'BR': return 'Brawn';
    case 'AG':
    case 'AGI': return 'Agility';
    case 'INT': return 'Intellect';
    case 'CUN': return 'Cunning';
    case 'WIL': return 'Willpower';
    case 'PR': return 'Presence';
    default: return undefined;
  }
};

// Wrap matched character indexes in a styled span so we can see *why* something matched.
function renderHighlighted(text: string, indexes?: number[]): React.ReactNode {
  if (!indexes || indexes.length === 0) return text;
  const set = new Set(indexes);
  const parts: React.ReactNode[] = [];
  let buf = '';
  let inMatch = false;
  for (let i = 0; i < text.length; i++) {
    const matched = set.has(i);
    if (matched !== inMatch) {
      if (buf) {
        parts.push(
          inMatch ? (
            <Box as="span" key={`m-${parts.length}`} color="yellow.300" fontWeight="700">
              {buf}
            </Box>
          ) : (
            <React.Fragment key={`p-${parts.length}`}>{buf}</React.Fragment>
          ),
        );
        buf = '';
      }
      inMatch = matched;
    }
    buf += text[i];
  }
  if (buf) {
    parts.push(
      inMatch ? (
        <Box as="span" key={`m-${parts.length}`} color="yellow.300" fontWeight="700">
          {buf}
        </Box>
      ) : (
        <React.Fragment key={`p-${parts.length}`}>{buf}</React.Fragment>
      ),
    );
  }
  return parts;
}

const SpotlightResultRow: React.FC<SpotlightResultRowProps> = ({
  r,
  idx,
  isSelected,
  onHoverIndex,
  onClickResult,
  rowHeight,
  rowHoverBg = 'gray.600',
  rowSelectedBg = 'gray.700',
}) => {
  // Pull characteristic for skills (from detail.characteristic, detail.charKey, or tags)
  const skillCharacteristic =
    r.type === 'skill'
      ? (
          (r as any).detail?.characteristic ??
          charKeyToName((r as any).detail?.charKey) ??
          (r.tags || []).find((t) =>
            ['Brawn', 'Agility', 'Intellect', 'Cunning', 'Willpower', 'Presence'].includes(t)
          )
        )
      : undefined;

  // Fetch detail lazily for lightweight results (searchIndex omits detail)
  const detail = React.useMemo(() => getDetail(r.type, r.id), [r.type, r.id]);

  return (
    <HStack
      key={`${r.type}:${r.id}`}
      onMouseEnter={() => onHoverIndex(idx)}
      onClick={() => onClickResult(r)}
      px={4}
      height={`${rowHeight}px`}
      spacing={3}
      cursor="pointer"
      bg={isSelected ? rowSelectedBg : 'transparent'}
      _hover={{ bg: rowHoverBg }}
      borderLeftWidth="3px"
      borderLeftColor={isSelected ? 'purple.400' : 'transparent'}
      transition="background 120ms ease, border-color 120ms ease"
    >
      <Box flex="1">
        <Text fontWeight="semibold" color="gray.100">
          {renderHighlighted(r.name, r.matches)}
        </Text>
        <HStack spacing={2}>
          {detail?.category && <Text fontSize="sm" color="gray.400">{detail?.category}</Text>}
        </HStack>
      </Box>
      <HStack spacing={2} align="center">
        <Badge colorScheme="purple" variant="outline">{r.type}</Badge>
      </HStack>
    </HStack>
  );
};

export default SpotlightResultRow;
