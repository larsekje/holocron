import React, { useState } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import useUserContentStore from '@/state/userContentStore';
import useSessionPrepStore from '@/state/sessionPrepStore';
import {
  ENCOUNTER_TEMPLATES,
  type EncounterTag,
  type EncounterTemplate,
} from '@/data/encounterTemplates';
import { HALCYON_SCENE_GROUPS } from '@/data/halcyonHeist';
import { ALL_TAGS, TAG_COLOR, resolveEncounterVisual } from './encounterVisuals';

/** Collapsed hook = first line of the body (same rule as the prep cards). */
function hookOf(e: EncounterTemplate): string {
  const body = (e.body ?? '').trim();
  if (body) return (body.split(/\n\s*\n/)[0] ?? body).split('\n')[0];
  return e.blurb ?? '';
}

const MenuRow: React.FC<{
  scene: EncounterTemplate;
  onStart: (scene: EncounterTemplate) => void;
  dotColor?: string;
}> = ({ scene, onStart, dotColor }) => {
  const visual = resolveEncounterVisual(scene);
  const accent = dotColor ?? scene.accentColor ?? visual.color;
  return (
    <HStack
      role="group"
      spacing={1.5}
      px={1.5}
      py="3px"
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: 'whiteAlpha.50' }}
      onClick={() => onStart(scene)}
      title="Start scene"
    >
      {dotColor ? (
        <Box w="6px" h="6px" borderRadius="full" bg={dotColor} flexShrink={0} />
      ) : (
        <Box color={accent} fontSize="12px" display="inline-flex" flexShrink={0} w="14px" justifyContent="center">
          {visual.icon}
        </Box>
      )}
      <Text color="whiteAlpha.900" fontSize="2xs" fontWeight="semibold" flexShrink={0} noOfLines={1} maxW="46%">
        {scene.title}
      </Text>
      <Text color="whiteAlpha.500" fontSize="10px" flex="1" noOfLines={1}>
        {hookOf(scene)}
      </Text>
      <Text
        color="#7fb0ca"
        fontSize="9px"
        flexShrink={0}
        opacity={0}
        _groupHover={{ opacity: 1 }}
        transition="opacity 120ms"
      >
        ▶ start
      </Text>
    </HStack>
  );
};

/**
 * ScenesMenu — the scene library during play, folded to single lines: a menu
 * to scan when the fiction turns, never a sequence. Tag chips filter the
 * GM-authored scenes + bundled samples by what the table just became ("they
 * started talking" → Social). The Halcyon rooms sit in their own fold, grouped
 * by ship zone with the zone's access colour.
 */
const ScenesMenu: React.FC = () => {
  const userEncounters = useUserContentStore((s) => s.userEncounters);
  const startFromTemplate = useSessionPrepStore((s) => s.startFromTemplate);
  const [tag, setTag] = useState<EncounterTag | 'all'>('all');
  const [halcyonOpen, setHalcyonOpen] = useState(false);

  const scenes = [...userEncounters].reverse().concat(ENCOUNTER_TEMPLATES);
  const filtered = tag === 'all' ? scenes : scenes.filter((s) => s.tags?.includes(tag));
  const halcyonCount = HALCYON_SCENE_GROUPS.reduce((n, g) => n + g.scenes.length, 0);

  return (
    <Box>
      {/* Tag filter */}
      <HStack spacing={1} mb={1} flexWrap="wrap">
        {(['all', ...ALL_TAGS] as const).map((t) => {
          const on = tag === t;
          return (
            <Box
              key={t}
              as="button"
              fontSize="9px"
              fontWeight="bold"
              letterSpacing="0.05em"
              textTransform="uppercase"
              px={1.5}
              py="1px"
              borderRadius="sm"
              color={on ? 'white' : 'whiteAlpha.500'}
              bg={on ? (t === 'all' ? 'whiteAlpha.300' : TAG_COLOR[t]) : 'whiteAlpha.100'}
              onClick={() => setTag(t)}
            >
              {t}
            </Box>
          );
        })}
      </HStack>

      <VStack align="stretch" spacing="1px">
        {filtered.map((s) => (
          <MenuRow key={s.id} scene={s} onStart={startFromTemplate} />
        ))}
        {filtered.length === 0 && (
          <Text color="whiteAlpha.400" fontSize="10px" fontStyle="italic" px={1.5}>
            nothing tagged “{tag}” yet
          </Text>
        )}
      </VStack>

      {/* Halcyon rooms — their own fold, zone-grouped */}
      <HStack
        spacing={1}
        mt={1.5}
        cursor="pointer"
        role="button"
        onClick={() => setHalcyonOpen((v) => !v)}
        _hover={{ '& > p': { color: 'whiteAlpha.700' } }}
      >
        {halcyonOpen ? (
          <ChevronDownIcon color="whiteAlpha.400" boxSize="12px" />
        ) : (
          <ChevronRightIcon color="whiteAlpha.400" boxSize="12px" />
        )}
        <Text fontSize="9px" color="whiteAlpha.500" letterSpacing="0.14em" textTransform="uppercase" fontWeight="bold" transition="color 120ms">
          Halcyon Heist · rooms ({halcyonCount})
        </Text>
      </HStack>
      {halcyonOpen && (
        <Box maxH="240px" overflowY="auto" mt={0.5} pr={0.5}>
          {HALCYON_SCENE_GROUPS.map((g) => (
            <Box key={g.key} mb={1}>
              <Text fontSize="8px" color="whiteAlpha.400" letterSpacing="0.14em" textTransform="uppercase" fontWeight="bold" px={1.5} mb="1px">
                {g.label}
              </Text>
              {g.scenes.map((s) => (
                <MenuRow key={s.id} scene={s} onStart={startFromTemplate} dotColor={g.color} />
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ScenesMenu;
