import React from 'react';
import { Badge, Box, HStack, Text, Tooltip, VStack } from '@chakra-ui/react';
import {
  GiSkullCrossedBones,
  GiVortex,
  GiStoneSphere,
  GiRopeCoil,
  GiFire,
  GiFallingRocks,
  GiCog,
  GiSpaceShuttle,
} from 'react-icons/gi';
import { useEffectStore } from '@/state/effectStore';
import useParticipantStore from '@/state/participantsStore';
import useActiveVehicleStore from '@/state/activeVehicleStore';
import type { StatusType } from '@/types/effectTypes';

/** Status → severity colour. Hard-stop statuses (cannot act/maneuver) and
 *  serious crits go red; control loss (Disoriented, Distracted) → amber;
 *  damage-over-time → orange; markers / minor (Prone, Off-Balance) → grey;
 *  default → blue (info). */
const STATUS_COLOR: Partial<Record<StatusType, string>> = {
  staggered: '#b03030',
  immobilized: '#b03030',
  ensnared: '#b03030',
  'at-the-brink': '#b03030',
  crippled: '#b03030',
  maimed: '#b03030',
  'horrific-injury': '#b03030',
  'end-is-nigh': '#b03030',

  disoriented: '#d39939',
  slowed: '#d39939',
  distracted: '#d39939',
  'off-balance': '#d39939',
  hamstrung: '#d39939',
  compromised: '#d39939',
  'temporarily-lame': '#d39939',
  'head-ringer': '#d39939',

  burn: '#cc5500',

  prone: '#6f6f6f',
  'knocked-down': '#6f6f6f',
};

const STATUS_ICON: Partial<Record<StatusType, React.ReactNode>> = {
  staggered: <GiSkullCrossedBones />,
  immobilized: <GiStoneSphere />,
  ensnared: <GiRopeCoil />,
  disoriented: <GiVortex />,
  burn: <GiFire />,
  prone: <GiFallingRocks />,
  'knocked-down': <GiFallingRocks />,
};

const DEFAULT_COLOR = '#5a7fb0';
const VEHICLE_COLOR = '#7a4fb0';

function formatDuration(d: number | 'encounter' | undefined): string | null {
  if (d === undefined) return null;
  if (d === 'encounter') return 'Sc';
  return String(d);
}

interface EffectRow {
  key: string;
  accent: string;
  icon: React.ReactNode;
  title: string;
  duration?: string | null;
  description?: string;
}

/**
 * OngoingEffectsCard — one self-contained card at the top of Session Prep.
 * Compact readout of every character status effect (effectStore) and
 * vehicle effect (activeVehicleStore): accent dot + icon + "target · effect"
 * + duration chip. Hover a row for the full description. Not expandable —
 * this is an at-a-glance "what's in play" panel, not a control surface.
 */
const OngoingEffectsCard: React.FC = () => {
  const effects = useEffectStore((s) => s.effects);
  const participants = useParticipantStore((s) => s.participants);
  const vehicles = useActiveVehicleStore((s) => s.vehicles);

  const participantName = (id?: string): string => {
    if (!id) return 'Global';
    return participants.find((p) => p.id === id)?.name ?? 'Unknown';
  };

  const characterRows: EffectRow[] = effects.map((pe) => {
    const status = pe.effect.status as StatusType | undefined;
    const accent = (status && STATUS_COLOR[status]) ?? DEFAULT_COLOR;
    const icon = (status && STATUS_ICON[status]) ?? <GiCog />;
    const targetName =
      pe.target.type === 'character'
        ? participantName(pe.target.participantId)
        : pe.target.type === 'initiative'
        ? `Slot ${pe.target.slot ?? '?'}`
        : 'Global';
    const rankSuffix = pe.effect.rank ? ` ${pe.effect.rank}` : '';
    return {
      key: `eff:${pe.id}`,
      accent,
      icon,
      title: `${targetName} · ${pe.effect.name}${rankSuffix}`,
      duration: formatDuration(pe.remainingDuration),
      description: pe.effect.description,
    };
  });

  const vehicleRows: EffectRow[] = Object.values(vehicles).flatMap((v) =>
    (v.activeEffects ?? []).map((eff) => {
      const pilot = eff.pilotParticipantId
        ? participantName(eff.pilotParticipantId)
        : undefined;
      return {
        key: `veh:${v.id}:${eff.id}`,
        accent: VEHICLE_COLOR,
        icon: <GiSpaceShuttle />,
        title: `${v.name} · ${eff.name}`,
        duration: pilot ? `→ ${pilot}` : null,
        description: eff.note,
      };
    }),
  );

  const rows = [...characterRows, ...vehicleRows];

  return (
    <Box
      bg="#26292d"
      borderWidth="1px"
      borderColor="whiteAlpha.150"
      borderRadius="md"
      px={2}
      py={1.5}
    >
      <HStack justify="space-between" mb={rows.length > 0 ? 1 : 0}>
        <Text
          fontSize="2xs"
          color="whiteAlpha.500"
          letterSpacing="0.16em"
          textTransform="uppercase"
          fontWeight="bold"
        >
          Ongoing effects ({rows.length})
        </Text>
      </HStack>

      {rows.length === 0 ? (
        <Text color="whiteAlpha.400" fontSize="2xs" fontStyle="italic">
          Nothing in play.
        </Text>
      ) : (
        <VStack align="stretch" spacing={0}>
          {rows.map((r) => (
            <Tooltip
              key={r.key}
              label={
                <VStack align="start" spacing={1} py={1}>
                  <Text fontSize="xs" fontWeight="semibold">{r.title}</Text>
                  {r.description && (
                    <Text fontSize="2xs" color="whiteAlpha.800">
                      {r.description}
                    </Text>
                  )}
                </VStack>
              }
              placement="left"
              hasArrow
              openDelay={300}
              bg="#1a1c1e"
              color="whiteAlpha.900"
              maxW="280px"
              isDisabled={!r.description}
            >
              <HStack spacing={1.5} minH="20px" align="center">
                <Box
                  w="3px"
                  alignSelf="stretch"
                  bg={r.accent}
                  borderRadius="full"
                  flexShrink={0}
                />
                <Box
                  color={r.accent}
                  fontSize="12px"
                  display="inline-flex"
                  alignItems="center"
                  flexShrink={0}
                >
                  {r.icon}
                </Box>
                <Text
                  color="whiteAlpha.900"
                  fontSize="xs"
                  lineHeight="1.3"
                  noOfLines={1}
                  flex="1"
                  minW={0}
                >
                  {r.title}
                </Text>
                {r.duration && (
                  <Badge
                    bg="whiteAlpha.150"
                    color="whiteAlpha.800"
                    fontSize="9px"
                    px={1}
                    py={0}
                    borderRadius="sm"
                    lineHeight="1.3"
                    flexShrink={0}
                  >
                    {r.duration}
                  </Badge>
                )}
              </HStack>
            </Tooltip>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default OngoingEffectsCard;
