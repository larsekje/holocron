import React, {ReactNode} from 'react';
import {Table, TableProps} from "@chakra-ui/react";
import {parseChildren} from "./parser";

type ParsedTableProps = TableProps & {
  parser?: (content: string) => ReactNode;
};

const ParsedTable = ({children, parser, ...rest}: ParsedTableProps) => {
  const parsedChildren = parseChildren(children);
  return (<Table {...rest}>{parsedChildren}</Table>);
};

export default ParsedTable;
