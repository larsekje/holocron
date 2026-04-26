import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, HStack, Modal, ModalBody, ModalContent, ModalOverlay, Text, VStack } from '@chakra-ui/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSpotlightStore } from '@/state/spotlightStore';
import type { SpotlightResult, SpotlightDetail, SpotlightEntityType } from '@/state/spotlightStore';
import { searchIndex, getDetail, browseIndex } from '@/data/spotlightIndex';
import SpotlightHeader from './spotlight/SpotlightHeader';
import SpotlightResults from './spotlight/SpotlightResults';
import SpotlightDetailPane from './spotlight/SpotlightDetailPane';

const RESULT_ROW_HEIGHT = 48;

const Spotlight: React.FC = () => {
  const { isOpen, open, close } = useSpotlightStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detail, setDetail] = useState<SpotlightDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filter: included types
  const allTypes: SpotlightEntityType[] = [
    'talent',
    'rule',
    'weapon',
    'adversary',
    'gear',
    'armor',
    'skill',
    'vehicle',
    'career',
    'specialization',
    'species',
    'forcepower',
    'attachment',
    'quality',
  ];
  const [includedTypes, setIncludedTypes] = useState<Set<SpotlightEntityType>>(new Set(allTypes));
  const [hideNamedAdversaries, setHideNamedAdversaries] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Hotkeys to open/close Spotlight
  useHotkeys(
    'meta+k,ctrl+k',
    (e) => {
      e.preventDefault();
      open();
    },
    { enableOnFormTags: true },
    [open]
  );

  useHotkeys(
    'escape',
    () => {
      if (isOpen) close();
    },
    {},
    [isOpen, close]
  );

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      // Ensure filters default to All on every open
      setIncludedTypes(new Set(allTypes));
    } else {
      // Reset state when closing
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setDetail(null);
      setLoading(false);
      setDetailLoading(false);
    }
  }, [isOpen]);

  // Debounced search (when query present) or browse (when empty)
  useEffect(() => {
    if (!isOpen) return;

    const q = query.trim();
    if (!q) {
      // Browse first 100 items based on current filters
      const initial = browseIndex(100, Array.from(includedTypes));
      setResults(initial);
      setDetail(null);
      return;
    }

    setLoading(true);
    const handle = setTimeout(() => {
      try {
        const data = searchIndex(q);
        setResults(data);
        setSelectedIndex(0);
        // Don't load detail here; wait until after filtering to pick first visible
      } catch (e) {
        console.error('Spotlight search error', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(handle);
  }, [query, isOpen, includedTypes]);

  // Displayed results after applying type filters and the named-adversary toggle
  const displayedResults = useMemo(() => {
    return results.filter((r) => {
      if (!includedTypes.has(r.type)) return false;
      if (hideNamedAdversaries && r.type === 'adversary' && r.named) return false;
      return true;
    });
  }, [results, includedTypes, hideNamedAdversaries]);

  // When displayed results change (new search or filters), reset selection and auto-load first detail
  useEffect(() => {
    setSelectedIndex(0);
    if (displayedResults.length > 0) {
      loadDetail(displayedResults[0]);
    } else {
      setDetail(null);
    }
  }, [displayedResults]);

  const selectByIndex = (idx: number) => {
    if (idx < 0 || idx >= displayedResults.length) return;
    setSelectedIndex(idx);
    const r = displayedResults[idx];
    loadDetail(r);
    // Ensure selected item is visible
    if (listRef.current) {
      const top = idx * RESULT_ROW_HEIGHT;
      const bottom = top + RESULT_ROW_HEIGHT;
      if (top < listRef.current.scrollTop) {
        listRef.current.scrollTop = top;
      } else if (bottom > listRef.current.scrollTop + listRef.current.clientHeight) {
        listRef.current.scrollTop = bottom - listRef.current.clientHeight;
      }
    }
  };

  const loadDetail = (r: SpotlightResult) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = getDetail(r.type, r.id);
      const withKind = data ? ({ ...data, __kind: r.type } as SpotlightDetail & { __kind: string }) : null;
      setDetail(withKind);
    } catch (e) {
      console.error('Spotlight detail error', e);
      setDetail({
        id: r.id,
        type: r.type,
        name: r.name,
        __kind: r.type,
        description: 'Unable to load details.',
      } as SpotlightDetail & { __kind: string });
    } finally {
      setDetailLoading(false);
    }
  };

  // Keyboard navigation inside modal
  useHotkeys(
    'up',
    (e) => {
      if (!isOpen) return;
      e.preventDefault();
      if (displayedResults.length === 0) return;
      const next = (selectedIndex - 1 + displayedResults.length) % displayedResults.length;
      selectByIndex(next);
    },
    [isOpen, displayedResults, selectedIndex]
  );

  useHotkeys(
    'down',
    (e) => {
      if (!isOpen) return;
      e.preventDefault();
      if (displayedResults.length === 0) return;
      const next = (selectedIndex + 1) % displayedResults.length;
      selectByIndex(next);
    },
    [isOpen, displayedResults, selectedIndex]
  );

  useHotkeys(
    'enter',
    (e) => {
      if (!isOpen) return;
      if (displayedResults.length === 0) return;
      e.preventDefault();
      const r = displayedResults[selectedIndex];
      if (r) {
        loadDetail(r);
      }
    },
    [isOpen, displayedResults, selectedIndex]
  );

  // Consistent dark styling
  const cardBg = '#26292d';
  const headerBg = '#1f2226';
  const borderCol = 'gray.700';
  const rowHoverBg = 'gray.600';
  const rowSelectedBg = 'gray.700';

  return (
    <Modal isOpen={isOpen} onClose={close} size="6xl" isCentered>
      <ModalOverlay backdropFilter="blur(6px)" bg="rgba(0,0,0,0.6)" />
      <ModalContent
        bg={cardBg}
        overflow="hidden"
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderCol}
        boxShadow="xl"
      >
        <ModalBody p={0}>
          <VStack align="stretch" spacing={0}>
            <SpotlightHeader
              query={query}
              setQuery={setQuery}
              inputRef={inputRef}
              includedTypes={includedTypes}
              onToggleType={(t) => {
                const itemTypes: SpotlightEntityType[] = ['weapon', 'armor', 'gear', 'attachment'];
                if (t === 'items') {
                  setIncludedTypes((prev) => {
                    const next = new Set(prev);
                    const allIncluded = itemTypes.every((it) => next.has(it));
                    if (allIncluded) {
                      // remove all item types
                      itemTypes.forEach((it) => next.delete(it));
                    } else {
                      // include all item types
                      itemTypes.forEach((it) => next.add(it));
                    }
                    return next;
                  });
                } else {
                  setIncludedTypes((prev) => {
                    const next = new Set(prev);
                    if (next.has(t)) next.delete(t);
                    else next.add(t);
                    return next;
                  });
                }
              }}
              onSetAll={() => setIncludedTypes(new Set(allTypes))}
              onSetNone={() => setIncludedTypes(new Set())}
              hideNamedAdversaries={hideNamedAdversaries}
              onToggleHideNamed={() => setHideNamedAdversaries((v) => !v)}
            />

            <Flex h="70vh">
              <SpotlightResults
                listRef={listRef}
                results={displayedResults}
                loading={loading}
                selectedIndex={selectedIndex}
                onHoverIndex={(i) => setSelectedIndex(i)}
                onClickResult={(r) => loadDetail(r)}
                query={query}
              />

              <Box w="55%" display="flex" flexDir="column">
                <Box flex="1" minH={0} overflowY="auto">
                  <SpotlightDetailPane detail={detail} detailLoading={detailLoading} />
                </Box>
                <Box px={4} py={2} borderTop="1px solid" borderColor={borderCol}>
                  {detail && (detail as any).source && (
                    <HStack justify="flex-end">
                      <Text fontSize="sm" color="gray.400">{String((detail as any).source)}</Text>
                    </HStack>
                  )}
                </Box>
              </Box>
            </Flex>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default Spotlight;
