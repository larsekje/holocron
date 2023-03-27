import React from 'react';
import SkillItem from "./SkillItem";
import {Table, Td, Tr, HStack, VStack} from "@chakra-ui/react";

interface Props {
}

const SkillList = ({}: Props) => {
  return (

    <HStack justifyContent='space-between'>
      <VStack spacing='0'>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2} group={true}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
      </VStack>
      <VStack spacing='0'>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2} group={true}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
      </VStack>
      <VStack spacing='0'>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
        <SkillItem name={'Athletics'} rank={2}/>
      </VStack>

    </HStack>

  );
};

export default SkillList;
