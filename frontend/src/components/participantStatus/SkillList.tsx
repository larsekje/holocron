import React from 'react';
import { 
  Box, 
  Grid, 
  GridItem, 
  Text, 
  Badge,
  Tooltip
} from '@chakra-ui/react';

interface SkillListProps {
  skills: Record<string, number>;
  characteristics?: Record<string, number>;
  showEmpty?: boolean;
  filterByCategory?: string;
}

// Mapping of skills to their characteristic
const SKILL_CHARACTERISTICS: Record<string, string> = {
  // Brawn skills
  brawl: 'brawn',
  melee: 'brawn',
  resilience: 'brawn',
  athletics: 'brawn',
  
  // Agility skills
  coordination: 'agility',
  piloting: 'agility',
  pilotingSpace: 'agility',
  pilotingPlanetary: 'agility',
  rangedLight: 'agility',
  rangedHeavy: 'agility',
  stealth: 'agility',
  
  // Intellect skills
  astrogation: 'intellect',
  computers: 'intellect',
  mechanics: 'intellect',
  medicine: 'intellect',
  knowledge: 'intellect',
  coreWorlds: 'intellect',
  education: 'intellect',
  lore: 'intellect',
  outerRim: 'intellect',
  underworld: 'intellect',
  warfare: 'intellect',
  xenology: 'intellect',
  
  // Cunning skills
  deception: 'cunning',
  perception: 'cunning',
  streetwise: 'cunning',
  survival: 'cunning',
  
  // Willpower skills
  coercion: 'willpower',
  discipline: 'willpower',
  vigilance: 'willpower',
  
  // Presence skills
  charm: 'presence',
  cool: 'presence',
  leadership: 'presence',
  negotiation: 'presence'
};

// Skill categories for organization
const SKILL_CATEGORIES: Record<string, string[]> = {
  combat: ['brawl', 'melee', 'rangedLight', 'rangedHeavy', 'gunnery'],
  social: ['charm', 'coercion', 'deception', 'leadership', 'negotiation'],
  general: ['astrogation', 'athletics', 'computers', 'cool', 'coordination', 'discipline', 
            'mechanics', 'medicine', 'perception', 'piloting', 'pilotingSpace', 'pilotingPlanetary', 
            'resilience', 'stealth', 'streetwise', 'survival', 'vigilance'],
  knowledge: ['knowledge', 'coreWorlds', 'education', 'lore', 'outerRim', 'underworld', 'warfare', 'xenology']
};

const SkillList: React.FC<SkillListProps> = ({ 
  skills, 
  characteristics = {}, 
  showEmpty = false,
  filterByCategory
}) => {
  // Format skill name for display (e.g., "rangedHeavy" -> "Ranged Heavy")
  const formatSkillName = (name: string): string => {
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
  };
  
  // Get characteristic value for a skill
  const getCharacteristicValue = (skillName: string): number => {
    const characteristicKey = SKILL_CHARACTERISTICS[skillName] || 'intellect';
    return characteristics[characteristicKey] || 2; // Default to 2 if not found
  };
  
  // Calculate the total dice pool (characteristic + skill rank)
  const getDicePool = (skillName: string, rank: number): string => {
    const characteristicValue = getCharacteristicValue(skillName);
    const proficiency = Math.min(rank, characteristicValue);
    const ability = Math.max(characteristicValue - proficiency, 0);
    
    return `${proficiency}⬢ ${ability}⬡`; // Unicode symbols for proficiency and ability dice
  };
  
  // Filter skills by category if needed
  const filteredSkills = filterByCategory 
    ? Object.entries(skills).filter(([name]) => SKILL_CATEGORIES[filterByCategory]?.includes(name))
    : Object.entries(skills);
  
  // Sort skills alphabetically
  const sortedSkills = filteredSkills.sort((a, b) => a[0].localeCompare(b[0]));
  
  if (sortedSkills.length === 0 && !showEmpty) {
    return <Text fontSize="sm" color="gray.500">No skills recorded</Text>;
  }
  
  return (
    <Grid templateColumns="repeat(2, 1fr)" gap={2}>
      {sortedSkills.map(([skillName, rank]) => (
        <GridItem key={skillName}>
          <Tooltip 
            label={`${formatSkillName(skillName)} (${SKILL_CHARACTERISTICS[skillName] || 'intellect'}): ${rank}`}
            placement="top"
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Text fontSize="sm">
                <strong>{formatSkillName(skillName)}</strong>
              </Text>
              <Badge colorScheme="blue">{rank}</Badge>
            </Box>
          </Tooltip>
        </GridItem>
      ))}
      {sortedSkills.length === 0 && showEmpty && (
        <Text fontSize="sm" color="gray.500">No skills in this category</Text>
      )}
    </Grid>
  );
};

export default SkillList;
