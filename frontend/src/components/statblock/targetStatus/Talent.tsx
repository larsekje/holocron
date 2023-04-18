import React from 'react';
import {Text, Tooltip} from "@chakra-ui/react";
import {statify} from "@/utils";
import {useDataStore} from "@/dataStore";

interface Props {
  talent: string;
}

const Talent = ({talent}: Props) => {
  const getTalent = useDataStore(state => state.getTalent);

  let ranked = talent.match(/\s(\d+)$/);
  let ranks = ranked ? ranked[1] : 1;

  let description = getTalent(talent)?.description;
  description = statify(description, "", ranks);

  return (
    <Tooltip hasArrow placement="top" label={description} openDelay={400}>
      <Text userSelect="none" cursor="pointer" fontSize='sm' color="black">{talent}</Text>
    </Tooltip>
  );
};

export default Talent;
