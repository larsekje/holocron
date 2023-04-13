import React, {ReactNode} from 'react';
import {Text, TextProps} from "@chakra-ui/react";
import {parseChildren} from "./parser";

type ParsedTextProps = TextProps & {
  parser?: (content: string) => ReactNode;
};

const ParsedText = ({children, parser, ...rest}: ParsedTextProps) => {
  const parsedChildren = parseChildren(children);
  return (<Text {...rest}>{parsedChildren}</Text>);
};

export default ParsedText;
