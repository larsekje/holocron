import React from 'react';
import SkillItem from "./SkillItem";
import {HStack, VStack} from "@chakra-ui/react";
import skillMap from "../../skillMap";
import {splitArray} from "../../utils";

interface Props {
  currentCharacteristic: string;
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
