import React from "react";
import { Box, HStack, keyframes, Text } from "@chakra-ui/react";
import type { PlayerRoll } from "@/sync/snapshot";
import "./swrpgSymbols.css";

const pop = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;

// PUA glyphs in the sw-rpg-icons font (see src/assets/sass/_variables.sass).
const GLYPH = {
  success: "",
  failure: "",
  advantage: "",
  threat: "",
  triumph: "",
  despair: "",
} as const;

type SymKind = keyof typeof GLYPH;

const COLOR: Record<SymKind, string> = {
  success: "#f4d03f",
  failure: "#e2655a",
  advantage: "#5fd38a",
  threat: "#e0913f",
  triumph: "#f7d24b",
  despair: "#b07be0",
};

const Symbols: React.FC<{ kind: SymKind; count: number }> = ({ kind, count }) => {
  if (count <= 0) return null;
  return (
    <Box
      as="span"
      className="swrpg-symbol"
      color={COLOR[kind]}
      fontSize={["2xl", "3xl"]}
      letterSpacing="2px"
      textShadow={`0 0 10px ${COLOR[kind]}66`}
    >
      {GLYPH[kind].repeat(count)}
    </Box>
  );
};

/** A GM-revealed dice result, rendered as actual SWRPG symbol glyphs (3 success
 * reads as three success pips, not "3 s"). Keyed by `at` so each reveal
 * re-animates. */
const PlayerRollReveal: React.FC<{ roll: PlayerRoll }> = ({ roll }) => {
  const groups: React.ReactNode[] = [];
  if (roll.netSuccess > 0)
    groups.push(<Symbols key="s" kind="success" count={roll.netSuccess} />);
  else if (roll.netSuccess < 0)
    groups.push(<Symbols key="f" kind="failure" count={-roll.netSuccess} />);
  if (roll.netAdvantage > 0)
    groups.push(<Symbols key="a" kind="advantage" count={roll.netAdvantage} />);
  else if (roll.netAdvantage < 0)
    groups.push(<Symbols key="t" kind="threat" count={-roll.netAdvantage} />);
  if (roll.triumph > 0)
    groups.push(<Symbols key="tr" kind="triumph" count={roll.triumph} />);
  if (roll.despair > 0)
    groups.push(<Symbols key="de" kind="despair" count={roll.despair} />);

  const nothing = groups.length === 0 && !roll.poly;

  return (
    <Box
      key={roll.at}
      animation={`${pop} 0.35s ease-out`}
      px={[4, 6]}
      py={[2, 3]}
      borderRadius="lg"
      bg="rgba(15,17,22,0.9)"
      borderWidth="1px"
      borderColor="#d39939"
      boxShadow="0 6px 24px rgba(211,153,57,0.35)"
      maxW="92vw"
      pointerEvents="none"
    >
      {roll.label && (
        <Text fontSize="xs" color="whiteAlpha.600" textAlign="center" letterSpacing="0.12em" mb={1}>
          {roll.label.toUpperCase()}
        </Text>
      )}
      <HStack spacing={[3, 4]} justify="center" wrap="wrap">
        {roll.poly && (
          <Text fontSize={["lg", "xl"]} fontWeight="bold" color="#cbd5e1">
            {roll.poly.total}
            {roll.poly.values.length > 1 && (
              <Text as="span" fontSize="sm" color="whiteAlpha.600">
                {" "}
                ({roll.poly.values.join(", ")})
              </Text>
            )}
          </Text>
        )}
        {groups}
        {nothing && (
          <Text fontSize="md" color="#9aa3b2">
            No net result
          </Text>
        )}
      </HStack>
    </Box>
  );
};

export default PlayerRollReveal;
