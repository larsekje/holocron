import React, { useMemo, useState } from 'react';
import { Box, HStack, Input, Text, VStack, useToast } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import useUserContentStore, { type RosterEntry } from '@/state/userContentStore';
import useSessionPrepStore from '@/state/sessionPrepStore';
import { HALCYON_CAMPS, HALCYON_NPCS, type HalcyonCamp, type HalcyonNpc } from '@/data/halcyonHeist';
import type { NpcRef } from '@/data/encounterTemplates';
import { addNpcToEncounter } from './addNpc';
import { deriveProfile } from './rosterVisuals';
import TierDie from './TierDie';

/** A bench row's display facts, whichever library it came from. */
interface BenchItem {
  key: string;
  name: string;
  /** Identity line — species/role/disguise/note. */
  idline?: string;
  want?: string;
  pinned?: boolean;
  adversaryId?: string;
  count?: number;
  /** Present for roster entries → want is inline-editable. */
  rosterId?: string;
}

function fromRoster(r: RosterEntry): BenchItem {
  const profile = deriveProfile(r.adversaryId);
  const idline = r.note || (profile.sourceName && profile.sourceName !== r.name ? profile.sourceName : undefined);
  return {
    key: `roster-${r.id}`,
    name: r.name,
    idline,
    want: r.want,
    pinned: r.pinned,
    adversaryId: r.adversaryId,
    count: r.count,
    rosterId: r.id,
  };
}

function fromHalcyon(n: HalcyonNpc): BenchItem {
  return {
    key: n.id,
    name: n.name,
    // The disguise is what the player sees across the room — lead with it.
    idline: [n.face, n.species].filter(Boolean).join(' · '),
    want: n.want,
  };
}

function matches(item: BenchItem, q: string): boolean {
  const hay = `${item.name} ${item.idline ?? ''}`.toLowerCase();
  return hay.includes(q);
}

const MAX_RESULTS = 12;

type BenchTab = 'mine' | HalcyonCamp;

/** Camp → active-chip colour (undertow reads as danger; the rest follow the
 * Halcyon zone palette). Mine stays neutral. */
const CAMP_CHIP: Record<BenchTab, { bg: string; color: string }> = {
  mine: { bg: 'whiteAlpha.300', color: 'white' },
  undertow: { bg: '#8c4040', color: 'white' },
  ship: { bg: '#4db6a8', color: '#0e2422' },
  mark: { bg: '#c9a765', color: '#1a1c1e' },
  wild: { bg: '#5a7fb0', color: 'white' },
};

/**
 * BenchPanel — everyone who might walk into the scene: the GM's roster
 * (pinned recurrers first) with the bundled Halcyon cast reachable through the
 * same search. The input is find-or-create: typing filters all libraries; no
 * match + ↵ canonizes a brand-new NPC into the roster — inventing a person
 * mid-scene and keeping them is one motion. Hover actions: → scene (pull into
 * the live cast) and + enc (drop straight into the encounter, linked only).
 */
