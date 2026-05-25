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
  MenuItem,
  MenuList,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FaPlay } from 'react-icons/fa';
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
 * Inline-editable encounter card. Collapsed: icon + title + first-paragraph
 * hook. Expanded: edit everything in place (title, icon, tags, free body, NPC
 * blocks, roll tables) with autosave — no modal. A brand-new card that's left
 * empty is discarded when collapsed.
 */
const EncounterCardInline: React.FC<Props> = ({ encounter, autoFocus }) => {
  const updateEncounter = useUserContentStore((s) => s.updateEncounter);
  const removeEncounter = useUserContentStore((s) => s.removeEncounter);
  const roster = useUserContentStore((s) => s.roster);
  const addRosterEntry = useUserContentStore((s) => s.addRosterEntry);
  const startFromTemplate = useSessionPrepStore((s) => s.startFromTemplate);
  const activeFromThis = useSessionPrepStore((s) => s.activeScene?.fromTemplateId === encounter.id);
  const toast = useToast();
  const [open, setOpen] = useState(!!autoFocus);

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
    addRosterEntry({ name: n.name || 'NPC', note: n.descriptor, adversaryId: n.adversaryId, count: n.count });
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
      bg="#26292d"
      borderWidth="1px"
      borderColor={open ? color : 'whiteAlpha.150'}
      borderLeftWidth="3px"
      borderLeftColor={color}
      borderRadius="md"
      transition="border-color 120ms"
    >
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
          {encounter.title || 'Untitled encounter'}
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
              placeholder="Encounter title"
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
                      onClick={() => addNpc({ name: r.name, descriptor: r.note, adversaryId: r.adversaryId, count: r.count })}
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

          {/* Footer */}
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
            <Box flex="1" />
            <Button
              size="xs"
              variant="ghost"
              color="whiteAlpha.500"
              _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
              onClick={() => removeEncounter(encounter.id)}
            >
              Delete
            </Button>
          </HStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default EncounterCardInline;
