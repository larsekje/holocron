import React from 'react';
import SkillItem from "./SkillItem";
import {SimpleGrid, useToast} from "@chakra-ui/react";
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

const SkillList = ({profileSkills, characteristics, minions}: Props) => {
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

  return (
    <SimpleGrid columns={3} spacingX={3}>
      {characterSkills.map(skill => (
        <SkillItem
          name={skill.name}
          rank={skill.rank}
          pool={skill.pool}
          onClick={() => showToast(skill.name)}
        />
      ))}
    </SimpleGrid>
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

export default SkillList;
