import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Collapse,
  HStack,
  IconButton,
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
  SimpleGrid,
  Text,
  Textarea,
  Tooltip,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FaPlay } from 'react-icons/fa';
import { FiCopy, FiMoreVertical } from 'react-icons/fi';
import { nanoid } from 'nanoid';
import type { EncounterTag, EncounterTemplate, NpcEntry, NpcRef, RollTable } from '@/data/encounterTemplates';
import useUserContentStore from '@/state/userContentStore';
import useSessionPrepStore from '@/state/sessionPrepStore';
import { ALL_TAGS, ICON_CHOICES, ICON_KEYS, TAG_COLOR, resolveEncounterVisual } from './encounterVisuals';
import AdversaryPicker from './AdversaryPicker';
import EncounterNpcRow from './EncounterNpcRow';
import RollTableBlock from './RollTableBlock';

function toRefs(npcs?: NpcEntry[]): NpcRef[] {
  return (npcs ?? []).map((n) => (typeof n === 'string' ? { name: n } : n));
}

/** Collapsed-card hook = the first line of the first paragraph of the body. */
function firstParagraph(body?: string): string {
  if (!body) return '';
  const t = body.trim();
  return (t.split(/\n\s*\n/)[0] ?? t).split('\n')[0];
}

const MetaBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Badge bg="whiteAlpha.150" color="whiteAlpha.700" fontSize="9px" px={1} py={0} borderRadius="sm" lineHeight="1.3">
    {children}
  </Badge>
);

const SectionTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text fontSize="9px" color="whiteAlpha.400" letterSpacing="0.14em" textTransform="uppercase" fontWeight="bold" mt={2}>
    {children}
  </Text>
);

interface Props {
  encounter: EncounterTemplate;
  autoFocus?: boolean;
}

/**
 * Inline-editable scene card. Collapsed: icon + title + first-paragraph hook,
 * with hover actions (start / duplicate / delete). Expanded: edit everything in
 * place (title, icon, tags, free body, NPC blocks, roll tables) with autosave —
 * no modal. A brand-new card that's left empty is discarded when collapsed.
 */
