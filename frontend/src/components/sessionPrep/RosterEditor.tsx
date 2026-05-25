import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  HStack,
  IconButton,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Text,
  Tooltip,
  VStack,
  keyframes,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon } from '@chakra-ui/icons';
import { FiCornerDownLeft, FiEye, FiGrid, FiImage, FiLink, FiList, FiMonitor, FiMoreVertical, FiUsers } from 'react-icons/fi';
import { FaDice, FaThumbtack } from 'react-icons/fa';
import { rollNpcDescriptor, rollNpcName } from '@/data/npcDescriptors';
import usePlayerDisplayStore from '@/state/playerDisplayStore';
import useShareStore from '@/state/shareStore';
import useUserContentStore, {
  newRosterGroupId,
  RosterEntry,
  RosterGroup,
} from '@/state/userContentStore';
import usePrepUiStore from '@/state/prepUiStore';
import { searchIndex, getDetail } from '@/data/spotlightIndex';
import { addNpcToEncounter } from './addNpc';
import { deriveProfile, Tier } from './rosterVisuals';
import AdversaryPicker from './AdversaryPicker';
import SpotlightDetailPane from '@/components/spotlight/SpotlightDetailPane';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as DifficultySvg } from '@/assets/dice/difficulty.svg';
import { ReactComponent as ChallengeSvg } from '@/assets/dice/challenge.svg';

// Subtle drop-in for an expanding squad's members panel.
const fadeIn = keyframes`from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; }`;

/* ───────────────────────── tier die ───────────────────────── */

/** Tier as the matching narrative-die icon — Minion=Setback, Rival=Difficulty,
 *  Nemesis=Challenge — the same visual language as the target cards (MiniStatCard
 *  TierIcon) and the dice roller. Sat on a subtle plate so the near-black Setback
 *  (Minion) die stays visible against the dark roster background. */
const TierDie: React.FC<{ tier: Tier; size?: number }> = ({ tier, size = 14 }) => {
  const Svg = tier === 'Nemesis' ? ChallengeSvg : tier === 'Rival' ? DifficultySvg : SetbackSvg;
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      bg="whiteAlpha.300"
      borderRadius="sm"
      p="2px"
      lineHeight={0}
    >
      <Svg width={size} height={size} />
    </Box>
  );
};

/* ─────────────── add-to-scene (confirm popover) ─────────────── */

/** Green ＋ that confirms before dropping anyone into the active scene — an
 *  accidental add clutters the encounter and has to be cleaned up, so every add
 *  (one NPC, or a whole squad) asks first. `triggerLabel` renders a pill with
 *  text; otherwise it's an icon-only button. */
const AddToSceneButton: React.FC<{
  question: string;
  onConfirm: () => void;
  triggerLabel?: string;
  ariaLabel?: string;
}> = ({ question, onConfirm, triggerLabel, ariaLabel }) => (
  <Popover isLazy placement="bottom-end" closeOnBlur gutter={4}>
    {({ onClose }) => (
      <>
        <PopoverTrigger>
          {triggerLabel ? (
            <HStack as="button" spacing={1} px={1.5} h="20px" borderRadius="md" color="#7fcaa1" flexShrink={0} _hover={{ color: '#a8e0bf', bg: 'whiteAlpha.100' }} onClick={(e) => e.stopPropagation()}>
              <AddIcon boxSize="8px" />
              <Text fontSize="2xs" fontWeight="medium">{triggerLabel}</Text>
            </HStack>
          ) : (
            <IconButton aria-label={ariaLabel ?? 'Add to scene'} icon={<AddIcon boxSize="9px" />} size="xs" h="20px" minW="20px" variant="ghost" color="#7fcaa1" flexShrink={0} _hover={{ color: '#a8e0bf', bg: 'whiteAlpha.100' }} onClick={(e) => e.stopPropagation()} />
          )}
        </PopoverTrigger>
        <Portal>
          <PopoverContent bg="#16181c" borderColor="whiteAlpha.300" w="auto" maxW="240px" onClick={(e) => e.stopPropagation()} _focus={{ boxShadow: 'none', outline: 'none' }}>
            <PopoverArrow bg="#16181c" />
            <PopoverBody px={2} py={2}>
              <Text fontSize="xs" color="whiteAlpha.800" mb={2}>{question}</Text>
              <HStack spacing={1} justify="flex-end">
                <Button size="xs" h="22px" variant="ghost" color="whiteAlpha.600" fontSize="2xs" onClick={onClose} _hover={{ bg: 'whiteAlpha.100', color: 'white' }}>
                  Cancel
                </Button>
                <Button size="xs" h="22px" bg="rgba(127,202,161,0.18)" color="#a8e0bf" fontSize="2xs" leftIcon={<AddIcon boxSize="7px" />} onClick={() => { onConfirm(); onClose(); }} _hover={{ bg: 'rgba(127,202,161,0.28)' }}>
                  Add
                </Button>
              </HStack>
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </>
    )}
  </Popover>
);

/* ───────────────────────── add bar ───────────────────────── */

/**
 * One input that does both jobs the old roster split across two: type ≥2 chars
 * to search stat blocks (each match previews its tier + faction), or hit Enter
 * to drop whatever you typed in as a plain, statless NPC. Pass `groupId` to add
 * straight into a squad.
 */
