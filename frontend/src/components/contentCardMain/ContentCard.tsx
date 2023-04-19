import React, {ReactElement, ReactNode} from 'react';
import {Box, ButtonProps, Card, CardBody, CardHeader, Heading, HStack} from "@chakra-ui/react";
import {IconProps, SearchIcon} from "@chakra-ui/icons";
import useDisableArrowKeyScrolling from "@/useDisableArrowKeyScrolling";


interface Props {
  heading: string;
  children?: ReactNode;
  buttons?: ReactElement<ButtonProps>[];
  icon?: ReactElement<IconProps>;
}

const ContentCard = ({heading, children, buttons, icon}: Props) => {
  useDisableArrowKeyScrolling();

  icon = icon || <SearchIcon/>;
  const clonedIcon = React.cloneElement(icon, {color: 'white'});

  return (
    <Box height="100%">
      <Card bg='#2A2C30' borderRadius='md' height="100%" overflow="hidden">
        <CardHeader height='50px'  display='flex'>
          <HStack justifyContent='space-between' width="100%">
            <HStack>
              {clonedIcon}
              <Heading color='white' size='md'>{heading}</Heading>
            </HStack>
            <HStack>
              {buttons && buttons.map(button => button)}
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody bg='#33363C' overflowY="auto" padding='10px'>
          {children}
        </CardBody>
      </Card>
    </Box>
  );
};

export default ContentCard;
