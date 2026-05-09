import React from 'react';
import {HStack} from "@chakra-ui/react";
import {ReactComponent as Ability} from "@/assets/dice/ability.svg";
import {ReactComponent as Proficiency} from "@/assets/dice/proficiency.svg";

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

const DicePoolOld = ({pool, width = 12}: Props) => {
  const ability = Array.from({length: pool.green}, (_, i) => <Ability key={`a${i}`} width={width}/>);
  const proficiency = Array.from({length: pool.yellow}, (_, i) => <Proficiency key={`p${i}`} width={width}/>);

  return (
    <HStack spacing="2px" height="15px">
      {ability}
      {proficiency}
    </HStack>
  );
};

export default DicePoolOld;
