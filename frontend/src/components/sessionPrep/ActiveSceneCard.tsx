import React from 'react';
import {
  Badge,
  Box,
  Button,
  HStack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { FaPlay } from 'react-icons/fa';
import useSessionPrepStore from '@/state/sessionPrepStore';
import DenseRow from './DenseRow';
import NPCList from './NPCList';
import { ENCOUNTER_TEMPLATES } from '@/data/encounterTemplates';
import { TAG_COLOR, TAG_ICON, primaryTag } from './encounterVisuals';

/**
 * ActiveSceneCard — top of the Session Prep panel. The scene's header
 * stays as a one-line DenseRow; the body (description, NPC list, beats,
 * running notes) drops below when expanded. defaultOpen=true so a freshly
 * started scene is visible without an extra click; the GM can collapse to
 * focus on other sections.
 */
const ActiveSceneCard: React.FC = () => {
  const activeScene = useSessionPrepStore((s) => s.activeScene);
  const clearActiveScene = useSessionPrepStore((s) => s.clearActiveScene);
  const setNotes = useSessionPrepStore((s) => s.setNotes);

  if (!activeScene) {
    return (
      <Box
        bg="#26292d"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="whiteAlpha.200"
        borderRadius="md"
        px={2}
        py={1}
      >
        <Text color="whiteAlpha.500" fontSize="2xs" fontStyle="italic">
          No active scene. Start one from a template below.
        </Text>
      </Box>
    );
  }

  // Recover the source template's tag/icon if known — the user gets the
  // same visual cue here that they saw on the template they clicked.
  const sourceTemplate = activeScene.fromTemplateId
    ? ENCOUNTER_TEMPLATES.find((t) => t.id === activeScene.fromTemplateId)
    : undefined;
  const tag = primaryTag(sourceTemplate?.tags);
  const accent = tag ? TAG_COLOR[tag] : '#3a7e57';
  const icon = tag ? TAG_ICON[tag] : <FaPlay/>;

  const rightSlot = (
    <>
      {activeScene.npcs && activeScene.npcs.length > 0 && (
        <Badge
          bg="whiteAlpha.150"
          color="whiteAlpha.700"
          fontSize="9px"
          px={1}
          py={0}
          borderRadius="sm"
          lineHeight="1.3"
        >
          {activeScene.npcs.length}N
        </Badge>
      )}
      {activeScene.beats && activeScene.beats.length > 0 && (
        <Badge
          bg="whiteAlpha.150"
          color="whiteAlpha.700"
          fontSize="9px"
          px={1}
          py={0}
          borderRadius="sm"
          lineHeight="1.3"
        >
          {activeScene.beats.length}B
        </Badge>
      )}
      <Button
        as="span"
        size="xs"
        variant="ghost"
        color="whiteAlpha.500"
        h="18px"
        minW="auto"
        px={1.5}
        fontSize="2xs"
        _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
        onClick={(e) => {
          e.stopPropagation();
          clearActiveScene();
        }}
      >
        End
      </Button>
    </>
  );

  return (
    <DenseRow
      accentColor={accent}
      icon={icon}
      title={activeScene.title}
      rightSlot={rightSlot}
      defaultOpen={true}
      expandedBorderColor="#3a7e57"
      body={
        <Box>
          <Text
            color="whiteAlpha.800"
            fontSize="xs"
            whiteSpace="pre-wrap"
            lineHeight="1.4"
          >
            {activeScene.description}
          </Text>

          {activeScene.npcs && activeScene.npcs.length > 0 && (
            <Box mt={2}>
              <Text
                fontSize="2xs"
                color="whiteAlpha.500"
                letterSpacing="0.16em"
                textTransform="uppercase"
                mb={1}
              >
                NPCs ({activeScene.npcs.length})
              </Text>
              <NPCList npcs={activeScene.npcs} />
            </Box>
          )}

          {activeScene.beats && activeScene.beats.length > 0 && (
            <Box mt={2}>
              <Text
                fontSize="2xs"
                color="whiteAlpha.500"
                letterSpacing="0.16em"
                textTransform="uppercase"
                mb={0.5}
              >
                Beats
              </Text>
              <VStack align="start" spacing={0.5}>
                {activeScene.beats.map((b, i) => (
                  <HStack key={i} align="start" spacing={1.5}>
                    <Text color="whiteAlpha.500" fontSize="2xs" minW="10px" lineHeight="1.4">
                      {i + 1}.
                    </Text>
                    <Text color="whiteAlpha.800" fontSize="xs" flex="1" lineHeight="1.4">
                      {b}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          <Box mt={2} onClick={(e) => e.stopPropagation()}>
            <Textarea
              value={activeScene.notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Running notes…"
              size="sm"
              minH="36px"
              py={1}
              px={2}
              bg="#1f2225"
              borderColor="whiteAlpha.200"
              color="whiteAlpha.900"
              fontSize="xs"
              lineHeight="1.35"
              _placeholder={{ color: 'whiteAlpha.400' }}
              _focus={{ borderColor: 'whiteAlpha.400', boxShadow: 'none' }}
              resize="vertical"
            />
          </Box>
        </Box>
      }
    />
  );
};

export default ActiveSceneCard;
