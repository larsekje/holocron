import React from 'react';
import {Weapon} from "@/dataStore";
import {HStack, SimpleGrid, Text, Tooltip, VStack} from "@chakra-ui/react";
import {DicePool, DicePoolC} from "@components/statblock/DicePool";
import WeaponQuality from "@components/statblock/WeaponQuality";
import {Adversary} from "@/adversary";
import {getRank} from "@components/statblock/SkillList";
import skills from "@/assets/data/skills.json";

interface Props {
  weapon: Weapon
  profileSkills: Record<string, number> | string[];
  characteristics: Adversary["characteristics"];
  minions?: number;
}

const WeaponStat = ({weapon, profileSkills, characteristics, minions}: Props) => {
  const pool = getPool(weapon.skill, profileSkills, characteristics, minions);

  let damage;
  if (weapon.plusDamage)
    damage = (
      <Tooltip label={`Base damage ${weapon.plusDamage}, brawn ${characteristics.Brawn}`}>
        <Text fontSize="2xl" color="white">{characteristics.Brawn + weapon.plusDamage}</Text>
      </Tooltip>
    )
  else if (weapon.damage)
    damage = (<Text fontSize="2xl" color="white">{weapon.damage}</Text>)

  return (
    <>
      <HStack margin="10px 5px">
        <VStack paddingRight="10px" spacing="0" width="80px">
          <Text fontSize="2xl" color="white">{damage}</Text>
          <Text fontSize="8px" color="white">DMG</Text>
        </VStack>

        <VStack alignItems="left" width="100%" spacing="0">
          <Text color="white" fontSize="md">{weapon?.name}</Text>
          <Text color="white" fontSize="xs">{weapon?.range}, {weapon?.skill}, Critical {weapon?.critical}</Text>
        </VStack>

        {<SimpleGrid columns={2} width="100%">
          {weapon?.qualities.map(q => <WeaponQuality quality={q}/>)}
        </SimpleGrid>}
        <DicePoolC pool={pool}/>
      </HStack>

    </>
  );
};

export function getPool(skill: string,
                 profileSkills: Record<string, number> | string[],
                 characteristics: Adversary["characteristics"],
                 minions: number | undefined) {

  const skillRank = getRank(skill, profileSkills, minions)

  const skillCharacteristic = skills.find(t => t.name === skill)?.characteristic || 0;
  const characteristic = characteristics[skillCharacteristic];

  return new DicePool(skillRank, characteristic)
}

export default WeaponStat;
