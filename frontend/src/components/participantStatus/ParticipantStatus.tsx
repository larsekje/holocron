import React from 'react';
import {
  Card,
  CardBody,
  HStack,
  Text, 
  Tooltip,
  Badge,
  Button,
  Flex,
  Heading
} from "@chakra-ui/react";
import { Participant } from "@/state/participantsStore";
import useParticipantStore from "@/state/participantsStore";
import useGameplayStore from "@/state/newGameplayStore";
import Talent from "@components/participantStatus/Talent";
import HealthBar from "@components/participantStatus/HealthBar";

interface Props {
  participant: Participant;
  participantId: string; 
}

/**
 * Display the status of a participant, including health bars and important traits
 */
const ParticipantStatus = ({ participant, participantId }: Props) => {
  const { addWounds, removeWounds } = useParticipantStore();
  
  // Get active participant state from the new gameplayStore
  const activeParticipantId = useGameplayStore(state => state.context.activeParticipantId);
  const actedParticipants = useGameplayStore(state => state.context.actedParticipants);
  const setActiveParticipantId = useGameplayStore(state => state.setActiveParticipantId);

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
          
          <Button
            size="xs"
            colorScheme="blue"
            onClick={setAsActive}
            isDisabled={isActive && !hasActed}
          >
            {hasActed ? "Set Active (override)" : "Set Active"}
          </Button>
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

      </CardBody>
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
