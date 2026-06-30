import React, {useState} from 'react';
import {Box, Flex, HStack, IconButton, Tooltip} from "@chakra-ui/react";
import {FaUsers, FaUserPlus} from "react-icons/fa";
import ContentCardOld from "@/ContentCardOld";
import TargetListOld from "@components/TargetListOld";
import MiniStatCard from "@components/target/MiniStatCard";
import AdversarySelector from "@components/adversaries/AdversarySelector";

const ContentCardTargetsOld = () => {
  const [isSelectorOpen, setSelectorOpen] = useState(false);

  const buttons = (
    <HStack spacing={2}>
      <Tooltip label="Add adversary">
        <IconButton
          aria-label="Add adversary"
          icon={<FaUserPlus/>}
          size="sm"
          variant="ghost"
          bg="transparent"
          // Icon a shade darker than the #2A2C30 header + a 1px light highlight
          // below → reads as engraved into the header, not a button.
          color="#191b1e"
          sx={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.07))' }}
          _hover={{ bg: 'transparent', color: 'whiteAlpha.800', filter: 'none' }}
          _active={{ bg: 'transparent' }}
          onClick={() => setSelectorOpen(true)}
        />
      </Tooltip>
    </HStack>
  );

  return (
    <>
      <ContentCardOld heading="Targets" buttons={buttons} icon={<FaUsers/>}>
        {/* Flex column lets MiniStatCard size to its content while the target
            list takes the remaining height and scrolls internally — without
            this, TargetListOld's h="100%" stacks on top of the mini card and
            forces the whole CardBody to scroll. */}
        <Flex direction="column" h="100%" minH={0}>
          <MiniStatCard/>
          <Box flex="1" minH={0} overflowY="auto">
            <TargetListOld/>
          </Box>
        </Flex>
      </ContentCardOld>
      <AdversarySelector isOpen={isSelectorOpen} onClose={() => setSelectorOpen(false)}/>
    </>
  );
};

export default ContentCardTargetsOld;
