import React from 'react';
import { Box, HStack, Tag, Text, VStack, Wrap } from '@chakra-ui/react';

export interface VehicleWeaponLike {
  name: string;
  arc?: string;
  damage?: number | null;
  critical?: number | null;
  range?: string;
  qualities?: string[];
}

interface Props {
  weapons: VehicleWeaponLike[];
  /** Compact mode trims arc + qualities into a single line — used by the
   * stat sheet where vertical space is at a premium. */
  compact?: boolean;
}

/**
 * Vehicle weapons table — shared between the Spotlight `<VehiclePreview>` and
 * the equipped-vehicle section of `<StatSheet>`. Arc / Name / Range / Damage /
 * Crit / Qualities columns. Damage and Crit can be null for non-damaging
 * weapons (tractor beams).
 */
export const VehicleWeaponsTable: React.FC<Props> = ({ weapons, compact = false }) => {
  if (!weapons || weapons.length === 0) {
    return (
      <Text fontSize="xs" color="gray.500">
        No weapons.
      </Text>
    );
  }

  return (
    <VStack align="stretch" spacing={1}>
      {/* Column headers — match the row layout below. */}
      <HStack
        spacing={2}
        px={2}
        py={1}
        fontSize="9px"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="0.08em"
      >
        <Text minW="64px" flexShrink={0}>Arc</Text>
        <Text flex="1" minW={0}>Name</Text>
        <Text minW="60px" flexShrink={0}>Range</Text>
        <Text minW="36px" flexShrink={0} textAlign="right">Dmg</Text>
        <Text minW="36px" flexShrink={0} textAlign="right">Crit</Text>
        {!compact && <Text flex="2" minW={0}>Qualities</Text>}
      </HStack>
      {weapons.map((w, i) => (
        <HStack
          key={`${w.name}-${i}`}
          spacing={2}
          px={2}
          py={1.5}
          bg={i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'}
          borderRadius="sm"
          fontSize="xs"
          color="gray.200"
          align="start"
        >
          <Text minW="64px" flexShrink={0} color="gray.400">
            {w.arc ?? '—'}
          </Text>
          <Text flex="1" minW={0} fontWeight="semibold" noOfLines={compact ? 1 : 2}>
            {w.name}
          </Text>
          <Text minW="60px" flexShrink={0} color="gray.400">
            {w.range ?? '—'}
          </Text>
          <Text minW="36px" flexShrink={0} textAlign="right">
            {w.damage == null ? '—' : w.damage}
          </Text>
          <Text minW="36px" flexShrink={0} textAlign="right">
            {w.critical == null ? '—' : w.critical}
          </Text>
          {compact ? null : (
            <Box flex="2" minW={0}>
              {w.qualities && w.qualities.length > 0 ? (
                <Wrap spacing={1} shouldWrapChildren>
                  {w.qualities.map((q, qi) => (
                    <Tag key={qi} size="sm" variant="outline" colorScheme="gray">
                      {q}
                    </Tag>
                  ))}
                </Wrap>
              ) : (
                <Text color="gray.500">—</Text>
              )}
            </Box>
          )}
        </HStack>
      ))}
      {compact && weapons.some((w) => w.qualities && w.qualities.length > 0) && (
        <Wrap spacing={1} px={2} pt={1}>
          {weapons.flatMap((w, wi) =>
            (w.qualities ?? []).map((q, qi) => (
              <Tag key={`${wi}-${qi}`} size="sm" variant="outline" colorScheme="gray">
                {w.name.split(' ')[0]}: {q}
              </Tag>
            )),
          )}
        </Wrap>
      )}
    </VStack>
  );
};

export default VehicleWeaponsTable;