const EncounterCardInline: React.FC<Props> = ({ encounter, autoFocus }) => {
  const updateEncounter = useUserContentStore((s) => s.updateEncounter);
  const duplicateEncounter = useUserContentStore((s) => s.duplicateEncounter);
  const removeEncounter = useUserContentStore((s) => s.removeEncounter);
  const roster = useUserContentStore((s) => s.roster);
  const addRosterEntry = useUserContentStore((s) => s.addRosterEntry);
  const startFromTemplate = useSessionPrepStore((s) => s.startFromTemplate);
  const activeFromThis = useSessionPrepStore((s) => s.activeScene?.fromTemplateId === encounter.id);
  const toast = useToast();
  const [open, setOpen] = useState(!!autoFocus);
  const [confirmDel, setConfirmDel] = useState(false); // two-step delete in the ⋮ menu

  const duplicate = () => {
    duplicateEncounter(encounter.id);
    toast({ title: 'Scene duplicated', description: encounter.title || undefined, status: 'success', duration: 1500, isClosable: true });
  };

  const { icon, color } = resolveEncounterVisual(encounter);
  const npcs = toRefs(encounter.npcs);
  const tables = encounter.tables ?? [];
  const tags = encounter.tags ?? [];
  const hook = firstParagraph(encounter.body) || encounter.blurb || '';
  const isEmpty =
    !encounter.title.trim() && !(encounter.body ?? '').trim() && npcs.length === 0 && tables.length === 0;

  const patch = (p: Partial<EncounterTemplate>) => updateEncounter(encounter.id, p);

  // NPC ops
  const setNpcs = (next: NpcRef[]) => patch({ npcs: next });
  const updateNpc = (i: number, p: Partial<NpcRef>) => setNpcs(npcs.map((n, idx) => (idx === i ? { ...n, ...p } : n)));
  const removeNpc = (i: number) => setNpcs(npcs.filter((_, idx) => idx !== i));
  const addNpc = (n: NpcRef) => setNpcs([...npcs, n]);
  const sendNpcToRoster = (n: NpcRef) => {
    addRosterEntry({ name: n.name || 'NPC', note: n.descriptor, adversaryId: n.adversaryId, count: n.count, want: n.want });
    toast({ title: 'Sent to roster', description: n.name, status: 'success', duration: 1500, isClosable: true });
  };

  // Roll-table ops
  const setTables = (next: RollTable[]) => patch({ tables: next });
  const addTable = () =>
    setTables([...tables, { id: nanoid(6), title: '', die: 'd6', rows: [{ id: nanoid(6), key: '1', text: '' }] }]);
  const updateTable = (t: RollTable) => setTables(tables.map((x) => (x.id === t.id ? t : x)));
  const removeTable = (id: string) => setTables(tables.filter((x) => x.id !== id));

  const toggleTag = (tag: EncounterTag) =>
    patch({ tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag] });

  const collapse = () => {
    setOpen(false);
    if (isEmpty) removeEncounter(encounter.id); // discard an untouched new card
  };

  return (
    <Box
      role="group"
      position="relative"
      bg="#26292d"
      borderWidth="1px"
      borderColor={open ? color : 'whiteAlpha.150'}
      borderLeftWidth="3px"
      borderLeftColor={color}
      borderRadius="md"
      transition="border-color 120ms"
    >
      {/* Floated actions — the frequent "start scene" stays a direct button;
          duplicate + delete live in the ⋮ menu. Revealed on hover over a plate
          so it reserves no row width (covers the right-side badges/chevron). */}
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
        bg="#26292d"
        borderRadius="md"
        boxShadow="0 0 5px 4px #26292d"
      >
        {!activeFromThis && (
          <Tooltip label="Start scene" placement="top" hasArrow openDelay={300} bg="#1a1c1e">
            <IconButton
              aria-label="Start scene"
              icon={<FaPlay size={9} />}
              size="xs" h="20px" minW="20px" variant="ghost"
              color="#7fb0ca"
              _hover={{ color: '#a8d0e0', bg: 'whiteAlpha.100' }}
              onClick={(e) => { e.stopPropagation(); startFromTemplate(encounter); }}
            />
          </Tooltip>
        )}
        <Menu isLazy placement="bottom-end" onClose={() => setConfirmDel(false)}>
          <MenuButton
            as={IconButton}
            aria-label="Scene actions"
            icon={<FiMoreVertical />}
            size="xs" h="20px" minW="20px"
            variant="ghost" color="whiteAlpha.700"
            _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
            _active={{ bg: 'whiteAlpha.100' }}
            onClick={(e) => e.stopPropagation()}
          />
          <Portal>
            <MenuList bg="#16181c" borderColor="whiteAlpha.200" color="whiteAlpha.900" minW="180px" py={1} zIndex={1500}>
              <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FaPlay size={10} />} isDisabled={activeFromThis} onClick={() => startFromTemplate(encounter)}>
                {activeFromThis ? 'Already active' : 'Start scene'}
              </MenuItem>
              <MenuItem bg="#16181c" _hover={{ bg: 'whiteAlpha.100' }} fontSize="xs" icon={<FiCopy />} onClick={duplicate}>
                Duplicate
              </MenuItem>
              <MenuDivider borderColor="whiteAlpha.150" />
              {/* Two-step delete — never one-click. */}
              {confirmDel ? (
                <MenuItem closeOnSelect bg="rgba(176,48,48,0.22)" _hover={{ bg: 'rgba(176,48,48,0.32)' }} color="#e8a0a0" fontSize="xs" fontWeight="semibold" onClick={() => removeEncounter(encounter.id)}>
                  Click again to delete
                </MenuItem>
              ) : (
                <MenuItem closeOnSelect={false} bg="#16181c" _hover={{ bg: 'rgba(176,48,48,0.18)' }} color="#e08080" fontSize="xs" onClick={() => setConfirmDel(true)}>
                  Delete scene…
                </MenuItem>
              )}
            </MenuList>
          </Portal>
        </Menu>
      </HStack>

      {/* Header — click to expand/collapse */}
      <HStack
        px={1.5}
        py={1}
        spacing={1.5}
        cursor="pointer"
        onClick={() => (open ? collapse() : setOpen(true))}
        _hover={{ bg: 'whiteAlpha.50' }}
        role="button"
      >
        <Box color={color} fontSize="14px" display="inline-flex" flexShrink={0}>
          {icon}
        </Box>
        <Text color="white" fontSize="xs" fontWeight="medium" noOfLines={1} flexShrink={0} maxW={open ? '100%' : '45%'}>
          {encounter.title || 'Untitled scene'}
        </Text>
        {!open && hook && (
          <Text color="whiteAlpha.500" fontSize="2xs" noOfLines={1} flex="1">
            {hook}
          </Text>
        )}
        <Box flex={open ? '1' : '0 0 auto'} />
        {activeFromThis && (
          <Badge bg="#3a7e57" color="white" fontSize="9px" textTransform="uppercase" px={1} py={0} borderRadius="sm" lineHeight="1.3">
            Live
          </Badge>
        )}
        {!open && npcs.length > 0 && <MetaBadge>{npcs.length}N</MetaBadge>}
        {!open && tables.length > 0 && <MetaBadge>{tables.length}T</MetaBadge>}
        {open ? <ChevronUpIcon color="whiteAlpha.500" /> : <ChevronDownIcon color="whiteAlpha.500" />}
      </HStack>

      <Collapse in={open} animateOpacity>
        <Box px={2} pb={2} pt={0.5} onClick={(e) => e.stopPropagation()}>
          {/* Title + icon picker */}
          <HStack spacing={1.5}>
            <Popover placement="bottom-start" isLazy>
              <PopoverTrigger>
                <IconButton aria-label="Pick icon" size="xs" variant="ghost" color={color} icon={<Box fontSize="16px">{icon}</Box>} />
              </PopoverTrigger>
              <PopoverContent bg="#16181c" borderColor="whiteAlpha.200" w="auto">
                <PopoverArrow bg="#16181c" />
                <PopoverBody>
                  <SimpleGrid columns={6} spacing={1}>
                    {ICON_KEYS.map((k) => (
                      <IconButton
                        key={k}
                        aria-label={k}
                        size="sm"
                        variant={encounter.icon === k ? 'solid' : 'ghost'}
                        colorScheme={encounter.icon === k ? 'orange' : 'gray'}
                        icon={<Box fontSize="16px">{ICON_CHOICES[k]}</Box>}
                        onClick={() => patch({ icon: k })}
                      />
                    ))}
                  </SimpleGrid>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Input
              value={encounter.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Scene title"
              size="sm"
              variant="flushed"
              fontWeight="semibold"
              color="white"
              autoFocus={autoFocus}
            />
          </HStack>

          {/* Tags */}
          <HStack mt={1.5} flexWrap="wrap" spacing={1}>
            {ALL_TAGS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <Badge
                  key={tag}
                  as="button"
                  onClick={() => toggleTag(tag)}
                  bg={on ? TAG_COLOR[tag] : 'whiteAlpha.100'}
                  color={on ? 'white' : 'whiteAlpha.600'}
                  fontSize="9px"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  px={1.5}
                  py={0.5}
                  borderRadius="sm"
                  cursor="pointer"
                >
                  {tag}
                </Badge>
              );
            })}
          </HStack>

          {/* Body */}
          <Textarea
            mt={2}
            value={encounter.body ?? ''}
            onChange={(e) => patch({ body: e.target.value })}
            placeholder="Describe the scene… (the first line shows as the hook)"
            size="sm"
            minH="72px"
            bg="#1f2225"
            borderColor="whiteAlpha.200"
            color="whiteAlpha.900"
            fontSize="xs"
            lineHeight="1.45"
            resize="vertical"
            _placeholder={{ color: 'whiteAlpha.400' }}
            _focus={{ borderColor: 'whiteAlpha.400', boxShadow: 'none' }}
          />

          {/* NPCs */}
          {npcs.length > 0 && <SectionTag>NPCs</SectionTag>}
          <VStack align="stretch" spacing={1} mt={1}>
            {npcs.map((n, i) => (
              <EncounterNpcRow
                key={i}
                npc={n}
                onChange={(p) => updateNpc(i, p)}
                onRemove={() => removeNpc(i)}
                onSendToRoster={() => sendNpcToRoster(n)}
              />
            ))}
          </VStack>
          <HStack mt={1} spacing={1}>
            <Button size="xs" variant="ghost" color="whiteAlpha.600" leftIcon={<AddIcon boxSize="7px" />} onClick={() => addNpc({ name: '' })}>
              NPC
            </Button>
            {roster.length > 0 && (
              <Menu isLazy>
                <MenuButton as={Button} size="xs" variant="ghost" color="whiteAlpha.600" rightIcon={<ChevronDownIcon />}>
                  from roster
                </MenuButton>
                <MenuList bg="#16181c" borderColor="whiteAlpha.200" maxH="220px" overflowY="auto">
                  {roster.map((r) => (
                    <MenuItem
                      key={r.id}
                      bg="#16181c"
                      _hover={{ bg: 'whiteAlpha.100' }}
                      fontSize="xs"
                      onClick={() => addNpc({ name: r.name, descriptor: r.note, adversaryId: r.adversaryId, count: r.count, want: r.want })}
                    >
                      {r.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            )}
          </HStack>
          <Box mt={1}>
            <AdversaryPicker
              placeholder="+ NPC from Spotlight…"
              onPick={(p) => addNpc({ name: p.name, descriptor: p.subtitle, adversaryId: p.id, count: 1 })}
            />
          </Box>

          {/* Roll tables */}
          {tables.length > 0 && <SectionTag>Roll tables</SectionTag>}
          <VStack align="stretch" spacing={1.5} mt={1}>
            {tables.map((t) => (
              <RollTableBlock key={t.id} table={t} editable onChange={updateTable} onRemove={() => removeTable(t.id)} />
            ))}
          </VStack>
          <Button mt={1} size="xs" variant="ghost" color="whiteAlpha.600" leftIcon={<AddIcon boxSize="7px" />} onClick={addTable}>
            Roll table
          </Button>

          {/* Footer — Start is the primary action; duplicate/delete live in the
              card's ⋮ menu (delete is two-step there). */}
          <HStack mt={2} spacing={1.5}>
            <Button
              size="xs"
              colorScheme={activeFromThis ? 'green' : 'blue'}
              isDisabled={activeFromThis}
              leftIcon={<FaPlay size={9} />}
              onClick={() => startFromTemplate(encounter)}
            >
              {activeFromThis ? 'Active' : 'Start scene'}
            </Button>
          </HStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default EncounterCardInline;
