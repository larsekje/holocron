import React, {ReactNode} from 'react';
import {Text, TextProps} from "@chakra-ui/react";
import ClickableText from "./components/ClickableText";
import {Interweave} from "interweave";
import {symbolise} from "./utils";

type ParsedTextProps = TextProps & {
  parser?: (content: string) => ReactNode;
};

function replaceKeywords(string: string): React.ReactNode[] {
  const parts = string.split(/(:\w+:)/g);
  return parts.map((part, index) => {
    if (part === ':average:') {
      return <ClickableText/>;
    }
    return <Interweave content={symbolise(part)}/>;
  });
}

const ParsedText = ({children, parser, ...rest}: ParsedTextProps) => {

  // iterate each child and apply parsing only to strings
  const parsedChildren = React.Children.map(children, (child) => {
    if (typeof child === "string")
      return replaceKeywords(child);
    return child;
  });

  return (<Text {...rest}>{parsedChildren}</Text>);
};

export default ParsedText;
