import React from 'react';
import {Box, Circle, Flex, HStack, Text, VStack} from '@chakra-ui/react';
import type {SpotlightDetail} from '@/state/spotlightStore';
import {renderSwrpgText} from '@/utils/swrpgText';
import {symbolise} from '@/utils/statify';
import {Interweave} from 'interweave';

// Read-only book-accurate stat block for Spotlight previews. Modeled on the FFG layout:
// continuous yellow characteristic strip with embedded white circles + brown ribbon labels,
// three octagonal derived-stat cells, paragraph blocks for Skills / Talents / Equipment.

const RIBBON_CLIP = "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)";
const TAB_CLIP = "polygon(15% 0%, 85% 0%, 100% 30%, 100% 70%, 85% 100%, 15% 100%, 0% 70%, 0% 30%)";
const FONT_DISPLAY = '"Trebuchet MS", "Helvetica Neue", Arial, sans-serif';

type CharacteristicEntry = [string, number];
const CHAR_KEYS = [
  ["Brawn", "BR"],
  ["Agility", "AG"],
  ["Intellect", "INT"],
  ["Cunning", "CUN"],
  ["Willpower", "WIL"],
  ["Presence", "PR"],
] as const;

interface Props {
  detail: SpotlightDetail | (Record<string, any> & {name: string});
}

