import React, { useState } from 'react';
import {
  Badge,
  Box,
  HStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  Tooltip,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import { FiLink, FiEye } from 'react-icons/fi';
import type { NpcRef } from '@/data/encounterTemplates';
import AdversaryPicker from './AdversaryPicker';
import { addNpcToEncounter } from './addNpc';
import { getDetail } from '@/data/spotlightIndex';

/** Best-effort compact statline for a linked profile. Field shapes vary across
 * the index, so read defensively and show only what resolves. */
const StatView: React.FC<{ adversaryId: string }> = ({ adversaryId }) => {
  const d = getDetail('adversary', adversaryId) as any;
  if (!d) return <Text fontSize="xs" color="whiteAlpha.600">Profile not found.</Text>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = d[k] ?? d.stats?.[k];
      if (v != null && v !== '') return v;
    }
    return undefined;
  };
  const rows: [string, any][] = [
    ['Type', pick('adversaryType', 'type')],
    ['Soak', pick('soak')],
    ['Wounds', pick('woundThreshold', 'wounds')],
    ['Strain', pick('strainThreshold', 'strain')],
    ['Defence', `${pick('meleeDefense') ?? 0}/${pick('rangedDefense') ?? 0}`],
  ].filter(([, v]) => v != null && v !== 'undefined');
  return (
    <VStack align="stretch" spacing={0.5}>
      <Text fontSize="xs" fontWeight="bold" color="white">{d.name ?? 'Profile'}</Text>
      {rows.map(([k, v]) => (
        <HStack key={k} justify="space-between">
          <Text fontSize="2xs" color="whiteAlpha.500">{k}</Text>
          <Text fontSize="2xs" color="whiteAlpha.900">{String(v)}</Text>
        </HStack>
      ))}
    </VStack>
  );
};

interface Props {
  npc: NpcRef;
  onChange: (patch: Partial<NpcRef>) => void;
  onRemove: () => void;
  onSendToRoster: () => void;
}

const EncounterNpcRow: React.FC<Props> = ({ npc, onChange, onRemove, onSendToRoster }) => {
  const [linking, setLinking] = useState(false);
  const toast = useToast();
  const linked = !!npc.adversaryId;

  const dropIn = () => {
    const res = addNpcToEncounter(npc);
    toast({
      title: res ? 'Added to encounter' : 'No linked profile',
      description: res?.summary,
      status: res ? 'success' : 'warning',
      duration: 1800,
      isClosable: true,
    });
  };

  return (
    <Box bg="#1f2225" borderWidth="1px" borderColor="whiteAlpha.150" borderRadius="md" p={1.5}>
      <HStack spacing={1.5} align="center">
        <Input
          value={npc.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="NPC name"
          size="xs"
          variant="flushed"
          flex="2"
          color="whiteAlpha.900"
        />
        <Input
          value={npc.descriptor ?? ''}
          onChange={(e) => onChange({ descriptor: e.target.value })}
          placeholder="descriptor"
          size="xs"
          variant="flushed"
          flex="3"
          color="whiteAlpha.600"
        />
        <NumberInput
          size="xs"
          min={1}
          max={20}
          value={npc.count ?? 1}
          onChange={(_, v) => onChange({ count: Number.isNaN(v) ? 1 : v })}
          w="44px"
        >
          <NumberInputField px={1} bg="#16181c" borderColor="whiteAlpha.200" />
        </NumberInput>
        <IconButton
          aria-label="Remove NPC"
          icon={<CloseIcon boxSize="7px" />}
          size="xs"
          variant="ghost"
          color="whiteAlpha.400"
          _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
          onClick={onRemove}
        />
      </HStack>

      {/* The improv handle — surfaces on the play-surface cast rows. */}
      <Input
        value={npc.want ?? ''}
        onChange={(e) => onChange({ want: e.target.value || undefined })}
        placeholder="▸ want — what they're after"
        size="xs"
        variant="flushed"
        color="#b7c6a8"
        _placeholder={{ color: 'whiteAlpha.300' }}
      />

      <HStack spacing={2} mt={1} fontSize="2xs">
        {linked ? (
          <>
            <Badge bg="rgba(127,202,161,0.18)" color="#7fcaa1" fontSize="9px" px={1.5} borderRadius="sm">
              Linked
            </Badge>
            <Popover placement="bottom-start" isLazy>
              <PopoverTrigger>
                <IconButton
                  aria-label="View profile"
                  icon={<FiEye />}
                  size="xs"
                  h="18px"
                  minW="18px"
                  variant="ghost"
                  color="whiteAlpha.600"
                  _hover={{ color: 'white' }}
                />
              </PopoverTrigger>
              <PopoverContent bg="#16181c" borderColor="whiteAlpha.200" w="190px">
                <PopoverArrow bg="#16181c" />
                <PopoverBody>
                  <StatView adversaryId={npc.adversaryId!} />
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Tooltip label="Add to encounter" placement="top" hasArrow openDelay={300}>
              <IconButton
                aria-label="Add to encounter"
                icon={<AddIcon boxSize="8px" />}
                size="xs"
                h="18px"
                minW="18px"
                variant="ghost"
                color="#7fcaa1"
                _hover={{ bg: 'rgba(127,202,161,0.16)', color: '#a8e0bf' }}
                onClick={dropIn}
              />
            </Tooltip>
            <Box as="button" color="whiteAlpha.500" _hover={{ color: 'whiteAlpha.700' }} onClick={() => onChange({ adversaryId: undefined })}>
              unlink
            </Box>
          </>
        ) : (
          <Box
            as="button"
            color="whiteAlpha.600"
            _hover={{ color: 'whiteAlpha.900' }}
            display="inline-flex"
            alignItems="center"
            gap="3px"
            onClick={() => setLinking((v) => !v)}
          >
            <FiLink /> link profile
          </Box>
        )}
        <Box flex="1" />
        <Box as="button" color="whiteAlpha.500" _hover={{ color: 'whiteAlpha.700' }} onClick={onSendToRoster}>
          → roster
        </Box>
      </HStack>

      {linking && !linked && (
        <Box mt={1}>
          <AdversaryPicker
            placeholder="Search a profile to link…"
            onPick={(p) => {
              onChange({
                adversaryId: p.id,
                name: npc.name?.trim() ? npc.name : p.name,
                descriptor: npc.descriptor ?? p.subtitle,
              });
              setLinking(false);
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default EncounterNpcRow;
