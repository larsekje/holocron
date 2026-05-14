import React from 'react';
import { Text, Tooltip } from "@chakra-ui/react";
import { talentName } from "@/utils/talents";

interface Props {
  talent: unknown;
}

/**
 * Displays a talent with a tooltip showing its description
 */
const Talent = ({ talent }: Props) => {
  // Normalise first — talent entries aren't always bare strings.
  const name = talentName(talent);
  // Extract ranks from talent name if present (e.g., "Adversary 2")
  const ranked = name.match(/\s(\d+)$/);
  const ranks = ranked ? ranked[1] : 1;

  // In the original implementation this used a dataStore to get talent descriptions
  // Since we don't have that yet, we'll use a placeholder description
  const description = `Description for ${name} (Rank ${ranks})`;

  return (
    <Tooltip hasArrow placement="top" label={description} openDelay={400}>
      <Text userSelect="none" cursor="pointer" fontSize='sm' color="black">{name}</Text>
    </Tooltip>
  );
};

export default Talent;
