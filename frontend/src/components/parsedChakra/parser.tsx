import React from "react";
import ClickableText from "../ClickableText";
import {Interweave} from "interweave";
import {symbolise} from "../../utils";
import {List, ListItem, Tbody, Td, Tr} from "@chakra-ui/react";
import ParsedListItem from "./ParsedListItem";
import ParsedTd from "./ParsedTd";
import ParsedTr from "./ParsedTr";
import ParsedTbody from "./ParsedTbody";
import ParsedList from "./ParsedList";

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

    if (React.isValidElement(child) && child.type === Tr)
      return <ParsedTr>{child.props.children}</ParsedTr>;

    if (React.isValidElement(child) && child.type === Td)
      return <ParsedTd>{child.props.children}</ParsedTd>;

    if (React.isValidElement(child) && child.type === Tbody)
      return <ParsedTbody>{child.props.children}</ParsedTbody>;

    if (React.isValidElement(child) && child.type === List)
      return <ParsedList>{child.props.children}</ParsedList>;

    return child;
  });
}

