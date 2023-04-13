import React, {ReactNode} from 'react';
import {TableCellProps, Td} from "@chakra-ui/react";
import {parseChildren} from "./parser";

type ParsedTableCellProps = TableCellProps & {
  parser?: (content: string) => ReactNode;
};

const ParsedTd = ({children, parser, ...rest}: ParsedTableCellProps) => {
  const parsedChildren = parseChildren(children);
  return (<Td {...rest}>{parsedChildren}</Td>);
};

export default ParsedTd;
