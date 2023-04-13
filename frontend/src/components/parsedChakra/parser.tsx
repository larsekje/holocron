import React from "react";
import ClickableText from "../ClickableText";
import {Interweave} from "interweave";
import {symbolise} from "../../utils";
import {ListItem} from "@chakra-ui/react";
import ParsedListItem from "./ParsedListItem";

export function replaceKeywords(string: string): React.ReactNode[] {
  const parts = string.split(/(:\w+:)/g);
  return parts.map((part, index) => {
    if (part === ':average:') {
      return <ClickableText/>;
    }
    return <Interweave content={symbolise(part)}/>;
  });
}

export function parseChildren(children): React.ReactNode[] {

  // iterate each child and apply parsing only to strings
  return React.Children.map(children, (child) => {

    if (typeof child === "string")
      return replaceKeywords(child);

    if (React.isValidElement(child) && child.type === ListItem)
      return <ParsedListItem>{child.props.children}</ParsedListItem>;

    return child;
  });
}

