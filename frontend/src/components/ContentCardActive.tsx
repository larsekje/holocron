import React from 'react';
import {Text} from "@chakra-ui/react";
import ContentCard from "./ContentCard";
import StatusCard from "./statuscard/StatusCard";

const ContentCardActive = () => {
  return (
    <ContentCard heading={'Active'}>
      <Text>
        <StatusCard/>
      </Text>
    </ContentCard>
  );
};

export default ContentCardActive;
