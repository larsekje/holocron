import React, {ReactNode} from 'react';
import {List, Table, Text} from "@chakra-ui/react";
import {Interweave} from "interweave";
import {symbolise} from "@/utils/statify";

interface ParsedProps {
  children: ReactNode | ReactNode[];
}

type WithParsedProps<C extends React.ComponentType<any>> = {
  [P in keyof JSX.LibraryManagedAttributes<C, React.ComponentProps<C>>]:
    JSX.LibraryManagedAttributes<C, React.ComponentProps<C>>[P];
} & ParsedProps & React.Attributes;

function withParsed<C extends React.ComponentType<any>>(WrappedComponent: C) {
  return function ParsedComponent(props: WithParsedProps<C>) {
    const {children, ...rest} = props;
    const parsedChildren = parseChildren(children);
    const wrappedComponentProps = {
      ...rest,
      children: parsedChildren,
    } as React.ComponentProps<C>;
    return <WrappedComponent {...wrappedComponentProps}/>;
  };
}

function parseChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return replaceKeywords(child);
    } else if (React.isValidElement(child)) {
      const {children: nestedChildren, ...rest} = (child.props ?? {}) as Record<string, unknown> & {children?: ReactNode};
      const parsedChildren = parseChildren(nestedChildren);
      return React.cloneElement(child as React.ReactElement, rest as React.Attributes, parsedChildren);
    }
    return child;
  });
}

function replaceKeywords(input: string): React.ReactNode[] {
  const parts = input.split(/(:\w+:)/g);
  return parts.map((part, index) => (
    <Interweave key={index} content={symbolise(part)}/>
  ));
}

export const ParsedList = withParsed(List);
export const ParsedTable = withParsed(Table);
export const ParsedText = withParsed(Text);
