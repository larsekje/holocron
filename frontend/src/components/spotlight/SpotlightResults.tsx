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
};

const RESULT_ROW_HEIGHT = 48;
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
}) => {
  const grouped = React.useMemo(() => {
    const map = new Map<string, SpotlightResult[]>();
    for (const r of results) {
      const key = (r.type === 'weapon' || r.type === 'armor' || r.type === 'gear' || r.type === 'attachment') ? 'items' : r.type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [results]);

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
              <SpotlightResultsHeader title={type === 'items' ? 'Items' : type} headerBg={headerBg} borderCol={borderCol} />
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
