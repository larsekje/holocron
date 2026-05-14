import React from 'react';
import { Badge, Box, HStack, IconButton, Text, Tooltip, VStack, useToast } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { FaUser } from 'react-icons/fa';
import type { NpcEntry, NpcRef } from '@/data/encounterTemplates';
import { getDetail } from '@/data/spotlightIndex';
import adversaryService from '@/services/adversaryService';
import useParticipantStore from '@/state/participantsStore';

/**
 * Normalise an NpcEntry to NpcRef. Plain strings get parsed for a trailing
 * "(descriptor)" — the conservative match (last paren group) leaves names
 * with embedded parens intact.
 */
function normaliseNpc(entry: NpcEntry): NpcRef {
  if (typeof entry !== 'string') return entry;
  const m = entry.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (m && m[1].trim().length > 0) {
    return { name: m[1].trim(), descriptor: m[2].trim() };
  }
  return { name: entry.trim() };
}

interface Props {
  npcs: NpcEntry[];
}

const NPCList: React.FC<Props> = ({ npcs }) => {
  const addParticipant = useParticipantStore((s) => s.addParticipant);
  const toast = useToast();

  const handleAdd = (npc: NpcRef) => {
    if (!npc.adversaryId) return;
    const detail = getDetail('adversary', npc.adversaryId) as any;
    if (!detail) {
      toast({
        title: 'Profile not found',
        description: `No spotlight entry for ${npc.adversaryId}`,
        status: 'error',
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const isMinion = (detail.adversaryType ?? detail.type) === 'Minion';
    const times = isMinion ? 1 : Math.max(1, npc.count ?? 1);

    for (let i = 0; i < times; i++) {
      const p = adversaryService.convertToParticipant(detail);
      // Minion-group size override: stormtrooper patrols default to 4;
      // this respects the template's authored squad size.
      if (isMinion && npc.count && p.stats) {
        p.stats.minions = npc.count;
      }
      // Multiple rivals/nemeses: tag with a numeric suffix so the GM can
      // tell "TIE Pilot 1" from "TIE Pilot 2" in Targets.
      if (times > 1) {
        p.name = `${p.name} ${i + 1}`;
      }
      addParticipant(p);
    }

    toast({
      title: 'Added to encounter',
      description: isMinion
        ? `${detail.name} (minion group of ${npc.count ?? 4})`
        : times > 1
        ? `${detail.name} × ${times}`
        : detail.name,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <VStack align="stretch" spacing={0.5}>
      {npcs.map((entry, i) => {
        const npc = normaliseNpc(entry);
        const linked = !!npc.adversaryId;
        return (
          <HStack key={i} align="center" spacing={1.5} minW={0}>
            <Box
              color={linked ? '#7fcaa1' : 'whiteAlpha.500'}
              fontSize="10px"
              flexShrink={0}
              display="inline-flex"
              alignItems="center"
            >
              <FaUser />
            </Box>
            <Text
              color="whiteAlpha.900"
              fontSize="xs"
              lineHeight="1.35"
              fontWeight="medium"
              flexShrink={0}
              maxW="55%"
              noOfLines={1}
            >
              {npc.name}
            </Text>
            {npc.count && npc.count > 1 && (
              <Badge
                bg="whiteAlpha.150"
                color="whiteAlpha.800"
                fontSize="9px"
                px={1}
                py={0}
                borderRadius="sm"
                lineHeight="1.3"
                flexShrink={0}
              >
                × {npc.count}
              </Badge>
            )}
            {npc.descriptor && (
              <Text
                color="whiteAlpha.500"
                fontSize="2xs"
                lineHeight="1.4"
                flex="1"
                minW={0}
                noOfLines={1}
                title={npc.descriptor}
              >
                {npc.descriptor}
              </Text>
            )}
            {linked && (
              <Tooltip
                label={`Add ${npc.name} to encounter`}
                placement="left"
                hasArrow
                openDelay={300}
                bg="#1a1c1e"
                color="whiteAlpha.900"
              >
                <IconButton
                  aria-label={`Add ${npc.name}`}
                  icon={<AddIcon boxSize="9px" />}
                  size="xs"
                  h="18px"
                  minW="18px"
                  variant="ghost"
                  color="#7fcaa1"
                  _hover={{ bg: 'rgba(127,202,161,0.16)', color: '#a8e0bf' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdd(npc);
                  }}
                />
              </Tooltip>
            )}
          </HStack>
        );
      })}
    </VStack>
  );
};

export default NPCList;