const RosterAddBar: React.FC<{ groupId?: string; placeholder?: string; compact?: boolean; autoFocus?: boolean; onClose?: () => void }> = ({ groupId, placeholder, compact, autoFocus, onClose }) => {
  const addRosterEntry = useUserContentStore((s) => s.addRosterEntry);
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const t = term.trim();
    if (t.length < 2) return [];
    // `adv:` scopes to the adversary entity type; the trailing space keeps `t`
    // as the search term (see AdversaryPicker for the full why).
    return searchIndex(`adv: ${t}`).slice(0, 6);
  }, [term]);

  const addLinked = (r: { id: string; name: string; subtitle?: string }) => {
    // Don't seed the note with the subtitle — for adversaries that's just the
    // tier (already shown as the chip). The note stays the GM's own quirk line.
    // No count: minions then drop in at their authored squad size.
    addRosterEntry({ name: r.name, adversaryId: r.id, groupId });
    setTerm('');
    inputRef.current?.focus(); // keep the bar open + focused for the next add
  };
  const addFreeform = () => {
    const name = term.trim();
    if (!name) return;
    addRosterEntry({ name, groupId });
    setTerm('');
    inputRef.current?.focus();
  };

  const open = term.trim().length >= 1;

  return (
    <Box position="relative">
      <Input
        ref={inputRef}
        autoFocus={autoFocus}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onBlur={() => setTimeout(() => {
          // close once focus has truly left the bar and there's nothing typed
          if (document.activeElement !== inputRef.current && !inputRef.current?.value) onClose?.();
        }, 200)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') addFreeform();
          if (e.key === 'Escape') { setTerm(''); onClose?.(); }
        }}
        placeholder={placeholder ?? 'Add a stat block — or type a name and press ↵'}
        size="xs"
        h={compact ? '22px' : '28px'}
        bg={compact ? 'transparent' : '#1f2225'}
        borderColor="whiteAlpha.200"
        borderStyle={compact ? 'dashed' : 'solid'}
        color="whiteAlpha.900"
        fontSize="2xs"
        _placeholder={{ color: 'whiteAlpha.400' }}
        _focus={{ borderColor: 'whiteAlpha.400', boxShadow: 'none' }}
      />
      {open && (
        <VStack
          align="stretch"
          spacing={0}
          position="absolute"
          top="calc(100% + 2px)"
          left={0}
          right={0}
          maxH="240px"
          overflowY="auto"
          zIndex={20}
          bg="#1a1c1e"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          borderRadius="md"
          boxShadow="0 8px 24px rgba(0,0,0,0.45)"
        >
          {results.map((r) => {
            const p = deriveProfile(r.id);
            const hint = [p.tier, p.faction].filter(Boolean).join(' · ');
            return (
              <Box key={`${r.type}:${r.id}`} px={2} py={1} cursor="pointer" _hover={{ bg: 'whiteAlpha.100' }} onClick={() => addLinked(r)}>
                <HStack spacing={1.5} align="center">
                  {p.tier && (
                    <Box display="inline-flex" flexShrink={0}>
                      <TierDie tier={p.tier} size={14} />
                    </Box>
                  )}
                  <Text fontSize="xs" color="whiteAlpha.900" noOfLines={1} flex="1" minW={0}>
                    {r.name}
                  </Text>
                  {hint && (
                    <Text fontSize="9px" color="whiteAlpha.500" noOfLines={1} flexShrink={0}>
                      {hint}
                    </Text>
                  )}
                </HStack>
              </Box>
            );
          })}
          <HStack px={2} py={1.5} spacing={1.5} cursor="pointer" borderTopWidth={results.length > 0 ? '1px' : 0} borderColor="whiteAlpha.150" _hover={{ bg: 'whiteAlpha.100' }} onClick={addFreeform} color="whiteAlpha.700">
            <FiCornerDownLeft size={11} />
            <Text fontSize="2xs">
              Add <Text as="span" color="white" fontWeight="medium">“{term.trim()}”</Text> as a plain NPC
            </Text>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

/* ───────────────────────── image url editor ───────────────────────── */

/** Small inline form to paste/clear an NPC's image URL (opened from the ⋯ menu).
 *  Commits on Enter or "Set" so a half-typed URL never tries to load. */
const ImageUrlEditor: React.FC<{ initial: string; onSubmit: (url: string) => void; onCancel: () => void }> = ({ initial, onSubmit, onCancel }) => {
  const [draft, setDraft] = useState(initial);
  return (
    <HStack spacing={1} align="center">
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(draft.trim()); if (e.key === 'Escape') onCancel(); }}
        placeholder="Paste an image URL…"
        size="xs" bg="#1f2225" borderColor="whiteAlpha.200" color="whiteAlpha.900" fontSize="2xs"
        _placeholder={{ color: 'whiteAlpha.400' }}
        _focus={{ borderColor: 'whiteAlpha.400', boxShadow: 'none' }}
      />
      <Button size="xs" colorScheme="blue" flexShrink={0} onClick={() => onSubmit(draft.trim())}>Set</Button>
      <IconButton aria-label="Cancel image" icon={<CloseIcon boxSize="8px" />} size="xs" variant="ghost" color="whiteAlpha.500" _hover={{ color: 'white', bg: 'whiteAlpha.100' }} flexShrink={0} onClick={onCancel} />
    </HStack>
  );
};

/* ───────────────────────── roster row ───────────────────────── */

