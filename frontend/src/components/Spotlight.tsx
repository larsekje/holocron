import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Flex, HStack, Modal, ModalBody, ModalContent, ModalOverlay, Text, VStack } from '@chakra-ui/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useSpotlightStore } from '@/state/spotlightStore';
import type { SpotlightResult, SpotlightDetail, SpotlightEntityType } from '@/state/spotlightStore';
import { searchIndex, getDetail, browseIndex, parseQuery, tokenEntityTypes } from '@/data/spotlightIndex';
import { extractCompletedTokens } from '@/data/spotlightQuery';

// Pick the natural sort direction for a numeric filter chip. `:high` / `>=` /
// `>` lean towards descending (highest first); `:low` / `<` / `<=` towards
// ascending (lowest first). Used when the user activates the arrow on a chip
// that wasn't explicitly typed with a sort direction.
function defaultSortDirectionFor(rawChip: string): 'asc' | 'desc' | null {
  const t = parseQuery(rawChip).tokens[0];
  if (!t || t.fieldDef.kind !== 'numeric') return null;
  const v = t.value.toLowerCase();
  if (v === 'high') return 'desc';
  if (v === 'low') return 'asc';
  if (t.op === '>' || t.op === '>=') return 'desc';
  if (t.op === '<' || t.op === '<=') return 'asc';
  return 'desc';
}

