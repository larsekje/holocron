import React from 'react';
import {HStack} from "@chakra-ui/react";
import {ReactComponent as Ability} from "@/assets/dice/ability.svg";
import {ReactComponent as Proficiency} from "@/assets/dice/proficiency.svg";

export class DicePool {
  green: number;
  yellow: number;

  // SWRPG pool construction: the higher of (rank, characteristic) sets the
  // number of dice; the lower of the two upgrades that many Ability dice to
  // Proficiency. So yellow = min(rank, char), green = max(rank, char) − yellow.
  constructor(skillRank: number, characteristic: number) {
    this.yellow = Math.min(skillRank, characteristic);
    this.green = Math.max(skillRank, characteristic) - this.yellow;
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
