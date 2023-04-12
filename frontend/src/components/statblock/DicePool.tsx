import React from 'react';

import {ReactComponent as Ability} from "../../assets/dice/ability.svg";
import {ReactComponent as Proficiency} from "../../assets/dice/proficiency.svg";
import {HStack} from "@chakra-ui/react";

export class DicePool {

  green: number;
  yellow: number;

  constructor(skillRank: number, characteristic: number) {
    this.green = skillRank;
    this.yellow = characteristic;
  }
}

interface Props {
  pool: DicePool;
  width?: number;
}

export const DicePoolC = ({pool, width=12}: Props) => {
  const ability = Array.from({length: pool.green}, () => <Ability width={width}/>)
  const proficiency = Array.from({length: pool.yellow}, () => <Proficiency width={width}/>)

  return (
    <HStack spacing="2px" height="15px">
      {ability}
      {proficiency}
    </HStack>
  );
};
