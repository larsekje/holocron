import React, { useState } from 'react';
import { Box, HStack, IconButton, Input, Text, Tooltip, VStack, useToast } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import type { NpcRef } from '@/data/encounterTemplates';
import { addNpcToEncounter } from './addNpc';
import { deriveProfile } from './rosterVisuals';
import TierDie from './TierDie';

interface Props {
  npc: NpcRef;
  /** Inline want editing writes back through this (absent = read-only row). */
  onPatch?: (patch: Partial<NpcRef>) => void;
}

/**
 * PlayCastRow — a scene-cast row on the play surface. Everything the GM needs
 * to run this person with zero clicks: line 1 = who they are (tier die, name,
 * descriptor), line 2 = what they want (the improv handle, in green). The want
 * is tap-to-edit in place so a motivation can be invented mid-scene. Hover
 * reveals + (drop into the encounter) for linked entries.
 */
const PlayCastRow: React.FC<Props> = ({ npc, onPatch }) => {
  const toast = useToast();
  const [editingWant, setEditingWant] = useState(false);
  const [draft, setDraft] = useState('');
  const profile = deriveProfile(npc.adversaryId);

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

  const beginEdit = () => {
    if (!onPatch) return;
    setDraft(npc.want ?? '');
    setEditingWant(true);
  };
  const commitWant = () => {
    setEditingWant(false);
    if (!onPatch) return;
    const want = draft.trim();
    if (want !== (npc.want ?? '')) onPatch({ want: want || undefined });
  };

  return (
    <HStack
      role="group"
      align="flex-start"
      spacing={2}
      px={1.5}
      py={1}
      bg="whiteAlpha.50"
      borderWidth="1px"
      borderColor="whiteAlpha.150"
      borderRadius="md"
      _hover={{ borderColor: 'whiteAlpha.300' }}
      transition="border-color 120ms"
    >
      {/* Fixed-width marker slot so names align whether or not a tier resolves. */}
      <Box w="16px" pt="1px" display="flex" justifyContent="center" flexShrink={0}>
        {profile.tier ? (
          <Tooltip label={profile.tier} placement="top" hasArrow openDelay={400} bg="#1a1c1e">
            <Box display="inline-flex"><TierDie tier={profile.tier} size={13} /></Box>
          </Tooltip>
        ) : (
          <Box w="5px" h="5px" mt="5px" borderRadius="full" bg="whiteAlpha.300" />
        )}
      </Box>

      <VStack align="stretch" spacing={0} flex="1" minW={0}>
        <HStack spacing={1.5} align="baseline" flexWrap="wrap">
          <Text color="white" fontSize="xs" fontWeight="semibold" lineHeight="1.3">
            {npc.name || 'Unnamed'}
          </Text>
          {npc.count && npc.count > 1 && (
            <Text color="whiteAlpha.600" fontSize="9px" fontWeight="bold" bg="whiteAlpha.100" px={1} borderRadius="sm">
              ×{npc.count}
            </Text>
          )}
          {npc.descriptor && (
            <Text color="whiteAlpha.500" fontSize="2xs" lineHeight="1.3" noOfLines={1} minW={0}>
              {npc.descriptor}
            </Text>
          )}
        </HStack>
        {editingWant ? (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitWant}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitWant();
              if (e.key === 'Escape') setEditingWant(false);
            }}
            placeholder="what do they want?"
            size="xs"
            variant="unstyled"
            color="#b7c6a8"
            fontSize="2xs"
            autoFocus
          />
        ) : npc.want ? (
          <HStack
            spacing={1}
            align="baseline"
            cursor={onPatch ? 'text' : undefined}
            onClick={beginEdit}
            title={onPatch ? 'Click to edit' : undefined}
          >
            <Text color="#3a7e57" fontSize="9px" flexShrink={0}>▸</Text>
            <Text color="#b7c6a8" fontSize="2xs" lineHeight="1.4">
              {npc.want}
            </Text>
          </HStack>
        ) : onPatch ? (
          <Text
            color="whiteAlpha.400"
            fontSize="2xs"
            fontStyle="italic"
            cursor="text"
            opacity={0}
            _groupHover={{ opacity: 1 }}
            transition="opacity 120ms"
            onClick={beginEdit}
          >
            ▸ add a want…
          </Text>
        ) : null}
      </VStack>

      {npc.adversaryId && (
        <Tooltip label="Add to encounter" placement="top" hasArrow openDelay={300} bg="#1a1c1e">
          <IconButton
            aria-label="Add to encounter"
            icon={<AddIcon boxSize="8px" />}
            size="xs"
            h="20px"
            minW="20px"
            variant="ghost"
            color="#7fcaa1"
            alignSelf="center"
            opacity={0}
            _groupHover={{ opacity: 1 }}
            _hover={{ bg: 'rgba(127,202,161,0.16)', color: '#a8e0bf' }}
            transition="opacity 120ms"
            onClick={dropIn}
          />
        </Tooltip>
      )}
    </HStack>
  );
};

export default PlayCastRow;
