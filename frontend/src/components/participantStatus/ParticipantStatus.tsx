import React, { useState } from 'react';
import {
  Card,
  CardBody,
  HStack,
  Text, 
  Tooltip,
  Badge,
  Button,
  Flex,
  Heading,
  IconButton,
  Box,
  Tag,
  TagLabel,
  TagLeftIcon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Divider,
} from "@chakra-ui/react";
import { InfoIcon, WarningTwoIcon, CloseIcon, RepeatIcon } from '@chakra-ui/icons';
import { Participant } from "@/state/participantsStore";
import useParticipantStore from "@/state/participantsStore";
import useGameplayStore from "@/state/newGameplayStore";
import Talent from "@components/participantStatus/Talent";
import HealthBar from "@components/participantStatus/HealthBar";
import StatSheetModal from './StatSheetModal';
import DicePouch from './DicePouch';
import ApplyEffectsModal from "@components/effects/ApplyEffectsModal";
import {useEffectStore} from "@/state/effectStore";

interface Props {
  participant: Participant;
  participantId: string; 
}

/**
 * Display the status of a participant, including health bars and important traits
 */
const ParticipantStatus = ({ participant, participantId }: Props) => {
  const { addWounds, removeWounds, removeCriticalInjury } = useParticipantStore();
  const [showStatSheet, setShowStatSheet] = useState(false);
  const [showEffectsModal, setShowEffectsModal] = useState(false);
  const [editCritId, setEditCritId] = useState<string | null>(null);
  
  // Get active participant state from the new gameplayStore
  const activeParticipantId = useGameplayStore(state => state.context.activeParticipantId);
  const actedParticipants = useGameplayStore(state => state.context.actedParticipants);
  const setActiveParticipantId = useGameplayStore(state => state.setActiveParticipantId);

  // Critical injuries indicator
  const critCount = participant.criticalInjuries?.length ?? 0;
  const critTooltip =
    (participant.criticalInjuries || [])
      .slice(-4)
      .map(ci => `• ${ci.title}`)
      .join('\n') || 'No critical injuries';

  // Active effects indicator
  const effects = useEffectStore((s) => s.effects);
  const participantEffects = effects.filter(
    (ae) => ae.target?.type === "character" && ae.target?.participantId === participantId
  );
  const effectsCount = participantEffects.length;

  const incrementHealth = () => {
    addWounds(participantId, 1);
  };

  const decrementHealth = () => {
    removeWounds(participantId, 1);
  };

  // Get participant stats with defaults
  const stats = participant.stats || {};
  const wounds = stats.wounds || 0;
  const woundThreshold = stats.woundThreshold || (participant.isPC ? 12 : 8);
  const soak = stats.soak || (participant.isPC ? 3 : 2);
  const meleeDefense = stats.meleeDefense || 0;
  const rangedDefense = stats.rangedDefense || 0;
  const minions = stats.minions;
  const talents = stats.talents || [];

  // Calculate remaining minions
  const calculateAliveMinions = () => {
    if (!minions) return undefined;
    const eliminatedMinions = Math.floor(wounds / woundThreshold);
    return Math.max(minions - eliminatedMinions, 0);
  };

  const aliveMinions = calculateAliveMinions();
  const isNemesis = stats.type === "Nemesis";
  const isActive = participantId === activeParticipantId;
  const hasActed = actedParticipants.includes(participantId);

  // Handle setting this participant as active
  const setAsActive = () => {
    setActiveParticipantId(participantId);
  };

  const healthBar = (
    <HealthBar 
      name='Wounds' 
      max={woundThreshold} 
      current={wounds} 
      onDecrease={decrementHealth} 
      onIncrease={incrementHealth} 
      minions={minions}
    />
  );

  return (
    <Card>
      <CardBody width='100%' padding='2'>
        <Flex justify="space-between" align="center" mb={2}>
          <Flex align="center">
            <Badge 
              colorScheme={participant.isPC ? "green" : "purple"} 
              mr={2}
            >
              {participant.isPC ? "PC" : "NPC"}
            </Badge>
            <Heading size="sm" mr={2}>{participant.name}</Heading>
            
            {critCount > 0 && (
              <Popover placement="bottom-start" isLazy>
                <PopoverTrigger>
                  <Tag size="sm" variant="subtle" colorScheme="red" mr={2} cursor="pointer">
                    <TagLeftIcon boxSize="0.6em" as={WarningTwoIcon} />
                    <TagLabel>{critCount}</TagLabel>
                  </Tag>
                </PopoverTrigger>
                <PopoverContent
                  bg="gray.800"
                  color="whiteAlpha.900"
                  borderColor="gray.600"
                  maxW="360px"
                >
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader borderBottomWidth="1px" borderColor="gray.700" fontWeight="bold">
                    Critical Injuries
                  </PopoverHeader>
                  <PopoverBody maxH="260px" overflowY="auto" px={3}>
                    {(participant.criticalInjuries || []).map((ci, i) => (
                      <Box key={ci.id ?? `${ci.title}-${i}`} mb={2} position="relative">
                        {/* Text block spans full width; actions float above without affecting layout */}
                        <Box
                          onClick={() =>
                            setEditCritId((prev) => (prev === (ci.id || "") ? null : (ci.id || "")))
                          }
                          cursor="pointer"
                        >
                          <Text fontWeight="semibold">
                            {ci.title}{" "}
                            <Text as="span" color="whiteAlpha.600" fontSize="sm">
                              ({ci.severity})
                            </Text>
                          </Text>
                          {ci.summary && (
                            <Text fontSize="sm" color="whiteAlpha.800">
                              {ci.summary}
                            </Text>
                          )}
                        </Box>

                        {/* Actions overlay on the right; shown without affecting layout */}
                        <HStack
                          spacing={2}
                          position="absolute"
                          top={0}
                          right={0}
                          align="flex-start"
                          opacity={editCritId === ci.id ? 1 : 0}
                          pointerEvents={editCritId === ci.id ? "auto" : "none"}
                          transition="opacity 0.15s ease"
                        >
                          <Button
                            size="xs"
                            colorScheme="green"
                            variant="solid"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ci.id) {
                                removeCriticalInjury(participantId, ci.id);
                              }
                              setEditCritId(null);
                            }}
                          >
                            Clear Injury
                          </Button>
                        </HStack>

                        {i < (participant.criticalInjuries?.length || 0) - 1 && (
                          <Divider mt={2} mb={2} borderColor="gray.700" />
                        )}
                      </Box>
                    ))}
                    {(!participant.criticalInjuries || participant.criticalInjuries.length === 0) && (
                      <Text fontSize="sm" color="whiteAlpha.700">No critical injuries</Text>
                    )}
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            )}

            {effectsCount > 0 && (
              <Popover placement="bottom-start" isLazy>
                <PopoverTrigger>
                  <Tag size="sm" variant="subtle" colorScheme="blue" mr={2} cursor="pointer">
                    <TagLeftIcon boxSize="0.6em" as={RepeatIcon} />
                    <TagLabel>{effectsCount}</TagLabel>
                  </Tag>
                </PopoverTrigger>
                <PopoverContent
                  bg="gray.800"
                  color="whiteAlpha.900"
                  borderColor="gray.600"
                  maxW="360px"
                >
                  <PopoverArrow />
                  <PopoverCloseButton />
                  <PopoverHeader borderBottomWidth="1px" borderColor="gray.700" fontWeight="bold">
                    Active Effects
                  </PopoverHeader>
                  <PopoverBody maxH="260px" overflowY="auto" px={3}>
                    {participantEffects.map((ae, i) => (
                      <Box key={`${ae.effect.id}-${i}`} mb={2}>
                        <Text fontWeight="semibold">
                          {ae.effect.name}{" "}
                          <Text as="span" color="whiteAlpha.600" fontSize="sm">
                            {typeof ae.remainingDuration === "number"
                              ? `(${ae.remainingDuration} round${ae.remainingDuration === 1 ? "" : "s"} left)`
                              : ""}
                          </Text>
                        </Text>
                        {ae.effect.description && (
                          <Text fontSize="sm" color="whiteAlpha.800">
                            {ae.effect.description}
                          </Text>
                        )}
                        {i < participantEffects.length - 1 && (
                          <Divider mt={2} mb={2} borderColor="gray.700" />
                        )}
                      </Box>
                    ))}
                    {participantEffects.length === 0 && (
                      <Text fontSize="sm" color="whiteAlpha.700">No active effects</Text>
                    )}
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            )}

            {isActive && (
              <Badge colorScheme="yellow" mr={2}>
                Active
              </Badge>
            )}
            
            {hasActed && (
              <Badge colorScheme="red" mr={2}>
                Acted
              </Badge>
            )}
          </Flex>
          
          <Flex>
            <IconButton
              aria-label="Show character sheet"
              icon={<InfoIcon />}
              size="xs"
              mr={2}
              onClick={() => setShowStatSheet(true)}
            />
            <Button
              size="xs"
              colorScheme="purple"
              mr={2}
              onClick={() => setShowEffectsModal(true)}
            >
              Effects
            </Button>
            <Button
              size="xs"
              colorScheme="blue"
              onClick={setAsActive}
              isDisabled={isActive && !hasActed}
            >
              {hasActed ? "Set Active (override)" : "Set Active"}
            </Button>
          </Flex>
        </Flex>
        
        {healthBar}
        {isNemesis && (
          <HealthBar 
            name='Strain' 
            max={20} 
            current={stats.strain || 0} 
            onDecrease={() => {}} 
            onIncrease={() => {}}
          />
        )}
        <DicePouch participant={participant} participantId={participantId} />
      </CardBody>
      
      {/* Stat Sheet Modal */}
      <StatSheetModal 
        isOpen={showStatSheet} 
        onClose={() => setShowStatSheet(false)} 
        participant={participant} 
      />
      {/* Effects Modal */}
      <ApplyEffectsModal
        isOpen={showEffectsModal}
        onClose={() => setShowEffectsModal(false)}
        participant={participant}
      />
    </Card>
  );
};

/**
 * Find a talent in the talents array that includes the given talent name
 */
function findTalent(talent: string, talents: string[]) {
  return talents.find(t => t.toLowerCase().includes(talent.toLowerCase()));
}

/**
 * Get talents that should be highlighted in the participant status
 */
function getTalentsToHighlight(talents: string[] | undefined): string[] {
  if (!talents) return [];
  
  // These are talents we consider most important to show
  const importantTalents = ['adversary', 'parry', 'reflect', 'dodge', 'durable'];
  
  // Find all important talents that match
  return importantTalents
    .map(talent => findTalent(talent, talents))
    .filter(Boolean) as string[];
}

/**
 * Show minion count if participant is a minion group
 */
function showMinions(minions?: number, aliveMinions?: number) {
  if (!minions) return null;
  
  return (
    <>
      <Text fontSize='sm'>|</Text>
      <Text fontSize='sm'>
        Minions <strong>{aliveMinions ?? minions}</strong>
      </Text>
    </>
  );
}

export default ParticipantStatus;