// Field name (canonical) for a chip if it's a numeric filter; null otherwise.
function numericFieldOf(rawChip: string): string | null {
  const t = parseQuery(rawChip).tokens[0];
  if (!t || t.fieldDef.kind !== 'numeric' || t.order) return null;
  return t.fieldDef.name;
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
  // (adversaries/talents/weapons/vehicles from public/assets/data + rules/qualities from extras).
  const allTypes: SpotlightEntityType[] = [
    'adversary',
    'talent',
    'weapon',
    'vehicle',
    'rule',
    'quality',
  ];
  const [includedTypes, setIncludedTypes] = useState<Set<SpotlightEntityType>>(new Set(allTypes));
  const [hideNamedAdversaries, setHideNamedAdversaries] = useState<boolean>(true);

  // Autocomplete popup
  const [suggest, setSuggest] = useState<SuggestResult | null>(null);
  const [suggestIndex, setSuggestIndex] = useState(0);
  const [caret, setCaret] = useState(0);
  const popupOpen = suggest !== null && suggest.items.length > 0;

  // Help overlay (`?`)
  const [helpOpen, setHelpOpen] = useState(false);

  // Single active sort, anchored to a chip's field. Cleared when that chip is
  // removed. When the user picks `:high` / `:low`, the new chip auto-claims
  // the active sort with its natural direction.
  const [activeSort, setActiveSort] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  // Multi-select picks accumulating in the popup (e.g. clicking "clout = 1"
  // and "clout = 3"). Tab/Enter commits all of them as a single chip.
  const [multiSelected, setMultiSelected] = useState<string[]>([]);

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
      setActiveSort(null);
      setMultiSelected([]);
    }
  }, [isOpen]);

  // Compose the full search string. `activeSort` is appended as a synthetic
  // `field:asc` / `field:desc` token so searchIndex sorts accordingly without
  // chips having to encode order in their text.
  const fullQuery = useMemo(() => {
    const parts: string[] = [...chips];
    if (activeSort) parts.push(`${activeSort.field}:${activeSort.direction}`);
    if (residual) parts.push(residual);
    return parts.join(' ');
  }, [chips, activeSort, residual]);

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

  // Suggestions are recomputed whenever the residual / caret / chip context
  // changes via a single useEffect below — the various edit handlers below
  // just update those state pieces and let the effect refresh the popup.

  // When new chips commit, auto-claim the active sort if any of them is a
  // sort-bearing chip — `:high` / `:low` quartile filters or a "sort only"
  // empty-value chip. Other filter chips don't auto-sort.
  const claimSortFromIncoming = (incoming: string[]) => {
    for (const raw of incoming) {
      const t = parseQuery(raw).tokens[0];
      if (!t || t.fieldDef.kind !== 'numeric') continue;
      const v = t.value.toLowerCase();
      if (v === 'high') return setActiveSort({ field: t.fieldDef.name, direction: 'desc' });
      if (v === 'low') return setActiveSort({ field: t.fieldDef.name, direction: 'asc' });
      if (v === '') return setActiveSort({ field: t.fieldDef.name, direction: 'desc' });
    }
  };

  const handleResidualChange = (value: string, c: number) => {
    setPendingDelete(null);
    const { committed, remaining, remainingCaret } = extractCompletedTokens(value, c);
    if (committed.length > 0) {
      setChips((prev) => [...prev, ...committed]);
      claimSortFromIncoming(committed);
      setResidual(remaining);
      setCaret(remainingCaret);
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(remainingCaret, remainingCaret);
        inputRef.current?.focus();
      });
      return;
    }
    setResidual(value);
    setCaret(c);
  };

  const handleChipRemove = (index: number) => {
    const removedField = numericFieldOf(chips[index] || '');
    setChips((prev) => prev.filter((_, i) => i !== index));
    if (removedField && activeSort?.field === removedField) {
      setActiveSort(null);
    }
  };

  // Click the arrow indicator on a numeric filter chip. Cycle: inactive →
  // default direction → opposite → cleared. Only one chip can be sorted at a
  // time, so activating one clears the others.
  const handleChipSortToggle = (index: number) => {
    const chip = chips[index];
    if (!chip) return;
    const field = numericFieldOf(chip);
    if (!field) return;
    const def = defaultSortDirectionFor(chip) ?? 'desc';
    if (!activeSort || activeSort.field !== field) {
      setActiveSort({ field, direction: def });
      return;
    }
    if (activeSort.direction === def) {
      setActiveSort({ field, direction: def === 'desc' ? 'asc' : 'desc' });
      return;
    }
    setActiveSort(null);
  };

  // Click the chip body → strip the value half and put it back into the input
  // so the popup opens with that field's full value menu. (The arrow indicator
  // is its own click target; see handleChipSortToggle.)
  const handleChipClick = (index: number) => {
    const chip = chips[index];
    if (!chip) return;
    const removedField = numericFieldOf(chip);
    setChips((prev) => prev.filter((_, i) => i !== index));
    if (removedField && activeSort?.field === removedField) setActiveSort(null);
    const colon = chip.indexOf(':');
    const fieldOnly = colon >= 0 ? chip.slice(0, colon + 1) : chip;
    const newResidual = residual ? `${fieldOnly} ${residual}` : fieldOnly;
    const caretAt = fieldOnly.length;
    setResidual(newResidual);
    setCaret(caretAt);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(caretAt, caretAt);
      inputRef.current?.focus();
    });
  };

  // Build the insert text from a multi-select set: collapse contiguous runs
  // of integers to dash form (1,2,3 → "1-3"), otherwise comma-list. Falls
  // back to plain join for non-numeric inserts.
  const composeMultiInsert = (raws: string[]): string => {
    const nums = raws
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n));
    if (nums.length === raws.length && nums.length >= 2) {
      const sorted = [...nums].sort((a, b) => a - b);
      const isContiguous = sorted.every((n, i) => i === 0 || n === sorted[i - 1] + 1);
      if (isContiguous) return `${sorted[0]}-${sorted[sorted.length - 1]}`;
      return sorted.join(',');
    }
    return [...raws].sort().join(',');
  };

  // Apply an explicit suggestion item against the current residual. Used by
  // both keyboard accept and click accept so the active code path is
  // unambiguous about which item is committing.
  const applyItem = (item: Suggestion) => {
    if (!suggest) return;
    setPendingDelete(null);
    const { next, caret: nextCaret } = applySuggestion(residual, suggest, item);
    const { committed, remaining, remainingCaret } = extractCompletedTokens(next, nextCaret);
    if (committed.length > 0) {
      setChips((prev) => [...prev, ...committed]);
      claimSortFromIncoming(committed);
      setResidual(remaining);
      setCaret(remainingCaret);
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(remainingCaret, remainingCaret);
        inputRef.current?.focus();
      });
      return;
    }
    setResidual(next);
    setCaret(nextCaret);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(nextCaret, nextCaret);
      inputRef.current?.focus();
    });
  };

  // Tab/Enter accepts: multi-select set if non-empty, otherwise the
  // highlighted item.
  const acceptSuggestion = () => {
    if (!suggest || suggest.items.length === 0) return;
    if (multiSelected.length > 0) {
      const composed = composeMultiInsert(multiSelected);
      applyItem({ display: composed, insert: composed, complete: true });
      return;
    }
    applyItem(suggest.items[suggestIndex]);
  };

  // Click handler for popup items. multiSelectable items toggle into the
  // selection set without closing the popup; everything else commits
  // immediately.
  const handleSuggestClick = (item: Suggestion) => {
    if (!suggest) return;
    if (item.multiSelectable) {
      setMultiSelected((prev) =>
        prev.includes(item.insert) ? prev.filter((v) => v !== item.insert) : [...prev, item.insert],
      );
      const idx = suggest.items.indexOf(item);
      if (idx >= 0) setSuggestIndex(idx);
      return;
    }
    applyItem(item);
  };

  // Tab/Enter accept the highlighted suggestion when popup is open. Esc closes
  // the popup first, then the help overlay, and only finally lets the modal close.
  // Backspace at start of empty input is two-stage: first press pulls the last
  // chip back into the input for editing (popup opens with its values); the
  // immediate next backspace clears it entirely.
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (popupOpen) {
      // Space toggles the highlighted item into the multi-select set when it's
      // a multiSelectable option (clout values etc.). Don't fall through to
      // the input adding a literal space.
      const highlighted = suggest!.items[suggestIndex];
      if (e.key === ' ' && highlighted?.multiSelectable) {
        e.preventDefault();
        setMultiSelected((prev) =>
          prev.includes(highlighted.insert)
            ? prev.filter((v) => v !== highlighted.insert)
            : [...prev, highlighted.insert],
        );
        return;
      }
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
        setCaret(0);
        setPendingDelete(null);
        return;
      }
      // Stage 1: empty input → bring the most recent chip back, strip the
      // value half so the popup re-opens with the full menu for that field.
      if (caretAtStart && residual === '' && chips.length > 0) {
        e.preventDefault();
        const lastIdx = chips.length - 1;
        const raw = chips[lastIdx];
        setChips((prev) => prev.slice(0, -1));
        const colon = raw.indexOf(':');
        const fieldOnly = colon >= 0 ? raw.slice(0, colon + 1) : raw;
        const caretAt = fieldOnly.length;
        setResidual(fieldOnly);
        setCaret(caretAt);
        setPendingDelete(fieldOnly);
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

  // Single source of truth for the suggestion popup: whenever residual / caret
  // / chips change, recompute. Passing chip tokens as context makes numeric
  // thresholds tier-aware (`type:nemesis wounds:` uses nemesis stats).
  useEffect(() => {
    if (!isOpen) {
      setSuggest(null);
      setSuggestIndex(0);
      setMultiSelected([]);
      return;
    }
    setSuggest(getSuggestions(residual, caret, chipTokens));
    setSuggestIndex(0);
    // Multi-select accumulates only inside one popup session — any change
    // that recomputes suggestions resets it.
    setMultiSelected([]);
  }, [residual, caret, chipTokens, isOpen]);

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
              onChipSortToggle={handleChipSortToggle}
              activeSort={activeSort}
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
                  multiSelected={multiSelected}
                  onHover={setSuggestIndex}
                  onClick={handleSuggestClick}
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
