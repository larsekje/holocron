import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Grid,
  GridItem,
  Divider,
  Badge,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
} from '@chakra-ui/react';
import { Participant } from '@/state/participantsStore';
import adversaryService from '@/services/adversaryService';
import { Adversary } from '@/types/adversaryTypes';

// Define the weapon type
interface Weapon {
  name: string;
  skill?: string;
  damage?: number;
  'plus-damage'?: number;
  plusDamage?: number; // Alternative property name
  critical?: number;
  range?: string;
  qualities?: string | string[];
  [key: string]: any; // Allow any other properties
}

interface StatSheetProps {
  participant: Participant;
}

/**
 * Component to display detailed participant statistics in a character sheet format
 */
const StatSheet: React.FC<StatSheetProps> = ({ participant }) => {
  const [adversary, setAdversary] = useState<Adversary | null>(null);
  const [loading, setLoading] = useState(false);
  const [weaponsData, setWeaponsData] = useState<Weapon[]>([]);
  const [weaponsLookup, setWeaponsLookup] = useState<Record<string, Weapon>>({});
  
  // Load weapons data
  useEffect(() => {
    const loadWeaponsData = async () => {
      try {
        const response = await fetch('/assets/data/weapons.json');
        if (!response.ok) {
          throw new Error('Failed to load weapons data');
        }
        const data = await response.json();
        
        // Create a lookup map by weapon name
        const lookup: Record<string, Weapon> = {};
        data.forEach((weapon: Weapon) => {
          if (weapon.name) {
            lookup[weapon.name.toLowerCase()] = weapon;
          }
        });
        
        setWeaponsLookup(lookup);
      } catch (error) {
        console.error('Failed to load weapons data:', error);
      }
    };
    
    loadWeaponsData();
  }, []);
  
  // Load adversary data if participant has an adversaryId
  useEffect(() => {
    const loadAdversaryData = async () => {
      const adversaryId = participant.stats?.adversaryId;
      if (!adversaryId) return;
      
      setLoading(true);
      try {
        const data = await adversaryService.getAdversaryByName(adversaryId);
        if (data) {
          setAdversary(data);
          
          // Process weapons for this adversary
          if (data.weapons && data.weapons.length > 0) {
            const processedWeapons = data.weapons.map((weapon: string | Weapon) => {
              if (typeof weapon === 'string') {
                return weaponsLookup[weapon.toLowerCase()] || { name: weapon };
              }
              return weapon;
            });
            
            setWeaponsData(processedWeapons);
          }
        }
      } catch (error) {
        console.error('Failed to load adversary data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdversaryData();
  }, [participant.stats?.adversaryId, weaponsLookup]);
  
  const stats = participant.stats || {};
  
  // Character basic info
  const isPC = participant.isPC;
  const type = stats.type || 'Minion';
  
  // Combat stats with defaults
  const soak = stats.soak || (isPC ? 3 : 2);
  const meleeDefense = stats.meleeDefense || 0;
  const rangedDefense = stats.rangedDefense || 0;
  const woundThreshold = stats.woundThreshold || (isPC ? 12 : 8);
  const strainThreshold = stats.strainThreshold || (isPC ? 14 : 0);
  const wounds = stats.wounds || 0;
  const strain = stats.strain || 0;
  
  // Characteristics with PC defaults
  const brawn = stats.brawn || (isPC ? 2 : 2);
  const agility = stats.agility || (isPC ? 2 : 2);
  const intellect = stats.intellect || (isPC ? 2 : 2);
  const cunning = stats.cunning || (isPC ? 2 : 2);
  const willpower = stats.willpower || (isPC ? 2 : 2);
  const presence = stats.presence || (isPC ? 2 : 2);
  
  // Skills
  const skills = stats.skills || {};
  const talents = stats.talents || [];
  const abilities = stats.abilities || [];
  
  // Derived statistics
  const encumbranceThreshold = brawn * 5 + (stats.encumbranceBonus || 0);
  const encumbranceCurrent = stats.encumbrance || 0;

  if (loading) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <VStack spacing={4} align="stretch">
        {/* Header */}
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="md">{participant.name}</Heading>
          <HStack>
            <Badge colorScheme={isPC ? "green" : "purple"}>{isPC ? "PC" : "NPC"}</Badge>
            <Badge colorScheme="blue">{type}</Badge>
          </HStack>
        </HStack>
        
        <Divider />
        
        {/* Primary Stats */}
        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
          <GridItem>
            <StatBox label="Wounds" current={wounds} max={woundThreshold} />
          </GridItem>
          
          {(isPC || type === 'Nemesis') && (
            <GridItem>
              <StatBox label="Strain" current={strain} max={strainThreshold} />
            </GridItem>
          )}
          
          <GridItem>
            <StatBox label="Soak" value={soak} />
          </GridItem>
          
          <GridItem>
            <StatBox label="Defense (M/R)" value={`${meleeDefense}/${rangedDefense}`} />
          </GridItem>
          
          <GridItem>
            <StatBox label="Encumbrance" current={encumbranceCurrent} max={encumbranceThreshold} />
          </GridItem>
        </Grid>
        
        <Divider />
        
        {/* Characteristics */}
        <Heading size="sm">Characteristics</Heading>
        <Grid templateColumns="repeat(6, 1fr)" gap={2}>
          <CharacteristicBox label="BR" value={brawn} />
          <CharacteristicBox label="AG" value={agility} />
          <CharacteristicBox label="INT" value={intellect} />
          <CharacteristicBox label="CUN" value={cunning} />
          <CharacteristicBox label="WIL" value={willpower} />
          <CharacteristicBox label="PR" value={presence} />
        </Grid>
        
        <Divider />
        
        {/* Description (if available from adversary) */}
        {adversary?.description && (
          <>
            <Heading size="sm">Description</Heading>
            <Text fontSize="sm">{adversary.description}</Text>
            <Divider />
          </>
        )}
        
        {/* Expandable sections */}
        <Accordion allowMultiple defaultIndex={[0]}>
          {/* Skills */}
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Skills</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                {Object.entries(skills).map(([skillName, rank]) => (
                  <GridItem key={skillName}>
                    <Text fontSize="sm">
                      <strong>{formatSkillName(skillName)}</strong>: {rank}
                    </Text>
                  </GridItem>
                ))}
                {Object.keys(skills).length === 0 && (
                  <Text fontSize="sm" color="gray.500">No skills recorded</Text>
                )}
              </Grid>
            </AccordionPanel>
          </AccordionItem>
          
          {/* Talents */}
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Talents</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              {talents.length > 0 ? (
                talents.map((talent, index) => (
                  <Text key={index} fontSize="sm">{talent}</Text>
                ))
              ) : (
                <Text fontSize="sm" color="gray.500">No talents recorded</Text>
              )}
            </AccordionPanel>
          </AccordionItem>
          
          {/* Weapons */}
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Weapons</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              {weaponsData.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                  {weaponsData.map((weapon, index) => (
                    <Box key={index} p={2} borderWidth="1px" borderRadius="md">
                      <Text fontWeight="bold" fontSize="sm">{weapon.name}</Text>
                      {weapon.skill && <Text fontSize="xs">Skill: {weapon.skill}</Text>}
                      {weapon.range && <Text fontSize="xs">Range: {weapon.range}</Text>}
                      {weapon.damage && <Text fontSize="xs">Damage: {weapon.damage}</Text>}
                      {(weapon['plus-damage'] || weapon.plusDamage) && 
                        <Text fontSize="xs">+Damage: {weapon['plus-damage'] || weapon.plusDamage}</Text>}
                      {weapon.critical && <Text fontSize="xs">Critical: {weapon.critical}</Text>}
                      {weapon.qualities && (
                        <Text fontSize="xs">
                          Qualities: {Array.isArray(weapon.qualities) 
                            ? weapon.qualities.join(', ') 
                            : weapon.qualities}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color="gray.500">No weapons recorded</Text>
              )}
            </AccordionPanel>
          </AccordionItem>
          
          {/* Abilities */}
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Special Abilities</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              {abilities.length > 0 ? (
                abilities.map((ability, index) => (
                  <Text key={index} fontSize="sm">{ability}</Text>
                ))
              ) : (
                <Text fontSize="sm" color="gray.500">No special abilities recorded</Text>
              )}
            </AccordionPanel>
          </AccordionItem>
          
          {/* Notes (if available from adversary) */}
          {adversary?.notes && (
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading size="sm">GM Notes</Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <Text fontSize="sm">{adversary.notes}</Text>
              </AccordionPanel>
            </AccordionItem>
          )}
        </Accordion>
      </VStack>
    </Box>
  );
};

// Utility component for displaying characteristics
interface CharacteristicBoxProps {
  label: string;
  value: number;
}

const CharacteristicBox: React.FC<CharacteristicBoxProps> = ({ label, value }) => (
  <Box textAlign="center" borderWidth="1px" borderRadius="md" p={2}>
    <Text fontWeight="bold" fontSize="sm">{label}</Text>
    <Text fontSize="xl">{value}</Text>
  </Box>
);

// Utility component for displaying stat values
interface StatBoxProps {
  label: string;
  value?: string | number;
  current?: number;
  max?: number;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, current, max }) => (
  <Box textAlign="center" borderWidth="1px" borderRadius="md" p={2}>
    <Text fontWeight="bold" fontSize="sm">{label}</Text>
    {value !== undefined ? (
      <Text fontSize="lg">{value}</Text>
    ) : (
      <Text fontSize="lg">
        {current !== undefined ? current : 0} / {max !== undefined ? max : 0}
      </Text>
    )}
  </Box>
);

// Format skill names for display
function formatSkillName(skillName: string): string {
  return skillName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
}

export default StatSheet;
