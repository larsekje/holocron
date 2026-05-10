import React from 'react';
import {Box, Card, CardBody, Flex, Text, Tooltip, VStack, Wrap, WrapItem} from '@chakra-ui/react';
import {getDetail} from '@/data/spotlightIndex';
import {renderSwrpgText} from '@/utils/swrpgText';

export interface VehicleWeaponLike {
  name: string;
  damage?: number | null;
  critical?: number | null;
  range?: string;
  qualities?: string[];
}

interface Props {
  weapon: VehicleWeaponLike;
  onClick?: () => void;
}

// Quality slug variants — matches WeaponCardOld so the same spotlight
// quality entries resolve.
function qualitySlugCandidates(name: string): string[] {
  const lower = name.toLowerCase();
  const collapsed = 'quality_' + lower.replace(/[^a-z0-9]+/g, '');
  const hyphenated = 'quality_' + lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return collapsed === hyphenated ? [collapsed] : [collapsed, hyphenated];
}

function lookupQualityDescription(quality: string): {label: string; description?: string} {
  const m = quality.match(/^(.+?)(?:\s+(\d+))?$/);
  const baseName = m?.[1] ?? quality;
  const rank = m?.[2];

  let description: string | undefined;
  for (const slug of qualitySlugCandidates(baseName)) {
    const detail = getDetail('quality', slug);
    description = (detail as any)?.markdown ?? (detail as any)?.description;
    if (description) break;
  }

  const label = rank ? `${baseName} ${rank}` : baseName;
  return {label, description};
}

/**
 * Vehicle weapon card. Mirrors `<WeaponCardOld>` for visual consistency —
 * big DMG number on the left, name + range/crit subline, quality chips with
 * tooltips. No skill or dice pool: vehicle weapon dice come from the
 * gunner's profile, not the weapon itself.
 */
const VehicleWeaponCardOld: React.FC<Props> = ({weapon, onClick}) => {
  return (
    <Card
      bg="#26292d"
      _hover={onClick ? {bg: '#2f3338'} : undefined}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      transition="background 0.1s ease"
    >
      <CardBody padding="2">
        <Flex align="center" gap={3}>
          <VStack spacing={0} minW="60px" align="center">
            <Text fontSize="2xl" color="white" fontWeight="bold" lineHeight="1">
              {weapon.damage == null ? '—' : String(weapon.damage)}
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
              {weapon.range ?? '—'}
              {weapon.critical != null ? ` · Crit ${weapon.critical}` : ''}
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
                      borderColor={description ? 'whiteAlpha.400' : 'gray.600'}
                      borderRadius="sm"
                      fontSize="10px"
                      color="whiteAlpha.900"
                    >
                      {q}
                    </Box>
                  );
                  return (
                    <WrapItem key={`${q}-${i}`} onClick={(e) => e.stopPropagation()}>
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
        </Flex>
      </CardBody>
    </Card>
  );
};

export default VehicleWeaponCardOld;