const BenchPanel: React.FC = () => {
  const roster = useUserContentStore((s) => s.roster);
  const addRosterEntry = useUserContentStore((s) => s.addRosterEntry);
  const updateRosterEntry = useUserContentStore((s) => s.updateRosterEntry);
  const addNpcToScene = useSessionPrepStore((s) => s.addNpcToScene);
  const sceneNpcs = useSessionPrepStore((s) => s.activeScene?.npcs);
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<BenchTab>('mine');
  const [editingWant, setEditingWant] = useState<string | null>(null);
  const [wantDraft, setWantDraft] = useState('');

  const inSceneNames = useMemo(
    () =>
      new Set(
        (sceneNpcs ?? []).map((n) => (typeof n === 'string' ? n : n.name).toLowerCase()),
      ),
    [sceneNpcs],
  );

  const q = query.trim().toLowerCase();
  const rosterItems = useMemo(() => {
    const items = roster.map(fromRoster);
    // Pinned first, otherwise keep the GM's own order.
    return [...items.filter((i) => i.pinned), ...items.filter((i) => !i.pinned)];
  }, [roster]);

  // A search spans everything; otherwise the active tab lists its members
  // outright — the cast should be readable at a glance, not search-gated.
  const visible: BenchItem[] = useMemo(() => {
    if (q) {
      const halcyon = HALCYON_NPCS.map(fromHalcyon);
      return [...rosterItems, ...halcyon].filter((i) => matches(i, q)).slice(0, MAX_RESULTS);
    }
    if (tab === 'mine') return rosterItems;
    return HALCYON_NPCS.filter((n) => n.camp === tab).map(fromHalcyon);
  }, [q, tab, rosterItems]);

  const exactMatch = visible.some((i) => i.name.toLowerCase() === q);

  const create = () => {
    const name = query.trim();
    if (!name || exactMatch) return;
    addRosterEntry({ name });
    setQuery('');
  };

  const pullToScene = (item: BenchItem) => {
    const npc: NpcRef = {
      name: item.name,
      descriptor: item.idline,
      adversaryId: item.adversaryId,
      count: item.count,
      want: item.want,
    };
    addNpcToScene(npc);
  };

  const dropIn = (item: BenchItem) => {
    const res = addNpcToEncounter({ name: item.name, adversaryId: item.adversaryId, count: item.count });
    toast({
      title: res ? 'Added to encounter' : 'No linked profile',
      description: res?.summary,
      status: res ? 'success' : 'warning',
      duration: 1800,
      isClosable: true,
    });
  };

  const commitWant = (item: BenchItem) => {
    setEditingWant(null);
    if (!item.rosterId) return;
    const want = wantDraft.trim();
    if (want !== (item.want ?? '')) updateRosterEntry(item.rosterId, { want: want || undefined });
  };

  return (
    <Box>
      {/* Camp tabs — Mine (the GM's roster) + the Halcyon camps, so the whole
          cast is one tap away instead of search-gated. */}
      <HStack spacing={1} mb={1.5} flexWrap="wrap">
        {([{ camp: 'mine' as const, label: 'Mine', count: roster.length }].concat(
          HALCYON_CAMPS.map((c) => ({
            camp: c.camp as BenchTab,
            label: c.label,
            count: HALCYON_NPCS.filter((n) => n.camp === c.camp).length,
          })),
        )).map(({ camp, label, count }) => {
          const on = tab === camp && !q;
          const chip = CAMP_CHIP[camp];
          return (
            <Box
              key={camp}
              as="button"
              fontSize="9px"
              fontWeight="bold"
              letterSpacing="0.05em"
              textTransform="uppercase"
              px={1.5}
              py="1px"
              borderRadius="sm"
              color={on ? chip.color : 'whiteAlpha.500'}
              bg={on ? chip.bg : 'whiteAlpha.100'}
              onClick={() => {
                setTab(camp);
                setQuery('');
              }}
            >
              {label} · {count}
            </Box>
          );
        })}
      </HStack>

      <HStack spacing={1.5} mb={1}>
        <SearchIcon color="whiteAlpha.400" boxSize="10px" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="find anyone — or name someone new… ↵"
          size="xs"
          variant="unstyled"
          color="whiteAlpha.900"
          fontSize="2xs"
          borderBottom="1px dashed"
          borderColor="whiteAlpha.300"
          borderRadius={0}
          _placeholder={{ color: 'whiteAlpha.400', fontStyle: 'italic' }}
        />
      </HStack>

      <VStack align="stretch" spacing="2px" maxH="230px" overflowY="auto" pr={0.5}>
        {visible.map((item) => {
          const profile = deriveProfile(item.adversaryId);
          const here = inSceneNames.has(item.name.toLowerCase());
          const isEditing = editingWant === item.key;
          return (
            <HStack
              key={item.key}
              role="group"
              spacing={1.5}
              px={1.5}
              py="2px"
              borderRadius="md"
              opacity={here ? 0.45 : 1}
              _hover={{ bg: 'whiteAlpha.50' }}
              position="relative"
            >
              <Box w="14px" display="flex" justifyContent="center" flexShrink={0}>
                {item.pinned ? (
                  <Text color="#d39939" fontSize="9px">◈</Text>
                ) : profile.tier ? (
                  <TierDie tier={profile.tier} size={12} />
                ) : (
                  <Box w="4px" h="4px" borderRadius="full" bg="whiteAlpha.300" />
                )}
              </Box>
              <Text color="whiteAlpha.900" fontSize="2xs" fontWeight="semibold" flexShrink={0} noOfLines={1} maxW="38%">
                {item.name}
              </Text>
              {item.idline && (
                <Text color="whiteAlpha.500" fontSize="10px" flexShrink={0} noOfLines={1} maxW="30%">
                  {item.idline}
                </Text>
              )}
              {here ? (
                <Text color="#7fcaa1" fontSize="9px" flexShrink={0}>· in scene</Text>
              ) : isEditing ? (
                <Input
                  value={wantDraft}
                  onChange={(e) => setWantDraft(e.target.value)}
                  onBlur={() => commitWant(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitWant(item);
                    if (e.key === 'Escape') setEditingWant(null);
                  }}
                  placeholder="what do they want?"
                  size="xs"
                  variant="unstyled"
                  color="#b7c6a8"
                  fontSize="10px"
                  flex="1"
                  autoFocus
                />
              ) : (
                <Text
                  color={item.want ? '#a9b89b' : 'whiteAlpha.300'}
                  fontSize="10px"
                  fontStyle={item.want ? undefined : 'italic'}
                  flex="1"
                  noOfLines={1}
                  cursor={item.rosterId ? 'text' : undefined}
                  onClick={
                    item.rosterId
                      ? () => {
                          setWantDraft(item.want ?? '');
                          setEditingWant(item.key);
                        }
                      : undefined
                  }
                >
                  {item.want ? `▸ ${item.want}` : item.rosterId ? '▸ add a want…' : ''}
                </Text>
              )}

              {!here && (
                <HStack
                  spacing={0.5}
                  position="absolute"
                  right="2px"
                  top="1px"
                  bg="#26292d"
                  borderRadius="md"
                  boxShadow="0 0 5px 4px #26292d"
                  opacity={0}
                  pointerEvents="none"
                  _groupHover={{ opacity: 1, pointerEvents: 'auto' }}
                  transition="opacity 120ms"
                >
                  <Box
                    as="button"
                    fontSize="9px"
                    fontWeight="semibold"
                    color="#7fb0ca"
                    borderWidth="1px"
                    borderColor="rgba(127,176,202,0.35)"
                    borderRadius="md"
                    px={1.5}
                    py="1px"
                    _hover={{ bg: 'rgba(127,176,202,0.14)' }}
                    onClick={() => pullToScene(item)}
                  >
                    → scene
                  </Box>
                  {item.adversaryId && (
                    <Box
                      as="button"
                      fontSize="9px"
                      fontWeight="semibold"
                      color="#7fcaa1"
                      borderWidth="1px"
                      borderColor="rgba(127,202,161,0.35)"
                      borderRadius="md"
                      px={1.5}
                      py="1px"
                      _hover={{ bg: 'rgba(127,202,161,0.14)' }}
                      onClick={() => dropIn(item)}
                    >
                      + enc
                    </Box>
                  )}
                </HStack>
              )}
            </HStack>
          );
        })}
        <Text color="whiteAlpha.400" fontSize="10px" fontStyle="italic" px={1.5} pt="2px">
          {q
            ? exactMatch || visible.length > 0
              ? 'searching roster + Halcyon cast'
              : `no match — ↵ to create “${query.trim()}”`
            : tab === 'mine' && roster.length === 0
            ? 'no NPCs of your own yet — type a name + ↵ to add one'
            : ''}
        </Text>
      </VStack>
    </Box>
  );
};

export default BenchPanel;
