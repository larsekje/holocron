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
  abbreviated?: boolean;
}

const SkillList = ({profileSkills, characteristics, minions, abbreviated=false}: Props) => {
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

  if (abbreviated)
    characterSkills = characterSkills.filter(s => s.rank > 0)

  return (
    <SimpleGrid columns={3} spacingX={3}>
      {characterSkills.map(skill => (
        <SkillItem
          name={skill.name}
          rank={skill.rank}
          pool={skill.pool}
          onClick={() => showToast(skill.name)}
          abbreviated={abbreviated}
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
