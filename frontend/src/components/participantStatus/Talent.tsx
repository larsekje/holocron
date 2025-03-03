import React from 'react';
import { Text, Tooltip } from "@chakra-ui/react";

interface Props {
  talent: string;
}

/**
 * Displays a talent with a tooltip showing its description
 */
const Talent = ({ talent }: Props) => {
  // Extract ranks from talent name if present (e.g., "Adversary 2")
  const ranked = talent.match(/\s(\d+)$/);
  const ranks = ranked ? ranked[1] : 1;

  // In the original implementation this used a dataStore to get talent descriptions
  // Since we don't have that yet, we'll use a placeholder description
  const description = `Description for ${talent} (Rank ${ranks})`;

  return (
    <Tooltip hasArrow placement="top" label={description} openDelay={400}>
      <Text userSelect="none" cursor="pointer" fontSize='sm' color="black">{talent}</Text>
    </Tooltip>
  );
};

export default Talent;
