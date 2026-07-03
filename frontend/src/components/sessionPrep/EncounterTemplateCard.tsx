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
import DiceText from './DiceText';
import NPCList from './NPCList';
import { TAG_COLOR, TAG_ICON, primaryTag } from './encounterVisuals';

/** Small labelled reference block for the structured location-scene fields. */
const RefBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Box mt={2}>
    <Text fontSize="2xs" color="whiteAlpha.500" letterSpacing="0.16em" textTransform="uppercase" mb={0.5}>
      {label}
    </Text>
    {children}
  </Box>
);

interface Props {
  template: EncounterTemplate;
  /** When provided (GM-authored encounters), show Edit / Delete actions. */
  onEdit?: (template: EncounterTemplate) => void;
  onDelete?: (id: string) => void;
}

/**
 * EncounterTemplateCard — collapsed row shows accent + icon + title + blurb;
 * tooltip shows the full blurb; expand for description + NPCs + beats +
 * Start action.
 */
const EncounterTemplateCard: React.FC<Props> = ({ template, onEdit, onDelete }) => {
  const startFromTemplate = useSessionPrepStore((s) => s.startFromTemplate);
  const activeFromThis = useSessionPrepStore(
    (s) => s.activeScene?.fromTemplateId === template.id,
  );

  const tag = primaryTag(template.tags);
  const accent = template.accentColor ?? (tag ? TAG_COLOR[tag] : '#5a7fb0');
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

          {template.floor && template.floor.length > 0 && (
            <RefBlock label="The floor">
              <VStack align="start" spacing={0.5}>
                {template.floor.map((v, i) => (
                  <HStack key={i} align="start" spacing={1.5}>
                    <Text fontSize="8px" mt="4px" color={v.watch ? '#d39939' : 'whiteAlpha.400'} flexShrink={0}>●</Text>
                    <Text color="whiteAlpha.700" fontSize="xs" fontStyle="italic" lineHeight="1.4">{v.text}</Text>
                  </HStack>
                ))}
              </VStack>
            </RefBlock>
          )}

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

          {template.angles && template.angles.length > 0 && (
            <RefBlock label={template.anglesLabel ?? 'Angles'}>
              <VStack align="start" spacing={0.5}>
                {template.angles.map((a, i) => (
                  <HStack key={i} align="start" spacing={1.5}>
                    <Text fontSize="9px" mt="2px" color="#7fb0ca" flexShrink={0}>▸</Text>
                    <Text color="whiteAlpha.800" fontSize="xs" lineHeight="1.4"><DiceText text={a} /></Text>
                  </HStack>
                ))}
              </VStack>
            </RefBlock>
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

          {template.nudge && (
            <RefBlock label="Nudge">
              <Text color="#cbb98a" fontSize="xs" lineHeight="1.4">{template.nudge}</Text>
            </RefBlock>
          )}

          {(template.exits || (template.links && template.links.length > 0)) && (
            <RefBlock label="Exits">
              {template.exits && (
                <Text color="whiteAlpha.700" fontSize="xs" lineHeight="1.4">{template.exits}</Text>
              )}
              {template.links && template.links.length > 0 && (
                <Text color="whiteAlpha.500" fontSize="2xs" lineHeight="1.4" mt={0.5}>
                  Connects to: {template.links.join(' · ')}
                </Text>
              )}
            </RefBlock>
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
            {onEdit && (
              <Button
                size="xs"
                h="22px"
                fontSize="2xs"
                variant="ghost"
                color="whiteAlpha.600"
                _hover={{ bg: 'whiteAlpha.150', color: 'white' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(template);
                }}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="xs"
                h="22px"
                fontSize="2xs"
                variant="ghost"
                color="whiteAlpha.600"
                _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(template.id);
                }}
              >
                Delete
              </Button>
            )}
          </HStack>
        </Box>
      }
    />
  );
};

export default EncounterTemplateCard;
