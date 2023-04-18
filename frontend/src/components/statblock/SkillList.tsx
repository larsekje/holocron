import React from 'react';
import SkillItem from "./SkillItem";
import {Divider, Heading, HStack, SimpleGrid, useMediaQuery, useToast} from "@chakra-ui/react";
import {DicePool} from "./DicePool";
import {capitalize} from "@/utils";
import {Adversary} from "@/adversary";
import skills from "@/assets/data/skills.json";

interface Props {
  profileSkills: Record<string, number> | string[];
  characteristics: Adversary["characteristics"];
  currentCharacteristic: string;
  minions?: number;
}

const SkillList = ({profileSkills, characteristics, minions}: Props) => {

  const [isSmallScreen] = useMediaQuery("(max-width: 1668px)");
  const [isLargeScreen] = useMediaQuery("(min-width: 2500px)");

  let characterSkills: Skill[] = []

  // Create dice pool for skills
  skills
    .filter(s => !s.name.includes("("))
    .forEach(s => {
      let name = s.name.replace("Knowledge: ", "");
      let rank = getRank(name, profileSkills, minions);
      let stat = characteristics[s.characteristic];
      characterSkills.push(new Skill(name, rank, stat));
  });

  // Show toast on mouse-click (for now)
  const toast = useToast()
  const showToast = (skill: string) => {
    toast({
      title: `Rolling ${capitalize(skill)}`,
      description: `Rolled ${Math.ceil(Math.random() * 12)}`
    })
  }

  if (isSmallScreen)
    characterSkills = characterSkills.filter(s => s.rank > 0)


  return (
    <>
      <HStack justifyContent="space-between" paddingBottom="5px">
        <Heading size="md" as="h2" color="white">Skills</Heading>
      </HStack>
      <Divider/>
      <SimpleGrid spacingX={3} columns={isSmallScreen ? 1 : isLargeScreen ? 3 : 2}>
        {characterSkills.map(skill => (
          <SkillItem
            name={skill.name}
            rank={skill.rank}
            pool={skill.pool}
            onClick={() => showToast(skill.name)}
            abbreviated={isSmallScreen}
          />
        ))}
      </SimpleGrid>
    </>
  );
};

class Skill {
  name: string;
  rank: number;
  characteristic: number;
  pool: DicePool;

  constructor(name: string, rank: number, characteristic: number) {
    this.name = name;
    this.rank = rank;
    this.characteristic = characteristic;
    this.pool = new DicePool(rank, characteristic);
  }
}

function isRecord(obj: unknown): obj is Record<string, number> {
  return (typeof obj === 'object' && obj !== null && !Array.isArray(obj));
}

function getRank(skillName: string, profileSkills: Record<string, number> | string[], minions: number | undefined){
  if (isRecord(profileSkills))
    return profileSkills[skillName] || 0;
  else if (minions !== undefined) {
    return profileSkills.includes(skillName) ? minions : 0;
  } else
    console.warn("Unable to find rank for ", skillName);
  return 0;
}

export default SkillList;
