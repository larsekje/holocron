import React from 'react';
import SkillItem from "./SkillItem";
import {SimpleGrid} from "@chakra-ui/react";
import skillMap from "@/skillMap";
import {Skill} from "@components/statblock/StatSheet";
import {DicePool} from "./DicePool";

interface Props {
  skills: Skill[];
  characteristics;
  currentCharacteristic: string;
}

function getRank(skill: string, skills: Skill[]): number {
  const match = skills.filter(foo => skill.toLowerCase() === foo.name.toLowerCase());

  if (match.length > 0)
    return match[0].rank;
  return 0;
}

function getPool(skill: string, skills: Skill[], characteristics): DicePool {
  const characteristicName = skillMap[skill];

  const skillRank = getRank(skill, skills);
  const characteristicRank = characteristics[characteristicName];

  const yellowDie = Math.min(skillRank, characteristicRank);
  const greenDie = Math.max(skillRank, characteristicRank) - yellowDie;
  return new DicePool(greenDie, yellowDie);
}

const SkillList = ({skills, characteristics, currentCharacteristic}: Props) => {

  const allSkills = Object.keys(skillMap)

  return (
    <SimpleGrid columns={3} spacingX={2}>
      {allSkills.map((skill) => (
        <SkillItem
          name={skill}
          rank={getRank(skill, skills)}
          pool={getPool(skill, skills, characteristics)}
          currentCharacteristic={currentCharacteristic}
        />
      ))}
    </SimpleGrid>
  );
};

export default SkillList;
