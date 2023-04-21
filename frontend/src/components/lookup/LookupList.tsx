import React from 'react';
import {Divider, List} from "@chakra-ui/react";
import LookupItem from "@components/lookup/LookupItem";
import {Talent} from "@/dataStore";

interface Props {
  talents: Talent[]
}

const LookupList = ({talents}: Props) => {

  talents = talents.slice(0, 10);

  if(talents.length === 0) return null;

  return (
    <>
      <Divider marginBottom="10px"/>

      <List spacing="2" overflowY="auto">
        {talents.map(t => <LookupItem talent={t}/>)}
      </List>
    </>
  );
};

export default LookupList;
