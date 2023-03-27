import React from 'react';
import {Highlight, Text} from "@chakra-ui/react";

interface Props {
  a: string;
  b: number;
}

const ListItemHighlight = ({a, b}: Props) => {
  return (
    <Text color='white'>
      <b>{a}: </b>{b}
    </Text>
  );
};

export default ListItemHighlight;
