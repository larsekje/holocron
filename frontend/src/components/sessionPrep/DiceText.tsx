import React from 'react';
import { Box } from '@chakra-ui/react';

/** Narrative-dice glyphs that may appear inline in authored prose:
 * ♦ = Difficulty (purple), ■ = Boost (light blue). */
const GLYPH_COLOR: Record<string, string> = {
  '♦': '#c9a7ee',
  '■': '#7fc8e8',
};

/**
 * DiceText — renders a prose fragment with inline narrative-dice glyphs
 * coloured (runs of the same glyph stay one span, so "♦♦" reads as one pool).
 * Used by the play surface's "angles" lines and the room reference cards.
 */
const DiceText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/([♦■]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        const color = GLYPH_COLOR[part[0]];
        return color ? (
          <Box key={i} as="span" color={color} letterSpacing="1px">
            {part}
          </Box>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

export default DiceText;
