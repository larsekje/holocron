import React from 'react';
import {Text} from "@chakra-ui/react";
import ContentCard from "./ContentCard";
import StatusCard from "./statuscard/StatusCard";

const ContentCardActive = () => {
  return (
    <ContentCard heading={'Active'}>
      <Text>
        <StatusCard/>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Debitis ducimus esse facilis libero molestias
        necessitatibus obcaecati pariatur, porro provident qui quisquam quos unde vitae! Alias cumque delectus
        fugiat sunt vitae?
      </Text>
    </ContentCard>
  );
};

export default ContentCardActive;
