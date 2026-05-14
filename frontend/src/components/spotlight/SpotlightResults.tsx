import React from 'react';
import { Box, VStack, Text, Divider } from '@chakra-ui/react';
import type { SpotlightResult } from '@/state/spotlightStore';
import SpotlightResultsHeader from './SpotlightResultsHeader';
import SpotlightResultsSkeletonRow from './SpotlightResultsSkeletonRow';
import SpotlightResultRow from './SpotlightResultRow';

type SpotlightResultsProps = {
  listRef: React.RefObject<HTMLDivElement>;
  results: SpotlightResult[];
  loading: boolean;
  selectedIndex: number;
  onHoverIndex: (index: number) => void;
  onClickResult: (r: SpotlightResult) => void;
  query: string;
  highlightedFields?: Set<string>;
};

const RESULT_ROW_HEIGHT = 42;
const headerBg = '#1f2226';
const borderCol = 'gray.700';

const SpotlightResults: React.FC<SpotlightResultsProps> = ({
  listRef,
  results,
  loading,
  selectedIndex,
  onHoverIndex,
  onClickResult,
  query,
  highlightedFields,
}) => {
  const grouped = React.useMemo(() => {
    const map = new Map<string, SpotlightResult[]>();
    for (const r of results) {
      if (!map.has(r.type)) map.set(r.type, []);
      map.get(r.type)!.push(r);
    }
    return Array.from(map.entries());
  }, [results]);

  const titleFor = (type: string) =>
    ({
      adversary: 'Adversaries',
      talent: 'Talents',
      weapon: 'Weapons',
      rule: 'Rules',
      quality: 'Qualities',
    } as Record<string, string>)[type] ?? type;

  return (
    <Box ref={listRef} w="45%" overflowY="auto" borderRight="1px solid" borderColor={borderCol}>
      {loading && (
        <VStack align="stretch" spacing={0} px={4} py={3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SpotlightResultsSkeletonRow key={i} rowHeight={RESULT_ROW_HEIGHT} />
          ))}
        </VStack>
      )}

      {!loading && results.length === 0 && query.trim().length > 0 && (
        <Box px={4} py={4}>
          <Text fontSize="sm" color="gray.400">No results for “{query}”.</Text>
        </Box>
      )}

      {!loading && results.length === 0 && query.trim().length === 0 && (
        <Box px={4} py={4}>
          <Text fontSize="sm" color="gray.400">Type to search the compendium.</Text>
        </Box>
      )}

      {!loading && results.length > 0 && (
        <VStack align="stretch" spacing={0}>
          {grouped.map(([type, items]) => (
            <Box key={type}>
              <SpotlightResultsHeader title={titleFor(type)} count={items.length} headerBg={headerBg} borderCol={borderCol} />
              {items.map((r) => {
                const idx = results.findIndex((x) => x.id === r.id && x.type === r.type);
                const isSelected = idx === selectedIndex;
                return (
                  <SpotlightResultRow
                    key={`${r.type}:${r.id}`}
                    r={r}
                    idx={idx}
                    isSelected={isSelected}
                    onHoverIndex={onHoverIndex}
                    onClickResult={onClickResult}
                    rowHeight={RESULT_ROW_HEIGHT}
                    highlightedFields={highlightedFields}
                  />
                );
              })}
              <Divider borderColor={borderCol} />
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default SpotlightResults;
