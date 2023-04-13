import React, {ReactNode} from 'react';
import {ListItem, ListItemProps} from "@chakra-ui/react";
import {parseChildren} from "./parser";

type ParsedListItemProps = ListItemProps & {
  parser?: (content: string) => ReactNode;
};

const ParsedListItem = ({children, parser, ...rest}: ParsedListItemProps) => {
  const parsedChildren = parseChildren(children);
  return (<ListItem {...rest}>{parsedChildren}</ListItem>);
};

export default ParsedListItem;
