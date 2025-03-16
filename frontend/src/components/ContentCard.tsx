import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  HStack,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

interface ContentCardProps {
  heading: string;
  children: React.ReactNode;
  buttons?: React.ReactNode;
  icon?: React.ReactNode;
  footerContent?: React.ReactNode;
}

/**
 * A reusable card component with a consistent style for the application
 */
const ContentCard: React.FC<ContentCardProps> = ({
  heading,
  children,
  buttons,
  icon = <InfoIcon />,
  footerContent,
}) => {
  return (
    <Box height="100%">
      <Card bg="#26292d" borderRadius="md" height="100%" overflow="hidden">
        <CardHeader height="50px" display="flex">
          <HStack justifyContent="space-between" width="100%">
            <HStack>
              <Icon as={() => icon} color="gray.300" />
              <Heading size="sm" color="gray.200">
                {heading}
              </Heading>
            </HStack>
            {buttons && <HStack>{buttons}</HStack>}
          </HStack>
        </CardHeader>
        <CardBody pt={0} pb={2} overflow="auto">
          {children}
        </CardBody>
        {footerContent && (
          <CardFooter pt={0} pb={2}>
            {footerContent}
          </CardFooter>
        )}
      </Card>
    </Box>
  );
};

export default ContentCard;
