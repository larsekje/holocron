import React from 'react';
import {Text} from "@chakra-ui/react";
import ContentCard from "./ContentCard";

const ContentCardActive = () => {
  return (
    <ContentCard heading={'Active'}>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Debitis ducimus esse facilis libero molestias
        necessitatibus obcaecati pariatur, porro provident qui quisquam quos unde vitae! Alias cumque delectus
        fugiat sunt vitae?
      </Text>
    </ContentCard>
  );
};

export default ContentCardActive;
