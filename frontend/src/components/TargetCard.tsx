import React from 'react';
import {
  Card,
  CardBody,
  HStack,
  Text,
  Square,
  IconButton,
  PopoverHeader,
  PopoverContent,
  Button, Tooltip, Progress, ProgressLabel, Box
} from "@chakra-ui/react";
import {SearchIcon, LockIcon, MoonIcon, DragHandleIcon} from "@chakra-ui/icons";

interface Props {
  maxWounds: number;
  currentWounds: number;
}

const TargetCard = ({maxWounds, currentWounds}: Props) => {

  const woundRatio = currentWounds / maxWounds * 100;

  return (
    <Card overflow='hidden' height='35px'>
      <CardBody padding='0'>
        <HStack justifyContent='space-between' spacing='0'>
          <HStack spacing='0px'>
            <Square size='35px' bg='tomato'></Square>
            <Square size='35px' bg='coral'></Square>
            <Square size='35px' bg='gold'></Square>
          </HStack>
          <Box display='flex' height='35px' bg='green.300' w='100%'>
            <Progress width='100%' height='35px' colorScheme='green' bg='red' value={woundRatio}/>
            <HStack padding='0 5px' spacing='0px' justifyContent='space-between' width='calc(100% - 125px)' position='absolute' color='white'>
              <Text as='b' lineHeight='35px'>Imperial Stormtrooper</Text>
              <Box>
                <Text as='b' fontSize='lg' lineHeight='35px'>{currentWounds}</Text>
                <Text as='b' fontSize='sm' color='tomato' lineHeight='35px'>/{maxWounds}</Text>
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
