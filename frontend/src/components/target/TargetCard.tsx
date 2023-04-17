import React from 'react';
import {
  Card,
  CardBody,
  HStack,
  Text,
  Square,
  Progress, Box
} from "@chakra-ui/react";
import AdversaryTypeBadge from "./AdversaryTypeBadge";
import {Target} from "@/target";

interface Props {
  key: string;
  target: Target;
  onClick: () => void;
}

const TargetCard = ({target, onClick}: Props) => {
  const isSelected = false;
  const isActive = false;

  const currentWounds = target.health;
  const woundRatio = currentWounds / target.template.derived.wounds * 100;

  return (
    <Card overflow='hidden' shadow={isActive ? "outline" : ""} height='35px' width='100%' outline='1px' variant={isSelected ? 'outline' : ''} onClick={onClick}>
      <CardBody padding='0'>
        <HStack justifyContent='space-between' spacing='0'>
          <HStack spacing='0px'>
            <Square size='35px' bg='tomato'>{isActive ? "A" : "I"}</Square>
            <Square size='35px' bg='coral'><AdversaryTypeBadge type={target.template.type}/></Square>
            <Square size='35px' bg='gold'>{target.initiative}</Square>
          </HStack>
          <Box display='flex' height='35px' bg='green.300' w='100%'>
            <Progress width='100%' height='35px' colorScheme='green' bg='#25272a' value={woundRatio}/>
            <HStack padding='0 5px' spacing='0px' justifyContent='space-between' width='calc(100% - 125px)' position='absolute' color='white'>
              <Text userSelect='none' as='b' lineHeight='35px'>{target.template.name}</Text>
              <Box>
                <Text userSelect='none' as='b' fontSize='lg' lineHeight='35px'>{currentWounds}</Text>
                <Text userSelect='none' as='b' fontSize='sm' color='white' lineHeight='35px'>/{target.template.derived.wounds}</Text>
              </Box>
            </HStack>
          </Box>
          <Box w='20px' h='35px' bg='gold'></Box>
        </HStack>



      </CardBody>
    </Card>
  );
};

export default TargetCard;
