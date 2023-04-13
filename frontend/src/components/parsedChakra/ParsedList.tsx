import React, {ReactNode} from 'react';
import {List, ListProps} from "@chakra-ui/react";
import {parseChildren} from "./parser";

type ParsedListProps = ListProps & {
  parser?: (content: string) => ReactNode;
};

const ParsedList = ({children, parser, ...rest}: ParsedListProps) => {
  const parsedChildren = parseChildren(children);
  return (<List {...rest}>{parsedChildren}</List>);
};

export default ParsedList;
