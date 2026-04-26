import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, HStack, Modal, ModalBody, ModalContent, ModalOverlay, Text, VStack } from '@chakra-ui/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSpotlightStore } from '@/state/spotlightStore';
import type { SpotlightResult, SpotlightDetail, SpotlightEntityType } from '@/state/spotlightStore';
import { searchIndex, getDetail, browseIndex, parseQuery, tokenEntityTypes } from '@/data/spotlightIndex';
import { extractCompletedTokens } from '@/data/spotlightQuery';

// Only one order-by token may be active at a time. When new chips contain an
// order token, drop any existing order chips so picking `↑ wounds` replaces
// `↓ soak` instead of stacking them.
function mergeChipsWithOrderConstraint(prev: string[], incoming: string[]): string[] {
  const incomingHasOrder = incoming.some((raw) => parseQuery(raw).tokens[0]?.order);
  const base = incomingHasOrder
    ? prev.filter((raw) => !parseQuery(raw).tokens[0]?.order)
    : prev;
  return [...base, ...incoming];
}
import { applySuggestion, getSuggestions } from '@/data/spotlightSuggest';
import type { SuggestResult } from '@/data/spotlightSuggest';
import SpotlightHeader from './spotlight/SpotlightHeader';
import SpotlightResults from './spotlight/SpotlightResults';
import SpotlightDetailPane from './spotlight/SpotlightDetailPane';
import SpotlightStatusBar from './spotlight/SpotlightStatusBar';
import SpotlightSuggestPopup from './spotlight/SpotlightSuggestPopup';
import SpotlightHelpOverlay from './spotlight/SpotlightHelpOverlay';

const RESULT_ROW_HEIGHT = 48;

