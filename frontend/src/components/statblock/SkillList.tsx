import React from 'react';
import SkillItem from "./SkillItem";
import {HStack, VStack} from "@chakra-ui/react";
import skillMap from "../../skillMap";

interface Props {
  currentCharacteristic: string;
}

function splitArray<T>(arr: T[], n: number): T[][] {
  const size = Math.ceil(arr.length / n);
  const result = new Array(n);
  for(let i= 0; i < n; i++){
    result[i] = arr.slice(i * size, (i+1) * size);
  }

  return result;
}

const SkillList = ({currentCharacteristic}: Props) => {


  const skills = Object.keys(skillMap)
  const splitSkills = splitArray(skills, 3);

  return (
    <HStack justifyContent='space-between' alignItems='top'>
      // for each column
      {splitSkills.map((splitSkill) => (
        <VStack spacing='0' alignItems='left'>
          // for each item in column
          {splitSkill.map((skill) => (
            <SkillItem
              name={skill}
              rank={2}
              currentCharacteristic={currentCharacteristic}
            />
          ))}
        </VStack>
      ))}
    </HStack>
  );
};

export default SkillList;
