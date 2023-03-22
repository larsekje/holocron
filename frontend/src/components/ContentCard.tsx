import React, {ReactElement, ReactNode} from 'react';
import {Box, ButtonProps, Card, CardBody, CardHeader, Heading, HStack} from "@chakra-ui/react";
import {SearchIcon} from "@chakra-ui/icons";


interface Props {
  heading: string;
  children?: ReactNode;
  buttons?: ReactElement<ButtonProps>[];
}

const ContentCard = ({heading, children, buttons}: Props) => {
  return (
    <Box height="100%">
      <Card bg='#26292d' borderRadius='md' height="100%">
        <CardHeader height='50px'  display='flex'>
          <HStack justifyContent='space-between' width="100%">
            <HStack>
              <SearchIcon color='white'/>
              <Heading color='white' size='md'>{heading}</Heading>
            </HStack>
            <HStack>
              {buttons && buttons.map(button => button)}
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody bg='#33363c' overflowY="auto" padding='10px'>
          {children}
        </CardBody>
      </Card>
    </Box>
  );
};

export default ContentCard;
