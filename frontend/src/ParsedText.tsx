import React from 'react';
import {Text} from "@chakra-ui/react";
import ClickableText from "./components/ClickableText";
import {Interweave} from "interweave";
import {symbolise} from "./utils";

interface Props {
  text: string
}

function replaceKeywords(string: string): React.ReactNode[] {
  const parts = string.split(/(:\w+:)/g);
  return parts.map((part, index) => {
    if (part === ':average:') {
      return <ClickableText/>;
    }
    return <Interweave content={symbolise(part)}/>;
  });
}

const ParsedText = ({text}: Props) => {
  return (
    <Text color="white">
      {replaceKeywords(text)}
    </Text>
  );
};

export default ParsedText;