const Spotlight: React.FC = () => {
  const { isOpen, open, close } = useSpotlightStore();
  // The input value holds only freeform residual text. Committed tokens live in
  // `chips` so the input never visually duplicates what's already a chip.
  const [chips, setChips] = useState<string[]>([]);
  const [residual, setResidual] = useState('');
  const [results, setResults] = useState<SpotlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detail, setDetail] = useState<SpotlightDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filter: included types. Reflects what's actually in the curated dataset
  // (adversaries/talents/weapons from public/assets/data + rules/qualities from extras).
  const allTypes: SpotlightEntityType[] = [
    'adversary',
    'talent',
    'weapon',
    'rule',
    'quality',
  ];
  const [includedTypes, setIncludedTypes] = useState<Set<SpotlightEntityType>>(new Set(allTypes));
  const [hideNamedAdversaries, setHideNamedAdversaries] = useState<boolean>(true);

  // Autocomplete popup
  const [suggest, setSuggest] = useState<SuggestResult | null>(null);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const popupOpen = suggest !== null && suggest.items.length > 0;

  // Help overlay (`?`)
  const [helpOpen, setHelpOpen] = useState(false);

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
      setChips([]);
      setResidual('');
      setResults([]);
      setSelectedIndex(0);
      setDetail(null);
      setLoading(false);
      setDetailLoading(false);
      setSuggest(null);
      setSuggestIndex(0);
      setHelpOpen(false);
    }
  }, [isOpen]);

  // The full search string is just chips followed by residual freeform text.
  const fullQuery = useMemo(
    () => [chips.join(' '), residual].filter((s) => s.length > 0).join(' '),
    [chips, residual],
  );

  // Debounced search (when query present) or browse (when empty)
  useEffect(() => {
    if (!isOpen) return;

    const q = fullQuery.trim();
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
  }, [fullQuery, isOpen, includedTypes]);

  // Type-scope tokens (in chips OR residual) take precedence over the chip
  // filter for the duration of that search, so e.g. having an `adv:` chip
  // shows adversaries even when the Adversaries chip is off.
  const parsed = useMemo(() => parseQuery(fullQuery), [fullQuery]);
  const hasTypeScope = useMemo(() => tokenEntityTypes(parsed.tokens).size > 0, [parsed.tokens]);

  // Parsed Token for each chip — used purely for chip rendering.
  const chipTokens = useMemo(
    () =>
      chips
        .map((raw) => parseQuery(raw).tokens[0])
        .filter((t): t is NonNullable<typeof t> => !!t),
    [chips],
  );

  // Field names referenced by the active query (filter or sort tokens). Result
  // rows use this to pop the relevant stat (e.g., highlight soak when the user
  // is filtering or sorting by it).
  const highlightedFields = useMemo(() => {
    const set = new Set<string>();
    for (const t of parsed.tokens) {
      if (t.fieldDef.kind === 'numeric') set.add(t.field);
    }
    return set;
  }, [parsed.tokens]);

  // Displayed results after applying type filters and the named-adversary toggle
  const displayedResults = useMemo(() => {
    return results.filter((r) => {
      if (!hasTypeScope && !includedTypes.has(r.type)) return false;
      if (hideNamedAdversaries && r.type === 'adversary' && r.named) return false;
      return true;
    });
  }, [results, includedTypes, hideNamedAdversaries, hasTypeScope]);

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

  // Keyboard navigation inside modal — fire even while the search input has focus,
  // so the user never has to mouse over to the result list. Up/Down route to the
  // suggestion popup when it's open, otherwise to the result list.
  useHotkeys(
    'up',
    (e) => {
      if (!isOpen) return;
      e.preventDefault();
      if (popupOpen) {
        setSuggestIndex((i) => (i - 1 + suggest!.items.length) % suggest!.items.length);
        return;
      }
      if (displayedResults.length === 0) return;
      const next = (selectedIndex - 1 + displayedResults.length) % displayedResults.length;
      selectByIndex(next);
    },
    { enableOnFormTags: true },
    [isOpen, popupOpen, suggest, displayedResults, selectedIndex]
  );

  useHotkeys(
    'down',
    (e) => {
      if (!isOpen) return;
      e.preventDefault();
      if (popupOpen) {
        setSuggestIndex((i) => (i + 1) % suggest!.items.length);
        return;
      }
      if (displayedResults.length === 0) return;
      const next = (selectedIndex + 1) % displayedResults.length;
      selectByIndex(next);
    },
    { enableOnFormTags: true },
    [isOpen, popupOpen, suggest, displayedResults, selectedIndex]
  );

  // When the residual carries the just-edited chip back into the input via
  // backspace, we hold the original raw so a second backspace can wipe it
  // entirely. Cleared as soon as the user does anything else.
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // Whenever the residual changes, see if any complete tokens (i.e. followed
  // by whitespace) can be extracted and committed as chips. Then update suggest.
  const handleResidualChange = (value: string, caret: number) => {
    setPendingDelete(null);
    const { committed, remaining, remainingCaret } = extractCompletedTokens(value, caret);
    if (committed.length > 0) {
      setChips((prev) => mergeChipsWithOrderConstraint(prev, committed));
      setResidual(remaining);
      setSuggest(getSuggestions(remaining, remainingCaret));
      setSuggestIndex(0);
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(remainingCaret, remainingCaret);
        inputRef.current?.focus();
      });
      return;
    }
    setResidual(value);
    setSuggest(getSuggestions(value, caret));
    setSuggestIndex(0);
  };

  // Removing a chip = deleting it from `chips`. Index is the position in the array.
  const handleChipRemove = (index: number) => {
    setChips((prev) => prev.filter((_, i) => i !== index));
  };

  // Click the chip body. For sort chips (order tokens), a click is overloaded
  // as a direction toggle — click `↓ soak` to flip to `↑ soak` and vice versa.
  // For filter chips, the click pulls the token back into the input so the
  // user can edit its value (popup opens with the field's value suggestions).
  const handleChipClick = (index: number) => {
    const chip = chips[index];
    if (!chip) return;
    const parsedChip = parseQuery(chip).tokens[0];
    if (parsedChip?.order) {
      const flipped = parsedChip.order === 'desc' ? 'low' : 'high';
      const next = `${parsedChip.field}:${flipped}`;
      setChips((prev) => prev.map((c, i) => (i === index ? next : c)));
      return;
    }
    setChips((prev) => prev.filter((_, i) => i !== index));
    // Strip the value half so the popup re-opens with the full set of options
    // for that field (otherwise the existing value acts as a prefix filter and
    // hides every alternative). The user picks a new value from the menu.
    const colon = chip.indexOf(':');
    const fieldOnly = colon >= 0 ? chip.slice(0, colon + 1) : chip;
    const newResidual = residual ? `${fieldOnly} ${residual}` : fieldOnly;
    const caretAt = fieldOnly.length;
    setResidual(newResidual);
    setSuggest(getSuggestions(newResidual, caretAt));
    setSuggestIndex(0);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(caretAt, caretAt);
      inputRef.current?.focus();
    });
  };

  const acceptSuggestion = () => {
    if (!suggest || suggest.items.length === 0) return;
    const item = suggest.items[suggestIndex];
    const { next, caret } = applySuggestion(residual, suggest, item);
    setPendingDelete(null);
    // The suggestion may have completed a token (`field:value `). Run the
    // extractor in case it produced something that should immediately commit.
    const { committed, remaining, remainingCaret } = extractCompletedTokens(next, caret);
    if (committed.length > 0) {
      setChips((prev) => mergeChipsWithOrderConstraint(prev, committed));
      setResidual(remaining);
      setSuggest(getSuggestions(remaining, remainingCaret));
      setSuggestIndex(0);
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(remainingCaret, remainingCaret);
        inputRef.current?.focus();
      });
      return;
    }
    setResidual(next);
    setSuggest(getSuggestions(next, caret));
    setSuggestIndex(0);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(caret, caret);
      inputRef.current?.focus();
    });
  };

  // Tab/Enter accept the highlighted suggestion when popup is open. Esc closes
  // the popup first, then the help overlay, and only finally lets the modal close.
  // Backspace at start of empty input is two-stage: first press pulls the last
  // chip back into the input for editing (popup opens with its values); the
  // immediate next backspace clears it entirely.
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (popupOpen) {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        acceptSuggestion();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setSuggest(null);
        return;
      }
    }
    if (helpOpen && e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setHelpOpen(false);
      return;
    }

    if (e.key === 'Backspace') {
      const target = e.currentTarget;
      const caretAtStart = (target.selectionStart ?? 0) === 0 && (target.selectionEnd ?? 0) === 0;
      // Stage 2: backspace right after we just pulled a chip back, with the
      // chip text still untouched in the input — wipe it.
      if (pendingDelete && residual === pendingDelete) {
        e.preventDefault();
        setResidual('');
        setSuggest(null);
        setSuggestIndex(0);
        setPendingDelete(null);
        return;
      }
      // Stage 1: empty input → bring the most recent chip back, place caret
      // right after `field:` so the value popup can adjust it.
      if (caretAtStart && residual === '' && chips.length > 0) {
        e.preventDefault();
        const lastIdx = chips.length - 1;
        const raw = chips[lastIdx];
        setChips((prev) => prev.slice(0, -1));
        setResidual(raw);
        setPendingDelete(raw);
        const colon = raw.indexOf(':');
        const caretAt = colon >= 0 ? colon + 1 : raw.length;
        setSuggest(getSuggestions(raw, caretAt));
        setSuggestIndex(0);
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(caretAt, caretAt);
          inputRef.current?.focus();
        });
        return;
      }
      // Any other backspace: clear the pending-delete flag (user is editing
      // for real now) and let the input handle it.
      if (pendingDelete) setPendingDelete(null);
    }
  };

  // ⌘/ (or Ctrl+/) toggles the help overlay. Avoiding `?` so users can still
  // type a literal question mark inside descriptions.
  useHotkeys(
    'meta+/,ctrl+/',
    (e) => {
      if (!isOpen) return;
      e.preventDefault();
      setHelpOpen((v) => !v);
    },
    { enableOnFormTags: true },
    [isOpen]
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
              chipTokens={chipTokens}
              onChipRemove={handleChipRemove}
              onChipClick={handleChipClick}
              residual={residual}
              onResidualChange={handleResidualChange}
              onInputKeyDown={handleInputKeyDown}
              inputRef={inputRef}
              includedTypes={includedTypes}
              onToggleType={(t) => {
                setIncludedTypes((prev) => {
                  const next = new Set(prev);
                  if (next.has(t)) next.delete(t);
                  else next.add(t);
                  return next;
                });
              }}
              onSetAll={() => setIncludedTypes(new Set(allTypes))}
              onSetNone={() => setIncludedTypes(new Set())}
              hideNamedAdversaries={hideNamedAdversaries}
              onToggleHideNamed={() => setHideNamedAdversaries((v) => !v)}
            />

            <Box position="relative">
              {popupOpen && suggest && (
                <SpotlightSuggestPopup
                  result={suggest}
                  selectedIndex={suggestIndex}
                  onHover={setSuggestIndex}
                  onClick={(item) => {
                    setSuggestIndex(suggest.items.indexOf(item));
                    acceptSuggestion();
                  }}
                />
              )}
            </Box>

            <Flex h="70vh">
              <SpotlightResults
                listRef={listRef}
                results={displayedResults}
                loading={loading}
                selectedIndex={selectedIndex}
                onHoverIndex={(i) => setSelectedIndex(i)}
                onClickResult={(r) => loadDetail(r)}
                query={fullQuery}
                highlightedFields={highlightedFields}
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

            <SpotlightStatusBar />
          </VStack>
          {helpOpen && <SpotlightHelpOverlay onClose={() => setHelpOpen(false)} />}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default Spotlight;
