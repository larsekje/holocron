import React from 'react';
import {
  Badge,
  Box,
  Button,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { EncounterTemplate } from '@/data/encounterTemplates';
import useSessionPrepStore from '@/state/sessionPrepStore';
import DenseRow from './DenseRow';
import NPCList from './NPCList';
import { TAG_COLOR, TAG_ICON, primaryTag } from './encounterVisuals';

interface Props {
  template: EncounterTemplate;
}

/**
 * EncounterTemplateCard — collapsed row shows accent + icon + title + blurb;
 * tooltip shows the full blurb; expand for description + NPCs + beats +
 * Start action.
 */
const EncounterTemplateCard: React.FC<Props> = ({ template }) => {
  const startFromTemplate = useSessionPrepStore((s) => s.startFromTemplate);
  const activeFromThis = useSessionPrepStore(
    (s) => s.activeScene?.fromTemplateId === template.id,
  );

  const tag = primaryTag(template.tags);
  const accent = tag ? TAG_COLOR[tag] : '#5a7fb0';
  const icon = tag ? TAG_ICON[tag] : null;

  const rightSlot = (
    <>
      {activeFromThis && (
        <Badge
          bg="#3a7e57"
          color="white"
          fontSize="9px"
          textTransform="uppercase"
          letterSpacing="0.06em"
          px={1}
          py={0}
          borderRadius="sm"
          lineHeight="1.3"
        >
          Live
        </Badge>
      )}
      {template.npcs && template.npcs.length > 0 && (
        <Badge
          bg="whiteAlpha.150"
          color="whiteAlpha.700"
          fontSize="9px"
          px={1}
          py={0}
          borderRadius="sm"
          lineHeight="1.3"
        >
          {template.npcs.length}N
        </Badge>
      )}
      {template.beats && template.beats.length > 0 && (
        <Badge
          bg="whiteAlpha.150"
          color="whiteAlpha.700"
          fontSize="9px"
          px={1}
          py={0}
          borderRadius="sm"
          lineHeight="1.3"
        >
          {template.beats.length}B
        </Badge>
      )}
    </>
  );

  return (
    <DenseRow
      accentColor={accent}
      icon={icon}
      title={template.title}
      subtitle={template.blurb}
      rightSlot={rightSlot}
      tooltip={
        <VStack align="start" spacing={1} py={1}>
          <Text fontSize="xs" fontWeight="semibold">{template.title}</Text>
          <Text fontSize="2xs" color="whiteAlpha.700">{template.blurb}</Text>
        </VStack>
      }
      body={
        <Box>
          <Text
            color="whiteAlpha.900"
            fontSize="xs"
            whiteSpace="pre-wrap"
            lineHeight="1.4"
          >
            {template.description}
          </Text>

          {template.npcs && template.npcs.length > 0 && (
            <Box mt={2}>
              <Text
                fontSize="2xs"
                color="whiteAlpha.500"
                letterSpacing="0.16em"
                textTransform="uppercase"
                mb={1}
              >
                NPCs ({template.npcs.length})
              </Text>
              <NPCList npcs={template.npcs} />
            </Box>
          )}

          {template.beats && template.beats.length > 0 && (
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
                {template.beats.map((b, i) => (
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

          <HStack mt={2} spacing={1.5}>
            <Button
              size="xs"
              h="22px"
              fontSize="2xs"
              colorScheme={activeFromThis ? 'green' : 'blue'}
              variant="solid"
              isDisabled={activeFromThis}
              onClick={(e) => {
                e.stopPropagation();
                startFromTemplate(template);
              }}
            >
              {activeFromThis ? 'Active' : 'Start scene'}
            </Button>
          </HStack>
        </Box>
      }
    />
  );
};

export default EncounterTemplateCard;
