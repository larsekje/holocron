import React from 'react';
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
  List,
  ListItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { Participant } from '@/state/participantsStore';
import DicePouch from '@components/participantStatus/DicePouch';
import SkillList from '@components/participantStatus/SkillList';



interface StatSheetProps {
  participant: Participant;
}

/**
 * Component to display detailed participant statistics in a character sheet format
 */
const StatSheet: React.FC<StatSheetProps> = ({ participant }) => {
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
  
  // Characteristics with defaults
  const brawn = stats.brawn || (isPC ? 2 : 2);
  const agility = stats.agility || (isPC ? 2 : 2);
  const intellect = stats.intellect || (isPC ? 2 : 2);
  const cunning = stats.cunning || (isPC ? 2 : 2);
  const willpower = stats.willpower || (isPC ? 2 : 2);
  const presence = stats.presence || (isPC ? 2 : 2);
  
  // Skills and abilities
  const skills = stats.skills || {};
  const talents = stats.talents || [];
  const abilities = stats.abilities || [];
  
  // Derived statistics
  const encumbranceThreshold = brawn * 5 + (stats.encumbranceBonus || 0);
  const encumbranceCurrent = stats.encumbrance || 0;
  
  // Characteristics object for SkillList
  const characteristics = {
    brawn,
    agility,
    intellect,
    cunning,
    willpower,
    presence
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="#2A2C30" shadow="md" color="white">
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
        
        {/* Dice Pouch */}
        {participant.dicePouch && (
          <>
            <Heading size="sm">Dice Modifications</Heading>
            <DicePouch participant={participant} participantId={participant.id} />
            <Divider />
          </>
        )}
        
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
        
        {/* Skills */}
        <Heading size="sm">Skills</Heading>
        <Tabs variant="soft-rounded" size="sm" colorScheme="blue" mt={2}>
          <TabList>
            <Tab>All</Tab>
            <Tab>Combat</Tab>
            <Tab>Social</Tab>
            <Tab>General</Tab>
            <Tab>Knowledge</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={2}>
              <SkillList skills={skills} characteristics={characteristics} showEmpty={false} />
            </TabPanel>
            <TabPanel p={2}>
              <SkillList skills={skills} characteristics={characteristics} filterByCategory="combat" showEmpty={true} />
            </TabPanel>
            <TabPanel p={2}>
              <SkillList skills={skills} characteristics={characteristics} filterByCategory="social" showEmpty={true} />
            </TabPanel>
            <TabPanel p={2}>
              <SkillList skills={skills} characteristics={characteristics} filterByCategory="general" showEmpty={true} />
            </TabPanel>
            <TabPanel p={2}>
              <SkillList skills={skills} characteristics={characteristics} filterByCategory="knowledge" showEmpty={true} />
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <Divider />
        
        {/* Talents */}
        <Heading size="sm">Talents</Heading>
        <List spacing={1}>
          {talents.length > 0 ? (
            talents.map((talent, index) => (
              <ListItem key={index} fontSize="sm">{talent}</ListItem>
            ))
          ) : (
            <Text fontSize="sm" color="gray.500">No talents recorded</Text>
          )}
        </List>
        
        {/* Abilities */}
        {abilities.length > 0 && (
          <>
            <Divider />
            <Heading size="sm">Special Abilities</Heading>
            <List spacing={1}>
              {abilities.map((ability, index) => (
                <ListItem key={index} fontSize="sm">{ability}</ListItem>
              ))}
            </List>
          </>
        )}
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
  <Box textAlign="center" borderWidth="1px" borderRadius="md" p={2} borderColor="gray.600">
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
  <Box textAlign="center" borderWidth="1px" borderRadius="md" p={2} borderColor="gray.600">
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



export default StatSheet;
