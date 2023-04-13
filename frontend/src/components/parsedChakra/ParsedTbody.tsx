import React, {ReactNode} from 'react';
import {TableBodyProps, Tbody} from "@chakra-ui/react";
import {parseChildren} from "./parser";

type ParsedTableBodyProps = TableBodyProps & {
  parser?: (content: string) => ReactNode;
};

const ParsedTbody = ({children, parser, ...rest}: ParsedTableBodyProps) => {
  const parsedChildren = parseChildren(children);
  return (<Tbody {...rest}>{parsedChildren}</Tbody>);
};

export default ParsedTbody;