const AdversaryBookSheet: React.FC<Props> = ({detail}) => {
  const d = detail as any;
  const characteristics: CharacteristicEntry[] = CHAR_KEYS
    .map(([full, abbr]) => [abbr, d.characteristics?.[full] ?? 2] as CharacteristicEntry);

  const derived = d.derived ?? {};
  const soak = derived.soak;
  const wt = derived.wounds;
  const st = derived.strain;
  const def = derived.defence ?? derived.defense;

  const skills = d.skills ?? {};
  const skillsList: Array<[string, number]> = Object.entries(skills)
    .filter(([, v]) => typeof v === "number" && (v as number) > 0)
    .map(([k, v]) => [k.replace(/^Knowledge:\s+/, "").trim(), v as number]);

  const talents: string[] = d.talents ?? [];
  const abilities: string[] = d.abilities ?? [];
  const gear: string[] = d.gear ?? [];
  const weapons = d.weapons ?? [];
  const description: string = d.description ?? "";
  const adversaryType: string | undefined = d.adversaryType;

  return (
    <VStack align="stretch" spacing={3}>
      {/* Heading line — name + tier in brackets, FaD-style olive heading colour */}
      <Box>
        <Text
          as="b"
          fontSize="md"
          letterSpacing="0.06em"
          textTransform="uppercase"
          color="#d39939"
          fontFamily={FONT_DISPLAY}
        >
          {d.name}
          {adversaryType && (
            <Text as="span" color="#9c6f25" ml={2}>
              [{adversaryType}]
            </Text>
          )}
        </Text>
      </Box>

      {/* Connected characteristic bar */}
      <Box position="relative" w="100%">
        {/* Continuous yellow band */}
        <Box
          position="absolute"
          top="13px"
          left="6px"
          right="6px"
          h="22px"
          bg="#d39939"
          borderTop="1px solid #1a1d24"
          borderBottom="1px solid #1a1d24"
        />
        <HStack spacing={0} align="stretch" justify="space-around" position="relative">
          {characteristics.map(([abbr, value]) => (
            <Flex key={abbr} direction="column" align="center" flex="1" minWidth={0}>
              <Box position="relative" w="100%" h="48px">
                <Circle
                  position="absolute"
                  top={0}
                  left="50%"
                  transform="translateX(-50%)"
                  size="46px"
                  bg="white"
                  border="2px solid #1a1d24"
                  boxShadow="0 1px 3px rgba(0,0,0,0.5)"
                >
                  <Text
                    fontWeight="extrabold"
                    fontSize="xl"
                    color="#1a1d24"
                    lineHeight="1"
                    fontFamily={FONT_DISPLAY}
                  >
                    {value}
                  </Text>
                </Circle>
              </Box>
              <Box
                bg="#7c3a2c"
                px={1}
                py="2px"
                w="100%"
                textAlign="center"
                style={{clipPath: RIBBON_CLIP}}
                mt="-2px"
              >
                <Text
                  as="b"
                  fontSize="9px"
                  letterSpacing="0.14em"
                  color="#fce7c8"
                  textTransform="uppercase"
                  noOfLines={1}
                >
                  {abbr === "BR" ? "Brawn"
                    : abbr === "AG" ? "Agility"
                    : abbr === "INT" ? "Intellect"
                    : abbr === "CUN" ? "Cunning"
                    : abbr === "WIL" ? "Willpower"
                    : "Presence"}
                </Text>
              </Box>
            </Flex>
          ))}
        </HStack>
      </Box>

      {/* Derived-stat row — three octagonal cells, the FFG pattern */}
      <HStack spacing={3} justify="center">
        <DerivedCell label="Soak Value" value={soak ?? "—"}/>
        <DerivedCell label="W. Threshold" value={wt ?? "—"}/>
        {st != null && st > 0 && <DerivedCell label="S. Threshold" value={st}/>}
        {Array.isArray(def) && <DerivedCell label="M / R Defense" value={`${def[0] ?? 0} | ${def[1] ?? 0}`}/>}
      </HStack>

      {/* Paragraph blocks */}
      {skillsList.length > 0 && (
        <Paragraph label="Skills">
          {skillsList.map(([name, rank], i) => (
            <React.Fragment key={name}>
              {i > 0 && ", "}
              {name} {rank}
            </React.Fragment>
          ))}
          .
        </Paragraph>
      )}

      {talents.length > 0 && (
        <Paragraph label="Talents">
          <SymbolText html={symbolise(talents.join(", "))}/>.
        </Paragraph>
      )}

      {abilities.length > 0 && (
        <Paragraph label="Abilities">
          {abilities.map((a, i) => (
            <React.Fragment key={i}>
              {i > 0 && " "}
              {typeof a === "string"
                ? renderSwrpgText(a)
                : a?.name
                  ? <Text as="span"><b>{a.name}:</b> {renderSwrpgText(a.description)}</Text>
                  : null}
            </React.Fragment>
          ))}
        </Paragraph>
      )}

      {weapons.length > 0 && (
        <Paragraph label="Weapons">
          {weapons.map((w: any, i: number) => (
            <React.Fragment key={i}>
              {i > 0 && "; "}
              {typeof w === "string"
                ? w
                : `${w.name} (${w.skill}; Damage ${w.damage}; Critical ${w.critical}; Range ${w.range}${w.qualities?.length ? `; ${w.qualities.join(", ")}` : ""})`}
            </React.Fragment>
          ))}
          .
        </Paragraph>
      )}

      {gear.length > 0 && (
        <Paragraph label="Equipment">{gear.join(", ")}.</Paragraph>
      )}

      {description && (
        <Box mt={1} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.150">
          <Text fontSize="sm" color="whiteAlpha.700" whiteSpace="pre-line">
            {description}
          </Text>
        </Box>
      )}
    </VStack>
  );
};

const DerivedCell: React.FC<{label: string; value: React.ReactNode}> = ({label, value}) => (
  <Flex direction="column" align="center" minW="74px">
    <Text
      as="b"
      fontSize="9px"
      letterSpacing="0.10em"
      color="whiteAlpha.700"
      textTransform="uppercase"
      mb="2px"
      noOfLines={1}
    >
      {label}
    </Text>
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="#1a1d24"
      px={3}
      py="3px"
      minW="64px"
      textAlign="center"
      style={{clipPath: TAB_CLIP}}
      boxShadow="inset 0 -2px 0 rgba(0,0,0,0.10)"
    >
      <Text
        fontWeight="extrabold"
        fontSize="lg"
        color="#1a1d24"
        lineHeight="1.2"
        fontFamily={FONT_DISPLAY}
      >
        {value}
      </Text>
    </Box>
  </Flex>
);

const Paragraph: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
  <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.5">
    <Text as="b" color="#d39939">{label}: </Text>
    <Text as="span" color="whiteAlpha.800">{children}</Text>
  </Text>
);

const SymbolText: React.FC<{html: string}> = ({html}) => (
  <Text as="span"><Interweave content={html}/></Text>
);

export default AdversaryBookSheet;
