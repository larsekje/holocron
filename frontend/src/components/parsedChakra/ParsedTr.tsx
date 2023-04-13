import React, {ReactNode} from 'react';
import {TableRowProps, Tr} from "@chakra-ui/react";
import {parseChildren} from "./parser";

type ParsedTableRowProps = TableRowProps & {
  parser?: (content: string) => ReactNode;
};

const ParsedTr = ({children, parser, ...rest}: ParsedTableRowProps) => {
  const parsedChildren = parseChildren(children);
  return (<Tr {...rest}>{parsedChildren}</Tr>);
};

export default ParsedTr;