const RosterNpcRow: React.FC<{ entry: RosterEntry; groups: RosterGroup[] }> = ({ entry, groups }) => {
  const updateRosterEntry = useUserContentStore((s) => s.updateRosterEntry);
  const removeRosterEntry = useUserContentStore((s) => s.removeRosterEntry);
  const addRosterGroup = useUserContentStore((s) => s.addRosterGroup);
  const toast = useToast();
  const [linking, setLinking] = useState(false);
  const [editing, setEditing] = useState<null | 'name' | 'note'>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [settingImage, setSettingImage] = useState(false);
  const statDrawer = useDisclosure();
  const noteInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  // The note clamps to 2 lines; on hover we expand it IN PLACE over an overlay
  // (anchored to the note, so the gaze doesn't move and no other card shifts) —
  // only when it's actually cut off.
  const noteRef = useRef<HTMLParagraphElement>(null);
  const [noteClamped, setNoteClamped] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const noteTimer = useRef<number>();
  const openNote = () => {
    if (!noteClamped) return;
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNoteOpen(true), 180);
  };
  const closeNote = () => {
    window.clearTimeout(noteTimer.current);
    setNoteOpen(false);
  };

  // Flash-to-players: push this NPC's image onto the shared player view.
  const liveImageUrl = usePlayerDisplayStore((s) => s.imageUrl);
  const setDisplayImage = usePlayerDisplayStore((s) => s.setImage);
  const clearDisplayImage = usePlayerDisplayStore((s) => s.clear);
  const isSharing = useShareStore((s) => s.isSharing);
  const isLive = !!entry.image && liveImageUrl === entry.image;

  const profile = deriveProfile(entry.adversaryId);
  const linked = !!entry.adversaryId && profile.found;
  const renamed = linked && !!profile.sourceName && profile.sourceName !== entry.name;

  const flashToPlayers = () => {
    if (!entry.image) return;
    if (isLive) {
      clearDisplayImage();
      toast({ title: 'Cleared from player view', status: 'info', duration: 1400, isClosable: true });
    } else {
      setDisplayImage(entry.image, entry.name);
      toast({
        title: isSharing ? 'Flashed to players' : 'Set — start sharing to show players',
        description: entry.name,
        status: isSharing ? 'success' : 'warning',
        duration: 1800,
        isClosable: true,
      });
    }
  };

  const dropIn = () => {
    // A roster entry is one NPC (or one minion group at authored size) — don't
    // pass a count, so a renamed individual like "Slipprigg" adds exactly one,
    // not N suffixed copies from any legacy count value.
    const res = addNpcToEncounter({ name: entry.name, adversaryId: entry.adversaryId });
    toast({
      title: res ? 'Dropped into scene' : 'No linked profile',
      description: res?.summary,
      status: res ? 'success' : 'warning',
      duration: 1800,
      isClosable: true,
    });
  };

  const moveToNewGroup = () => {
    const id = newRosterGroupId();
    addRosterGroup({ id, name: '' });
    updateRosterEntry(entry.id, { groupId: id });
  };

  const stopEdit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') setEditing(null);
  };

  // "Need a quick little something" — roll a random descriptor/quirk into the note.
  const rollQuirk = () => updateRosterEntry(entry.id, { note: rollNpcDescriptor() });
  const rollName = () => updateRosterEntry(entry.id, { name: rollNpcName() });

  const showNote = !!entry.note || editing === 'note';

  // Recompute whether the (display) note overflows its 2-line clamp.
  useEffect(() => {
    const el = noteRef.current;
    setNoteClamped(!!el && el.scrollHeight > el.clientHeight + 1);
  }, [entry.note, showNote, editing]);

  return (
    <Box
      role="group"
      position="relative"
      borderRadius="md"
      zIndex={noteOpen ? 4 : undefined}
      _hover={{ bg: 'whiteAlpha.50' }}
    >
      {/* Pin anchored to the ROW's top-left corner, fully inside the row bounds —
          any bleed (top OR left) gets clipped by the section/squad Collapse, so it
          sits flush at 0,0 over the marker corner instead. */}
      {entry.pinned && (
        <Box position="absolute" top="0px" left="0px" color="#d39939" transform="rotate(-30deg)" pointerEvents="none" zIndex={3}>
          <FaThumbtack size={9} />
        </Box>
      )}
      {/* Floated actions — the frequent "add to encounter" stays a direct button;
          everything else lives in the ⋮ menu. Reserves no row width. */}
      <HStack
        position="absolute"
        top="3px"
        right="3px"
        spacing={0}
        opacity={0}
        pointerEvents="none"
        _groupHover={{ opacity: 1, pointerEvents: 'auto' }}
        transition="opacity 120ms"
        zIndex={2}
        bg="#23262b"
        borderRadius="md"
        boxShadow="0 0 5px 4px #23262b"
      >
        {entry.image && (
          <Tooltip label={isLive ? 'Clear from player view' : 'Flash to players'} placement="top" hasArrow openDelay={300} bg="#1a1c1e">
            <IconButton
              aria-label="Flash to players"
              icon={<FiMonitor />}
              size="xs" h="20px" minW="20px" variant="ghost"
              color={isLive ? '#7fb0ca' : 'whiteAlpha.700'}
              bg={isLive ? 'rgba(127,176,202,0.16)' : undefined}
              _hover={{ color: '#a8d0e0', bg: 'whiteAlpha.100' }}
              onClick={flashToPlayers}
            />
          </Tooltip>
        )}
        {linked && (
          <AddToSceneButton
            ariaLabel="Add to scene"
            question={`Add ${entry.name || profile.sourceName || 'this NPC'} to the scene?`}
            onConfirm={dropIn}
          />
        )}
        <Menu isLazy placement="bottom-end" onClose={() => setConfirmDel(false)}>
          <MenuButton
            as={IconButton}
            aria-label="NPC actions"
            icon={<FiMoreVertical />}
            size="xs" h="20px" minW="20px"
            variant="ghost" color="whiteAlpha.700"
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            _active={{ bg: 'whiteAlpha.100' }}
          />
          <Portal>
          <MenuList bg="#16181c" borderColor="whiteAlpha.200" color="whiteAlpha.900" minW="190px" py={1} zIndex={1500}>
            <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FaThumbtack size={11} />} onClick={() => updateRosterEntry(entry.id, { pinned: !entry.pinned })}>
              {entry.pinned ? 'Unpin' : 'Pin to top'}
            </MenuItem>
            <MenuDivider borderColor="whiteAlpha.150" />
            {linked && (
              <>
                <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FiEye />} onClick={statDrawer.onOpen}>
                  View stat block
                </MenuItem>
                <MenuDivider borderColor="whiteAlpha.150" />
              </>
            )}
            {linked ? (
              <>
                <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FiLink />} onClick={() => setLinking(true)}>
                  Relink stat block…
                </MenuItem>
                <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" onClick={() => updateRosterEntry(entry.id, { adversaryId: undefined })}>
                  Unlink stat block
                </MenuItem>
              </>
            ) : (
              <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FiLink />} onClick={() => setLinking(true)}>
                Link a stat block…
              </MenuItem>
            )}
            {!entry.note && (
              <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" onClick={() => setEditing('note')}>
                Add note…
              </MenuItem>
            )}
            <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FiImage />} onClick={() => setSettingImage(true)}>
              {entry.image ? 'Change image…' : 'Add image…'}
            </MenuItem>
            {entry.image && (
              <>
                <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FiMonitor />} onClick={flashToPlayers}>
                  {isLive ? 'Clear from player view' : 'Flash to players'}
                </MenuItem>
                <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" onClick={() => updateRosterEntry(entry.id, { image: undefined })}>
                  Remove image
                </MenuItem>
              </>
            )}
            <MenuDivider borderColor="whiteAlpha.150" />
            {groups.filter((g) => g.id !== entry.groupId).map((g) => (
              <MenuItem key={g.id} bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FiUsers />} onClick={() => updateRosterEntry(entry.id, { groupId: g.id })}>
                Move to {g.name || 'Untitled squad'}
              </MenuItem>
            ))}
            <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FiUsers />} onClick={moveToNewGroup}>
              Move to new squad…
            </MenuItem>
            {entry.groupId && (
              <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" onClick={() => updateRosterEntry(entry.id, { groupId: undefined })}>
                Remove from squad
              </MenuItem>
            )}
            <MenuDivider borderColor="whiteAlpha.150" />
            {/* Two-step delete — never one-click. */}
            {confirmDel ? (
              <MenuItem closeOnSelect bg="rgba(176,48,48,0.22)" _hover={{ bg: 'rgba(176,48,48,0.32)' }} color="#e8a0a0" fontSize="xs" fontWeight="semibold" onClick={() => removeRosterEntry(entry.id)}>
                Click again to remove
              </MenuItem>
            ) : (
              <MenuItem closeOnSelect={false} bg="#16181c" _hover={{ bg: 'rgba(176,48,48,0.18)' }} color="#e08080" fontSize="xs" onClick={() => setConfirmDel(true)}>
                Remove from roster…
              </MenuItem>
            )}
          </MenuList>
          </Portal>
        </Menu>
      </HStack>

      <Box pl="3px" pr={1} py="3px">
        {/* Line 1 — identity: tier die · name · linked block */}
        <HStack spacing={1.5} align="center" minH="18px">
          {/* Fixed-width marker so the name never shifts: it holds the tier die /
              dot, OR the name-roll dice while editing the name — same slot, no jump.
              A pinned NPC gets a small corner pin (absolute → no shift). */}
          <Box w="18px" h="18px" flexShrink={0} display="flex" alignItems="center" justifyContent="flex-start" position="relative">
            {editing === 'name' ? (
              <Box
                as="span"
                role="button"
                aria-label="Roll a random name"
                title="Roll a random name — tap again to re-roll"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { rollName(); nameInputRef.current?.focus(); }}
                cursor="pointer"
                display="inline-flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="md"
                bg="whiteAlpha.100" color="whiteAlpha.600" fontSize="12px"
                _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
              >
                <FaDice />
              </Box>
            ) : entry.image ? (
              <Image
                src={entry.image}
                alt=""
                boxSize="18px"
                borderRadius="sm"
                objectFit="cover"
                fallback={<Box w="5px" h="5px" borderRadius="full" bg="whiteAlpha.300" />}
              />
            ) : linked && profile.tier ? (
              <Tooltip label={profile.tier} placement="top" hasArrow openDelay={400} bg="#1a1c1e">
                <Box display="inline-flex"><TierDie tier={profile.tier} size={14} /></Box>
              </Tooltip>
            ) : (
              // Flush at the slot's left so the dot lines up with the tier die's
              // PLATE edge (the box the eye tracks, and the bit that pops on hover).
              <Box w="5px" h="5px" borderRadius="full" bg="whiteAlpha.300" />
            )}
          </Box>

          {editing === 'name' ? (
            <Input
              ref={nameInputRef}
              autoFocus
              value={entry.name}
              onChange={(e) => updateRosterEntry(entry.id, { name: e.target.value })}
              onBlur={() => setTimeout(() => {
                if (document.activeElement !== nameInputRef.current) {
                  setEditing((cur) => (cur === 'name' ? null : cur));
                }
              }, 200)}
              onKeyDown={stopEdit}
              size="xs" variant="unstyled" color="white" fontSize="xs" fontWeight="medium" h="18px" flex="1" minW={0}
            />
          ) : (
            <Text onClick={() => setEditing('name')} color="white" fontSize="xs" fontWeight="medium" lineHeight="1.3" noOfLines={1} flexShrink={1} minW={0} cursor="text">
              {entry.name || <Box as="span" color="whiteAlpha.400">Unnamed</Box>}
            </Text>
          )}

          {/* Linked stat block (renamed NPCs) — click to view the full block. */}
          {linked && renamed && profile.sourceName && editing !== 'name' && (
            <Tooltip label={`${profile.sourceName} — click to view stat block`} placement="top" hasArrow openDelay={400} bg="#1a1c1e">
              <HStack spacing={0.5} color="whiteAlpha.500" flexShrink={1} minW={0} cursor="pointer" _hover={{ color: 'whiteAlpha.800' }} onClick={statDrawer.onOpen}>
                <Box display="inline-flex" flexShrink={0}><FiLink size={9} /></Box>
                <Text fontSize="2xs" noOfLines={1} minW={0}>{profile.sourceName}</Text>
              </HStack>
            </Tooltip>
          )}

          {/* Spacer; an unobtrusive "note…" starter appears on hover when empty.
              Hidden while editing the name so the name input + dice get the row. */}
          {editing !== 'name' && (showNote ? (
            <Box flex="1" minW={0} />
          ) : (
            <Box flex="1" minW={0} pl={1} cursor="text" onClick={() => setEditing('note')}>
              <Text fontSize="2xs" color="whiteAlpha.400" opacity={0} _groupHover={{ opacity: 1 }} transition="opacity 120ms">
                note…
              </Text>
            </Box>
          ))}
        </HStack>

        {/* Line 2 — fluff: its own full-width line, up to two lines, only when used.
            The quirk dice shows only while editing an EMPTY note (a quick starter). */}
        {showNote && (
          <Box position="relative" pl="22px" pr="2px" mt="1px" display="flex" alignItems="center" minH="16px">
            {/* Quirk dice sits in the left indent (absolute) so showing it never
                shifts the note text/input. Re-focus + delayed blur let you re-roll. */}
            {editing === 'note' && (
              <Box
                as="span"
                role="button"
                aria-label="Roll a quick descriptor / quirk"
                title="Roll a quick descriptor / quirk — tap again to re-roll"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { rollQuirk(); noteInputRef.current?.focus(); }}
                cursor="pointer"
                position="absolute"
                left="-1px"
                top="50%"
                transform="translateY(-50%)"
                display="inline-flex" alignItems="center" justifyContent="center"
                w="18px" h="18px" borderRadius="md"
                bg="whiteAlpha.100" color="whiteAlpha.600" fontSize="12px"
                _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
              >
                <FaDice />
              </Box>
            )}
            {editing === 'note' ? (
              <Input
                ref={noteInputRef}
                autoFocus
                value={entry.note ?? ''}
                onChange={(e) => updateRosterEntry(entry.id, { note: e.target.value })}
                onBlur={() => setTimeout(() => {
                  if (document.activeElement !== noteInputRef.current) {
                    setEditing((cur) => (cur === 'note' ? null : cur));
                  }
                }, 200)}
                onKeyDown={stopEdit}
                placeholder="note, quirk, what they want…"
                size="xs" variant="unstyled" color="whiteAlpha.700" fontSize="2xs" h="16px" flex="1" minW={0}
                _placeholder={{ color: 'whiteAlpha.400' }}
              />
            ) : (
              <Box position="relative" flex="1" minW={0} onMouseEnter={openNote} onMouseLeave={closeNote}>
                <Text ref={noteRef} onClick={() => setEditing('note')} color="whiteAlpha.600" fontSize="2xs" lineHeight="1.4" noOfLines={2} cursor="text">
                  {entry.note}
                </Text>
                {/* Expanded in place: same left edge as the clamped note, drawn on
                    a solid overlay so it covers the rows below without shifting them. */}
                {noteOpen && (
                  <Box
                    position="absolute" top="-4px" left="-6px" right="-6px" zIndex={1}
                    bg="#2b2e34" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="md"
                    boxShadow="0 8px 22px rgba(0,0,0,0.55)" px={2} py={1.5}
                    onClick={() => setEditing('note')} cursor="text"
                  >
                    <Text color="whiteAlpha.800" fontSize="2xs" lineHeight="1.5" whiteSpace="pre-wrap">
                      {entry.note}
                    </Text>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Inline link picker — opened from the ⋯ menu. Esc or the ✕ cancels. */}
      {linking && (
        <Box pb={1} pl="22px" pr={1} onKeyDown={(e) => { if (e.key === 'Escape') setLinking(false); }}>
          <HStack spacing={1} align="flex-start">
            <Box flex="1" minW={0}>
              <AdversaryPicker
                placeholder="Search a stat block to link…"
                onPick={(p) => {
                  updateRosterEntry(entry.id, {
                    adversaryId: p.id,
                    name: entry.name.trim() ? entry.name : p.name,
                  });
                  setLinking(false);
                }}
              />
            </Box>
            <Tooltip label="Cancel" placement="top" hasArrow openDelay={300} bg="#1a1c1e">
              <IconButton aria-label="Cancel linking" icon={<CloseIcon boxSize="8px" />} size="sm" variant="ghost" color="whiteAlpha.500" _hover={{ color: 'white', bg: 'whiteAlpha.100' }} flexShrink={0} onClick={() => setLinking(false)} />
            </Tooltip>
          </HStack>
        </Box>
      )}

      {/* Inline image-URL editor — opened from the ⋯ menu. */}
      {settingImage && (
        <Box pb={1} pl="22px" pr={1}>
          <ImageUrlEditor
            initial={entry.image ?? ''}
            onSubmit={(url) => { updateRosterEntry(entry.id, { image: url || undefined }); setSettingImage(false); }}
            onCancel={() => setSettingImage(false)}
          />
        </Box>
      )}

      {/* Full stat block — opened from the linked-block label or the context menu. */}
      {linked && (
        <Drawer isOpen={statDrawer.isOpen} onClose={statDrawer.onClose} placement="right" size="md">
          <DrawerOverlay />
          <DrawerContent bg="#191A1C" color="whiteAlpha.900">
            <DrawerCloseButton />
            <DrawerHeader fontSize="sm" color="whiteAlpha.600" fontWeight="medium" borderBottomWidth="1px" borderColor="whiteAlpha.150">
              {entry.name}
              {renamed && profile.sourceName ? ` · ${profile.sourceName}` : ''}
            </DrawerHeader>
            <DrawerBody p={0} overflowY="auto">
              {statDrawer.isOpen && (
                <SpotlightDetailPane detail={getDetail('adversary', entry.adversaryId!)} detailLoading={false} />
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </Box>
  );
};

/* ───────────────────────── two-column list ───────────────────────── */

/** Renders roster entries in two columns (filled top-to-bottom down column 1,
 *  then column 2), used for the top (standalone + pinned) list and every squad's
 *  members so the whole roster reads in one consistent layout.
 *
 *  Deliberately a manual flex split, NOT CSS `column-count`: Chrome mis-paints
 *  `position: absolute` descendants (the per-row hover actions) inside a
 *  multi-column container — the top-of-column-2 row's overlay would visibly shift
 *  and not repaint back. Flex columns have no fragmentation, so that can't happen. */
const RosterColumns: React.FC<{ entries: RosterEntry[]; groups: RosterGroup[] }> = ({ entries, groups }) => {
  const mid = Math.ceil(entries.length / 2);
  const columns = [entries.slice(0, mid), entries.slice(mid)];
  return (
    <HStack align="flex-start" spacing="6px">
      {columns.map((col, i) => (
        <VStack key={i} align="stretch" spacing="2px" flex="1" minW={0}>
          {col.map((r) => (
            <RosterNpcRow key={r.id} entry={r} groups={groups} />
          ))}
        </VStack>
      ))}
    </HStack>
  );
};

/* ──────────────── compact drop-in member card ──────────────── */

/** Compact drop-in member: just tier glyph · name · confirm-to-add ＋ — a tight
 *  roster line for dropping a squad in. Freeform members (no stat block) read
 *  dimmed and have no ＋; only statted ones drop. (The full view carries the
 *  links + notes.) */
const CompactMemberCard: React.FC<{ entry: RosterEntry }> = ({ entry }) => {
  const profile = entry.adversaryId ? deriveProfile(entry.adversaryId) : null;
  const renamed = !!profile?.sourceName && profile.sourceName !== entry.name;
  const toast = useToast();
  const statDrawer = useDisclosure();
  const add = () => {
    const ok = addNpcToEncounter({ name: entry.name, adversaryId: entry.adversaryId });
    toast({ title: ok ? `${entry.name} dropped into scene` : 'No linked profile', status: ok ? 'success' : 'warning', duration: 1600, isClosable: true });
  };
  return (
    <HStack spacing={1} pl={1.5} pr={entry.adversaryId ? '2px' : 1.5} h="24px" bg="#26292d" borderRadius="md" borderWidth="1px" borderColor="whiteAlpha.100" flexShrink={0} maxW="100%">
      {profile?.tier ? <TierDie tier={profile.tier} size={12} /> : <Box w="5px" h="5px" borderRadius="full" bg="whiteAlpha.300" flexShrink={0} />}
      <Text
        fontSize="xs"
        color={entry.adversaryId ? 'white' : 'whiteAlpha.500'}
        noOfLines={1}
        maxW="160px"
        cursor={entry.adversaryId ? 'pointer' : 'default'}
        onClick={entry.adversaryId ? statDrawer.onOpen : undefined}
        _hover={entry.adversaryId ? { textDecoration: 'underline' } : undefined}
        title={entry.adversaryId ? 'View stat block' : undefined}
      >
        {entry.name || 'Unnamed'}
      </Text>
      {entry.adversaryId && (
        <AddToSceneButton ariaLabel={`Add ${entry.name}`} question={`Add ${entry.name || profile?.sourceName || 'this NPC'} to the scene?`} onConfirm={add} />
      )}
      {entry.adversaryId && (
        <Drawer isOpen={statDrawer.isOpen} onClose={statDrawer.onClose} placement="right" size="md">
          <DrawerOverlay />
          <DrawerContent bg="#191A1C" color="whiteAlpha.900">
            <DrawerCloseButton />
            <DrawerHeader fontSize="sm" color="whiteAlpha.600" fontWeight="medium" borderBottomWidth="1px" borderColor="whiteAlpha.150">
              {entry.name}
              {renamed && profile?.sourceName ? ` · ${profile.sourceName}` : ''}
            </DrawerHeader>
            <DrawerBody p={0} overflowY="auto">
              {statDrawer.isOpen && (
                <SpotlightDetailPane detail={getDetail('adversary', entry.adversaryId)} detailLoading={false} />
              )}
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </HStack>
  );
};

/* ───────────────────────── squad card ───────────────────────── */

const RosterGroupCard: React.FC<{
  group: RosterGroup;
  members: RosterEntry[];
  groups: RosterGroup[];
  autoFocus?: boolean;
}> = ({ group, members, groups, autoFocus }) => {
  const updateRosterGroup = useUserContentStore((s) => s.updateRosterGroup);
  const removeRosterGroup = useUserContentStore((s) => s.removeRosterGroup);
  const collapsed = usePrepUiStore((s) => s.collapsed[`rgroup:${group.id}`]);
  const setSection = usePrepUiStore((s) => s.setSection);
  const toast = useToast();
  const open = collapsed === undefined ? true : !collapsed;
  const [editingName, setEditingName] = useState(!!autoFocus);
  const [confirmDis, setConfirmDis] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const droppable = members.filter((m) => m.adversaryId);

  const dropAll = () => {
    let n = 0;
    droppable.forEach((m) => {
      if (addNpcToEncounter({ name: m.name, adversaryId: m.adversaryId })) n += 1;
    });
    toast({
      title: n > 0 ? `Dropped ${n} into scene` : 'Nothing to drop',
      description: n > 0 ? group.name || 'Squad' : 'No linked NPCs in this squad',
      status: n > 0 ? 'success' : 'warning',
      duration: 1800,
      isClosable: true,
    });
  };

  // Shared ⋮ actions — identical whether the squad shows as a collapsed chip or
  // an expanded card. Rename also expands, so it works straight from the chip.
  const squadMenu = (
    <Menu isLazy placement="bottom-end" onClose={() => setConfirmDis(false)}>
      <MenuButton as={IconButton} aria-label="Squad actions" icon={<FiMoreVertical />} size="xs" h="18px" minW="18px" variant="ghost" color="whiteAlpha.600" _hover={{ color: 'white', bg: 'whiteAlpha.100' }} />
      <Portal>
        <MenuList bg="#16181c" borderColor="whiteAlpha.200" color="whiteAlpha.900" minW="200px" py={1} zIndex={1500}>
          {droppable.length > 0 && (
            <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<AddIcon boxSize="9px" color="#7fcaa1" />} onClick={dropAll}>
              Drop whole squad into scene
            </MenuItem>
          )}
          <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" onClick={() => { setSection(`rgroup:${group.id}`, true); setEditingName(true); }}>
            Rename squad…
          </MenuItem>
          <MenuDivider borderColor="whiteAlpha.150" />
          {confirmDis ? (
            <MenuItem closeOnSelect bg="rgba(176,48,48,0.22)" _hover={{ bg: 'rgba(176,48,48,0.32)' }} color="#e8a0a0" fontSize="xs" fontWeight="semibold" onClick={() => removeRosterGroup(group.id)}>
              Click again to disband (NPCs kept)
            </MenuItem>
          ) : (
            <MenuItem closeOnSelect={false} bg="#16181c" _hover={{ bg: 'rgba(176,48,48,0.18)' }} color="#e08080" fontSize="xs" onClick={() => setConfirmDis(true)}>
              Disband squad…
            </MenuItem>
          )}
        </MenuList>
      </Portal>
    </Menu>
  );

  // Two grid items: a fixed half-width HEADER cell (the chip) and, when expanded,
  // a full-width MEMBERS cell. With `grid-auto-flow: dense` on the container the
  // members drop in on the row BELOW the headers — the other chips keep their
  // cells, so expanding never reflows them.
  return (
    <Box bg="#202327" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="md">
      {/* Header — full-width bar; the whole bar toggles collapse. */}
      <HStack
        px={1.5}
        py="3px"
        spacing={1}
        h="26px"
        align="center"
        role="group"
        cursor="pointer"
        borderTopRadius="md"
        borderBottomRadius={open ? 0 : 'md'}
        _hover={{ bg: 'whiteAlpha.50' }}
        onClick={() => setSection(`rgroup:${group.id}`, !open)}
      >
        {open ? (
          <ChevronDownIcon color="whiteAlpha.500" boxSize="13px" flexShrink={0} />
        ) : (
          <ChevronRightIcon color="whiteAlpha.500" boxSize="13px" flexShrink={0} />
        )}
        <Box color="whiteAlpha.500" flexShrink={0}>
          <FiUsers size={11} />
        </Box>
        {open && editingName ? (
          <Input
            autoFocus
            value={group.name}
            onChange={(e) => updateRosterGroup(group.id, { name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Squad name…"
            size="xs" variant="unstyled" color="white" fontSize="xs" fontWeight="semibold" h="18px" flex="1" minW={0}
          />
        ) : (
          <Text color="white" fontSize="xs" fontWeight="semibold" noOfLines={1} flexShrink={1} minW={0}>
            {group.name || <Box as="span" color="whiteAlpha.400">Squad</Box>}
          </Text>
        )}
        <Badge bg="whiteAlpha.150" color="whiteAlpha.700" fontSize="9px" px={1} py={0} borderRadius="sm" lineHeight="1.4" flexShrink={0}>
          {members.length}
        </Badge>
        <Box flex="1" minW={0} />
        {/* When open, the view switch lives inline in the header bar. */}
        {open && (
          <HStack spacing="1px" bg="whiteAlpha.100" borderRadius="md" p="1px" flexShrink={0} onClick={(e) => e.stopPropagation()}>
            <IconButton aria-label="Full members view" icon={<FiList size={11} />} size="xs" h="16px" minW="20px" variant="ghost" color={!group.compact ? 'white' : 'whiteAlpha.400'} bg={!group.compact ? 'whiteAlpha.200' : 'transparent'} _hover={{ color: 'white', bg: !group.compact ? 'whiteAlpha.200' : 'whiteAlpha.100' }} onClick={() => updateRosterGroup(group.id, { compact: false })} />
            <IconButton aria-label="Drop-in cards view" icon={<FiGrid size={10} />} size="xs" h="16px" minW="20px" variant="ghost" color={group.compact ? 'white' : 'whiteAlpha.400'} bg={group.compact ? 'whiteAlpha.200' : 'transparent'} _hover={{ color: 'white', bg: group.compact ? 'whiteAlpha.200' : 'whiteAlpha.100' }} onClick={() => updateRosterGroup(group.id, { compact: true })} />
          </HStack>
        )}
        <Box
          flexShrink={0}
          opacity={0}
          pointerEvents="none"
          _groupHover={{ opacity: 1, pointerEvents: 'auto' }}
          transition="opacity 120ms"
          onClick={(e) => e.stopPropagation()}
        >
          {squadMenu}
        </Box>
      </HStack>

      {/* Members — directly below the header in the same card (connected). Any
          number of squads can be open; each just pushes the ones below down. */}
      {open && (
        <Box borderTopWidth="1px" borderColor="whiteAlpha.100" px={1} pt={1} pb={1} sx={{ animation: `${fadeIn} 150ms ease` }}>
          {members.length > 0 ? (
            group.compact ? (
              /* Drop-in: tight name+add chips that wrap — several per line. */
              <Box display="flex" flexWrap="wrap" gap="5px" px={0.5} pb={0.5}>
                {members.map((m) => <CompactMemberCard key={m.id} entry={m} />)}
              </Box>
            ) : (
              /* Full reference rows. */
              <Box px={0.5} pb={0.5}>
                <RosterColumns entries={members} groups={groups} />
              </Box>
            )
          ) : !addingMember ? (
            <Text color="whiteAlpha.400" fontSize="2xs" fontStyle="italic" px={1.5} pb={1}>
              Empty squad — add below, or move NPCs in from a row's ⋯ menu.
            </Text>
          ) : null}

          {addingMember ? (
            <Box px={0.5} pt={1}>
              <RosterAddBar groupId={group.id} placeholder="Add to this squad…" compact />
            </Box>
          ) : (
            <HStack px={1} pt={1} align="center" spacing={1}>
              <Text onClick={() => setAddingMember(true)} cursor="pointer" fontSize="2xs" color="whiteAlpha.400" _hover={{ color: 'whiteAlpha.700' }}>
                + add to squad
              </Text>
              <Box flex="1" minW={0} />
              {droppable.length > 0 && (
                <AddToSceneButton
                  triggerLabel={`Drop all (${droppable.length})`}
                  question={`Drop all ${droppable.length} statted member${droppable.length > 1 ? 's' : ''} into the scene?`}
                  onConfirm={dropAll}
                />
              )}
            </HStack>
          )}
        </Box>
      )}
    </Box>
  );
};

/* ───────────────────────── panel ───────────────────────── */

/**
 * RosterEditor — the GM's "tonight's bench": whoever they expect to need this
 * session, mixed freely (bare stat block / one-off civilian with a quirk /
 * recurring cast). One adaptive row scales from name-only up to a fully statted,
 * droppable adversary; entries can be renamed, linked/unlinked to a stat block,
 * counted (×N for same-block squads), and bundled into named squads that drop a
 * whole scene's cast in at once.
 */
const RosterEditor: React.FC = () => {
  const roster = useUserContentStore((s) => s.roster);
  const rosterGroups = useUserContentStore((s) => s.rosterGroups);
  const rosterAddOpen = usePrepUiStore((s) => s.rosterAddOpen);
  const setRosterAddOpen = usePrepUiStore((s) => s.setRosterAddOpen);
  const rosterFocusGroupId = usePrepUiStore((s) => s.rosterFocusGroupId);
  const setRosterFocusGroupId = usePrepUiStore((s) => s.setRosterFocusGroupId);

  const groupIds = useMemo(() => new Set(rosterGroups.map((g) => g.id)), [rosterGroups]);
  // Top list = pinned (incl. grouped — they MIRROR here, pin-marked) first, then
  // standalone (ungrouped) NPCs. Squads keep their full membership below.
  const pinned = roster.filter((r) => r.pinned);
  const standalone = roster.filter((r) => !r.pinned && (!r.groupId || !groupIds.has(r.groupId)));
  const topList = [...pinned, ...standalone];
  const membersOf = (id: string) => roster.filter((r) => r.groupId === id);

  // The "Squad" header button creates the group + asks us to auto-focus its name
  // for renaming; consume that one-shot request so it can't refire on re-render.
  useEffect(() => {
    if (!rosterFocusGroupId) return;
    const t = setTimeout(() => setRosterFocusGroupId(null), 150);
    return () => clearTimeout(t);
  }, [rosterFocusGroupId, setRosterFocusGroupId]);

  const empty = roster.length === 0 && rosterGroups.length === 0;

  return (
    <VStack align="stretch" spacing={2}>
      {/* The add-NPC input opens from the "Add NPC" header button. It stays open +
          focused across several adds, and closes on Esc or clicking away empty. */}
      {rosterAddOpen && <RosterAddBar autoFocus onClose={() => setRosterAddOpen(false)} />}

      {empty ? (
        !rosterAddOpen && (
          <Box bg="#26292d" borderWidth="1px" borderStyle="dashed" borderColor="whiteAlpha.200" borderRadius="md" px={2} py={1.5}>
            <Text color="whiteAlpha.500" fontSize="2xs" fontStyle="italic">
              No one on the bench yet. Use “Add NPC” above — statted or not — or “Squad” to start a scene's group.
            </Text>
          </Box>
        )
      ) : (
        <VStack align="stretch" spacing={1.5}>
          {/* Standalone + pinned, two columns. Pinned (incl. grouped) sit first,
              marked with a corner pin; grouped ones also remain in their squad. */}
          {/* Relative + z so an expanded note here overlays the squads below it
              (otherwise the later squad section paints over the note overlay). */}
          {topList.length > 0 && (
            <Box position="relative" zIndex={1}>
              <RosterColumns entries={topList} groups={rosterGroups} />
            </Box>
          )}
          {/* Groups as a full-width vertical accordion — any number can be open at
              once (each just pushes the ones below down), and members sit directly
              under their header so they read as one connected card. */}
          {rosterGroups.length > 0 && (
            <VStack align="stretch" spacing="6px">
              {rosterGroups.map((g) => (
                <RosterGroupCard
                  key={g.id}
                  group={g}
                  members={membersOf(g.id)}
                  groups={rosterGroups}
                  autoFocus={g.id === rosterFocusGroupId}
                />
              ))}
            </VStack>
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default RosterEditor;
