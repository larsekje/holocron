import React, { useState } from 'react';
import {
  Badge,
  Box,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Text,
  Tooltip,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { FaUser } from 'react-icons/fa';
import useUserContentStore from '@/state/userContentStore';
import AdversaryPicker from './AdversaryPicker';
import { addNpcToEncounter } from './addNpc';

const FACTION_COLOR: Record<string, string> = {
  Empire: '#5a6e80',
  Jabba: '#c8a23a',
  Rebellion: '#b03030',
  Hutt: '#c8a23a',
  Republic: '#3a7e57',
  Separatist: '#7a4fb0',
};

function factionColor(faction?: string): string {
  if (!faction) return '#6f6f6f';
  return FACTION_COLOR[faction] ?? '#5a7fb0';
}

/**
 * RosterEditor — the GM's editable "tonight's roster". Replaces the old
 * read-only sample list. Add NPCs from Spotlight (linked, one-click droppable
 * into the encounter) or freeform by name; jot an inline note; remove when
 * done. Persisted via userContentStore.
 */
const RosterEditor: React.FC = () => {
  const roster = useUserContentStore((s) => s.roster);
  const addRosterEntry = useUserContentStore((s) => s.addRosterEntry);
  const updateRosterEntry = useUserContentStore((s) => s.updateRosterEntry);
  const removeRosterEntry = useUserContentStore((s) => s.removeRosterEntry);
  const [freeform, setFreeform] = useState('');
  const toast = useToast();

  const addFreeform = () => {
    const name = freeform.trim();
    if (!name) return;
    addRosterEntry({ name });
    setFreeform('');
  };

  const dropIn = (entry: { name: string; adversaryId?: string; count?: number }) => {
    const res = addNpcToEncounter(entry);
    toast({
      title: res ? 'Added to encounter' : 'No linked profile',
      description: res?.summary,
      status: res ? 'success' : 'warning',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <VStack align="stretch" spacing={2}>
      <AdversaryPicker
        placeholder="Add from Spotlight — search adversaries…"
        onPick={(pick) =>
          addRosterEntry({ name: pick.name, note: pick.subtitle, adversaryId: pick.id, count: 1 })
        }
      />
      <HStack spacing={1.5}>
        <Input
          value={freeform}
          onChange={(e) => setFreeform(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addFreeform();
          }}
          placeholder="…or add a name"
          size="sm"
          bg="#1f2225"
          borderColor="whiteAlpha.200"
          color="whiteAlpha.900"
          fontSize="xs"
          _placeholder={{ color: 'whiteAlpha.400' }}
        />
        <IconButton
          aria-label="Add NPC"
          icon={<AddIcon boxSize="9px" />}
          size="sm"
          variant="outline"
          borderColor="whiteAlpha.200"
          color="whiteAlpha.700"
          onClick={addFreeform}
        />
      </HStack>

      {roster.length === 0 ? (
        <Box
          bg="#26292d"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="whiteAlpha.200"
          borderRadius="md"
          px={2}
          py={1.5}
        >
          <Text color="whiteAlpha.500" fontSize="2xs" fontStyle="italic">
            No NPCs queued yet. Add the cast you expect to need tonight.
          </Text>
        </Box>
      ) : (
        <SimpleGrid minChildWidth="150px" spacing={1.5}>
          {roster.map((r) => {
            const accent = factionColor(r.faction);
            return (
              <Box
                key={r.id}
                bg="#26292d"
                borderWidth="1px"
                borderColor="whiteAlpha.150"
                borderRadius="md"
                borderLeftWidth="3px"
                borderLeftColor={accent}
                _hover={{ borderColor: 'whiteAlpha.300', borderLeftColor: accent }}
                transition="border-color 120ms"
                px={2}
                py={1.5}
              >
                <HStack spacing={1.5} align="start" minW={0} mb={0.5}>
                  <Box color={accent} fontSize="10px" flexShrink={0} display="inline-flex" mt="2px">
                    <FaUser />
                  </Box>
                  <Text
                    color="white"
                    fontWeight="semibold"
                    fontSize="xs"
                    lineHeight="1.25"
                    noOfLines={2}
                    flex="1"
                    minW={0}
                  >
                    {r.name}
                  </Text>
                  {r.adversaryId && (
                    <Tooltip label="Add to encounter" placement="top" hasArrow openDelay={300} bg="#1a1c1e">
                      <IconButton
                        aria-label={`Add ${r.name} to encounter`}
                        icon={<AddIcon boxSize="8px" />}
                        size="xs"
                        h="16px"
                        minW="16px"
                        variant="ghost"
                        color="#7fcaa1"
                        _hover={{ bg: 'rgba(127,202,161,0.16)', color: '#a8e0bf' }}
                        onClick={() => dropIn(r)}
                      />
                    </Tooltip>
                  )}
                  <IconButton
                    aria-label={`Remove ${r.name}`}
                    icon={<CloseIcon boxSize="7px" />}
                    size="xs"
                    h="16px"
                    minW="16px"
                    variant="ghost"
                    color="whiteAlpha.400"
                    _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
                    onClick={() => removeRosterEntry(r.id)}
                  />
                </HStack>
                {r.adversaryId && (
                  <Badge
                    bg="rgba(127,202,161,0.18)"
                    color="#7fcaa1"
                    fontSize="9px"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                    px={1}
                    py={0}
                    borderRadius="sm"
                    lineHeight="1.3"
                    mb={1}
                  >
                    Linked
                  </Badge>
                )}
                <Input
                  value={r.note ?? ''}
                  onChange={(e) => updateRosterEntry(r.id, { note: e.target.value })}
                  placeholder="note…"
                  size="xs"
                  variant="unstyled"
                  color="whiteAlpha.700"
                  fontSize="2xs"
                  lineHeight="1.35"
                  _placeholder={{ color: 'whiteAlpha.400' }}
                />
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </VStack>
  );
};

export default RosterEditor;
