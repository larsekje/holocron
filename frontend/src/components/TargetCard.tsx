import React from 'react';
import {
  Card,
  CardBody,
  HStack,
  Text,
  Square,
  Progress, Box
} from "@chakra-ui/react";
import {Target} from "./ContentCardTargets";

interface Props {
  target: Target;
  currentWounds?: number;
}

const TargetCard = ({target, currentWounds=target.wt}: Props) => {

  const woundRatio = currentWounds / target.wt * 100;

  return (
    <Card overflow='hidden' height='35px' width='100%' outline='1px' outlineColor='tomato'>
      <CardBody padding='0'>
        <HStack justifyContent='space-between' spacing='0'>
          <HStack spacing='0px'>
            <Square size='35px' bg='tomato'></Square>
            <Square size='35px' bg='coral'></Square>
            <Square size='35px' bg='gold'></Square>
          </HStack>
          <Box display='flex' height='35px' bg='green.300' w='100%'>
            <Progress width='100%' height='35px' colorScheme='green' bg='#25272a' value={woundRatio}/>
            <HStack padding='0 5px' spacing='0px' justifyContent='space-between' width='calc(100% - 125px)' position='absolute' color='white'>
              <Text as='b' lineHeight='35px'>{target.name}</Text>
              <Box>
                <Text as='b' fontSize='lg' lineHeight='35px'>{currentWounds}</Text>
                <Text as='b' fontSize='sm' color='white' lineHeight='35px'>/{target.wt}</Text>
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
