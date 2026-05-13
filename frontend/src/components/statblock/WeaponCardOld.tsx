import React from 'react';
import {Box, Card, CardBody, Flex, HStack, Text, Tooltip, VStack, Wrap, WrapItem} from "@chakra-ui/react";
import DicePoolOld, {DicePool} from "./DicePoolOld";
import type {WeaponLike} from "@/utils/diceSnapshots";
import {finalWeaponDamage} from "@/utils/diceSnapshots";
import {getDetail} from "@/data/spotlightIndex";
import {renderSwrpgText} from "@/utils/swrpgText";

interface Props {
  weapon: WeaponLike;
  // Pool is optional so the dice roller can reuse the card without
  // duplicating its own pool display below.
  pool?: DicePool;
  // Wielder's Brawn — used to resolve melee plus-damage. Optional so legacy
  // callers don't break; without it melee weapons fall back to their raw
  // damage value (which for plusDamage entries is 0).
  wielderBrawn?: number;
  onClick?: () => void;
}

// Try multiple slug variants for a quality name. The spotlight extras encode some single-word
// qualities without hyphens (`autofire`) and some multi-word ones with hyphens (`stun-setting`,
// `limited-ammo`), so try both.
function qualitySlugCandidates(name: string): string[] {
  const lower = name.toLowerCase();
  const collapsed = "quality_" + lower.replace(/[^a-z0-9]+/g, "");
  const hyphenated = "quality_" + lower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return collapsed === hyphenated ? [collapsed] : [collapsed, hyphenated];
}

function lookupQualityDescription(quality: string): {label: string; description?: string} {
  // Quality strings come as "Vicious 2", "Pierce 1", "Stun Setting", etc.
  const m = quality.match(/^(.+?)(?:\s+(\d+))?$/);
  const baseName = m?.[1] ?? quality;
  const rank = m?.[2];

  let description: string | undefined;
  for (const slug of qualitySlugCandidates(baseName)) {
    const detail = getDetail("quality", slug);
    description = (detail as any)?.markdown ?? (detail as any)?.description;
    if (description) break;
  }

  const label = rank ? `${baseName} ${rank}` : baseName;
  return {label, description};
}

const WeaponCardOld = ({weapon, pool, wielderBrawn, onClick}: Props) => {
  const displayDamage = finalWeaponDamage(weapon, wielderBrawn ?? 0);
  return (
    <Card
      bg="#26292d"
      _hover={onClick ? {bg: "#2f3338"} : undefined}
      cursor={onClick ? "pointer" : "default"}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      transition="background 0.1s ease"
    >
      <CardBody padding="2">
        <Flex align="center" gap={3}>
          <VStack spacing={0} minW="60px" align="center">
            <Text fontSize="2xl" color="white" fontWeight="bold" lineHeight="1">
              {String(displayDamage)}
            </Text>
            <Text fontSize="9px" color="whiteAlpha.700" letterSpacing="0.1em">
              DMG
            </Text>
          </VStack>

          <Box flex="1" minW={0}>
            <Text color="white" fontSize="md" fontWeight="semibold" noOfLines={1}>
              {weapon.name}
            </Text>
            <Text color="whiteAlpha.700" fontSize="xs" noOfLines={1}>
              {weapon.range}
              {weapon.skill ? ` · ${weapon.skill}` : ""}
              {weapon.critical !== undefined || weapon.crit !== undefined
                ? ` · Crit ${weapon.critical ?? weapon.crit}`
                : ""}
            </Text>
            {weapon.qualities && weapon.qualities.length > 0 && (
              <Wrap mt={1} spacing={1}>
                {weapon.qualities.map((q, i) => {
                  const {description} = lookupQualityDescription(q);
                  const chip = (
                    <Box
                      px={2}
                      py="1px"
                      borderWidth="1px"
                      borderColor={description ? "whiteAlpha.400" : "gray.600"}
                      borderRadius="sm"
                      fontSize="10px"
                      color="whiteAlpha.900"
                    >
                      {q}
                    </Box>
                  );
                  return (
                    <WrapItem
                      key={`${q}-${i}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {description ? (
                        <Tooltip
                          hasArrow
                          placement="top"
                          openDelay={250}
                          bg="#1f2125"
                          color="gray.100"
                          borderColor="whiteAlpha.200"
                          borderWidth="1px"
                          borderRadius="md"
                          maxW="320px"
                          px={3}
                          py={2}
                          label={
                            <Box fontSize="xs">
                              <Text fontWeight="bold" mb={1}>{q}</Text>
                              <Box>{renderSwrpgText(description)}</Box>
                            </Box>
                          }
                        >
                          {chip}
                        </Tooltip>
                      ) : chip}
                    </WrapItem>
                  );
                })}
              </Wrap>
            )}
          </Box>

          {pool && (
            <HStack spacing={1} flexShrink={0}>
              <DicePoolOld pool={pool}/>
            </HStack>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};

export default WeaponCardOld;
