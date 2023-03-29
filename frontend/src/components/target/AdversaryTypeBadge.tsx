import React from 'react';
import {Text} from "@chakra-ui/react"

interface Props {
  type: string;
}

const AdversaryTypeBadge = ({type}: Props) => {

  if (type.toLowerCase() === 'minion')
    return (<Text>M</Text>);

  if (type.toLowerCase() === 'rival')
    return (<Text>R</Text>);

  if (type.toLowerCase() === 'nemesis')
    return (<Text>N</Text>);

  return (<Text>U</Text>)

};

export default AdversaryTypeBadge;
