import React, {ReactNode} from 'react';
import {Box, Card, CardBody, CardHeader, Heading, HStack, Icon} from "@chakra-ui/react";
import {SearchIcon} from "@chakra-ui/icons";

interface Props {
    heading: string;
    children?: ReactNode;
    buttons?: ReactNode;
    icon?: ReactNode;
}

const ContentCardOld = ({heading, children, buttons, icon}: Props) => {
    return (
        <Box height="100%" minH={0}>
            <Card
                bg='#2A2C30'
                borderRadius='md'
                height="100%"
                overflow="hidden"
                display="flex"
                flexDirection="column"
            >
                <CardHeader height='50px' display='flex' flexShrink={0}>
                    <HStack justifyContent='space-between' width="100%">
                        <HStack>
                            <Icon as={() => <>{icon ?? <SearchIcon color="white"/>}</>} color="white"/>
                            <Heading color='white' size='md'>{heading}</Heading>
                        </HStack>
                        {buttons && <HStack>{buttons}</HStack>}
                    </HStack>
                </CardHeader>
                <CardBody bg='#33363C' overflowY="auto" padding='10px' flex="1" minH={0}>
                    {children}
                </CardBody>
            </Card>
        </Box>
    );
};

export default ContentCardOld;
