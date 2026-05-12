import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Tag,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import {
  ALL_BIASES,
  computeToneTarget,
  JuiceArchetype,
  JuiceBias,
  JuiceTone,
  SKINS_BY_ARCHETYPE,
  listAvailableArchetypes,
} from '@/data/narrativeJuice';
import {
  useNarrativeJuiceStore,
  SceneSlot,
  getMatchStats,
  toneDistance,
  getToneAvailability,
  getHeatAvailability,
} from '@/state/narrativeJuiceStore';
import { JuiceEntry } from '@/data/narrativeJuice';
import { Switch } from '@chakra-ui/react';

const TONE_AXES: { key: keyof JuiceTone; label: string; lowLabel: string; highLabel: string; color: string }[] = [
  { key: 'pulpy', label: 'Pulpy', lowLabel: 'grounded', highLabel: 'swashbuckling', color: '#f6ad55' },
  { key: 'seedy', label: 'Seedy', lowLabel: 'wholesome', highLabel: 'dark', color: '#68d391' },
  { key: 'intrigue', label: 'Intrigue', lowLabel: 'open', highLabel: 'paranoid', color: '#b794f4' },
  { key: 'refined', label: 'Refined', lowLabel: 'crude', highLabel: 'elegant', color: '#fc8181' },
];

const TONE_DESCRIPTORS: Record<keyof JuiceTone, Record<number, string>> = {
  pulpy: { '-1': 'grounded', 0: 'neutral', 1: 'adventure', 2: 'daring', 3: 'swashbuckle' },
  seedy: { '-1': 'wholesome', 0: 'neutral', 1: 'grimy', 2: 'corrupt', 3: 'dark' },
  intrigue: { '-1': 'open', 0: 'neutral', 1: 'watchful', 2: 'paranoid', 3: 'thriller' },
  refined: { '-1': 'crude', 0: 'neutral', 1: 'mannered', 2: 'formal', 3: 'elegant' },
};

function toneLabel(axis: keyof JuiceTone, value: number): string {
  return TONE_DESCRIPTORS[axis][value] ?? String(value);
}

const SLOT_LABELS: Record<string, string> = {
  sensory: 'Sensory',
  npc: 'NPCs',
  environmental: 'Environment',
  complication: 'Complication',
};

const STOP_VALUES = [-1, 0, 1, 2];
const WELL_BG = '#1a1c1f';
const SLIDER_MAX_W = '200px';

interface StopConfig {
  value: number;
  color: string;
  label?: string;
  count?: number;
  maxCount?: number;
}

// Maps a per-stop count to a ball diameter in px. 0 → vestigial; max → full.
// Active state adds a small boost on top.
function ballSize(count: number | undefined, max: number | undefined, isActive: boolean): number {
  if (count === undefined || max === undefined) {
    return isActive ? 6 : 4;
  }
  if (max <= 0) return isActive ? 3 : 2;
  if (count === 0) return isActive ? 3 : 2;
  const t = Math.min(1, count / max);
  const base = 3 + Math.round(t * 5); // 3..8
  return isActive ? Math.min(9, base + 1) : base;
}

function ballOpacity(count: number | undefined, max: number | undefined, isActive: boolean): number {
  if (count === undefined || max === undefined) {
    return isActive ? 1 : 0.42;
  }
  if (count === 0) return isActive ? 0.55 : 0.18;
  if (isActive) return 1;
  const t = max > 0 ? Math.min(1, count / max) : 0;
  return 0.35 + t * 0.45; // 0.35..0.8
}

function StepSlider({
  stops,
  value,
  onChange,
  thumbFocusColor,
  readOnly,
  fractional,
}: {
  stops: StopConfig[];
  value: number;
  onChange?: (v: number) => void;
  thumbFocusColor: string;
  readOnly?: boolean;
  fractional?: boolean;
}) {
  const min = stops[0].value;
  const max = stops[stops.length - 1].value;
  return (
    <Slider
      min={min}
      max={max}
      step={fractional ? 0.01 : 1}
      value={value}
      onChange={onChange}
      isReadOnly={readOnly}
      focusThumbOnChange={false}
      h="18px"
    >
      <SliderTrack
        bg={WELL_BG}
        h="6px"
        borderRadius="full"
        boxShadow="inset 0 1px 2px rgba(0,0,0,0.8), inset 0 -1px 0 rgba(255,255,255,0.06)"
      >
        <SliderFilledTrack bg="transparent" />
      </SliderTrack>

      {stops.map((s) => {
        const isActive = s.value === value;
        const size = ballSize(s.count, s.maxCount, isActive);
        const opacity = ballOpacity(s.count, s.maxCount, isActive);
        const tip =
          s.count !== undefined
            ? `${s.label ? `${s.label} · ` : ''}${s.count} entries available`
            : undefined;
        return (
          <SliderMark
            key={`well-${s.value}`}
            value={s.value}
            top="50%"
            ml="-7px"
            mt="-7px"
            w="14px"
            h="14px"
            bg={WELL_BG}
            borderRadius="full"
            boxShadow="inset 0 1px 1.5px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.05)"
            pointerEvents={tip ? 'auto' : 'none'}
            title={tip}
          >
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w={`${size}px`}
              h={`${size}px`}
              borderRadius="full"
              bg={s.color}
              opacity={opacity}
              boxShadow={
                isActive
                  ? `0 0 5px 1px ${s.color}, inset 0 0 1px rgba(255,255,255,0.5)`
                  : 'inset 0 0.5px 0.5px rgba(0,0,0,0.4)'
              }
              transition="all 0.18s ease-out"
            />
          </SliderMark>
        );
      })}

      <SliderThumb
        boxSize="18px"
        border="none"
        background="radial-gradient(circle at 30% 28%, #fafafa 0%, #d4d4d4 35%, #9c9c9c 75%, #6e6e6e 100%)"
        boxShadow="0 1.5px 3px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -2px 3px rgba(0,0,0,0.3)"
        _focusVisible={{
          boxShadow: `0 1.5px 3px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -2px 3px rgba(0,0,0,0.3), 0 0 0 2px ${thumbFocusColor}99`,
        }}
        _active={{
          background:
            'radial-gradient(circle at 30% 28%, #ffffff 0%, #e0e0e0 35%, #a8a8a8 75%, #7a7a7a 100%)',
        }}
      />
    </Slider>
  );
}

function nearestDescriptor(axis: keyof JuiceTone, value: number): string {
  const rounded = Math.round(value);
  return TONE_DESCRIPTORS[axis][rounded] ?? String(rounded);
}

function ToneSlider({
  axis,
  value,
  perValue,
  maxCount,
}: {
  axis: typeof TONE_AXES[number];
  value: number;
  perValue?: Record<number, number>;
  maxCount?: number;
}) {
  const stops: StopConfig[] = STOP_VALUES.map((v) => ({
    value: v,
    color: axis.color,
    count: perValue?.[v],
    maxCount,
  }));
  const nonZero = Math.abs(value) > 0.05;
  return (
    <HStack spacing={2} align="center">
      <Text
        fontSize="2xs"
        textTransform="uppercase"
        letterSpacing="wide"
        fontWeight="semibold"
        color="whiteAlpha.800"
        w="64px"
        flexShrink={0}
        whiteSpace="nowrap"
      >
        {axis.label}
      </Text>
      <Box flex="1" minW={0}>
        <StepSlider stops={stops} value={value} thumbFocusColor={axis.color} readOnly fractional />
      </Box>
      <Text
        fontSize="2xs"
        textAlign="right"
        color={nonZero ? axis.color : 'whiteAlpha.450'}
        fontWeight={nonZero ? 'semibold' : 'normal'}
        w="64px"
        flexShrink={0}
        noOfLines={1}
      >
        {nearestDescriptor(axis.key, value)}
      </Text>
    </HStack>
  );
}

const HEAT_STOPS: StopConfig[] = [
  { value: 1, color: '#63b3ed', label: 'background' },
  { value: 2, color: '#f6ad55', label: 'brewing' },
  { value: 3, color: '#fc8181', label: 'crisis' },
];

function HeatSlider({
  value,
  onChange,
  perValue,
  maxCount,
}: {
  value: 1 | 2 | 3;
  onChange: (v: 1 | 2 | 3) => void;
  perValue?: Record<number, number>;
  maxCount?: number;
}) {
  const current = HEAT_STOPS.find((s) => s.value === value) ?? HEAT_STOPS[0];
  const stops: StopConfig[] = HEAT_STOPS.map((s) => ({
    ...s,
    count: perValue?.[s.value],
    maxCount,
  }));
  return (
    <HStack spacing={2} align="center">
      <Text
        fontSize="2xs"
        textTransform="uppercase"
        letterSpacing="wide"
        fontWeight="semibold"
        color="whiteAlpha.800"
        w="64px"
        flexShrink={0}
        whiteSpace="nowrap"
      >
        Heat
      </Text>
      <Box flex="1" minW={0}>
        <StepSlider
          stops={stops}
          value={value}
          onChange={(v) => onChange(v as 1 | 2 | 3)}
          thumbFocusColor={current.color}
        />
      </Box>
      <Text
        fontSize="2xs"
        textAlign="right"
        color={current.color}
        fontWeight="semibold"
        w="64px"
        flexShrink={0}
        noOfLines={1}
      >
        {current.label}
      </Text>
    </HStack>
  );
}

function fitColor(distance: number): string {
  if (distance === 0) return '#68d391';
  if (distance <= 2) return '#f6e05e';
  if (distance <= 4) return '#f6ad55';
  return '#fc8181';
}

function DebugStrip({ entry }: { entry: JuiceEntry }) {
  const archetype = useNarrativeJuiceStore((s) => s.archetype);
  const skin = useNarrativeJuiceStore((s) => s.skin);
  const heat = useNarrativeJuiceStore((s) => s.heat);
  const bias = useNarrativeJuiceStore((s) => s.bias);

  const tone = useMemo(
    () => computeToneTarget(archetype, skin, heat, bias),
    [archetype, skin, heat, bias],
  );
  const fitDist = toneDistance(entry.tone, tone);
  const biasOverlap = entry.bias.filter((b) => (bias as string[]).includes(b)).length;
  const fitC = fitColor(fitDist);

  return (
    <HStack
      spacing={3}
      fontSize="2xs"
      mt={1}
      color="whiteAlpha.500"
      fontVariantNumeric="tabular-nums"
      flexWrap="wrap"
    >
      {/* Tone descriptors, one per axis */}
      <HStack spacing={2}>
        {TONE_AXES.map((a) => {
          const v = entry.tone[a.key];
          const tv = tone[a.key];
          const matches = Math.abs(v - tv) < 0.5;
          const tvFormatted = `${tv > 0 ? '+' : ''}${tv.toFixed(1)}`;
          return (
            <Tooltip
              key={a.key}
              label={`${a.label}: ${toneLabel(a.key, v)} (${v > 0 ? '+' : ''}${v}) · target ${tvFormatted}`}
              hasArrow
              openDelay={300}
            >
              <HStack spacing={1}>
                <Box
                  w="5px"
                  h="5px"
                  borderRadius="full"
                  bg={a.color}
                  opacity={v === 0 ? 0.35 : matches ? 1 : 0.65}
                />
                <Text
                  color={v === 0 ? 'whiteAlpha.500' : matches ? a.color : 'whiteAlpha.700'}
                  fontWeight={matches && v !== 0 ? 'bold' : 'normal'}
                >
                  {toneLabel(a.key, v)}
                </Text>
              </HStack>
            </Tooltip>
          );
        })}
      </HStack>

      <Text color="whiteAlpha.300">·</Text>

      {/* Heat: 1·2·3 with the entry's heat highlighted; bold if it matches target */}
      <HStack spacing={1}>
        <Text color="whiteAlpha.500">h</Text>
        {[1, 2, 3].map((h) => {
          const has = entry.heat.includes(h);
          const isTarget = h === heat;
          const stop = HEAT_STOPS.find((s) => s.value === h);
          const c = stop?.color ?? '#888';
          return (
            <Text
              key={h}
              color={has ? (isTarget ? c : 'whiteAlpha.700') : 'whiteAlpha.200'}
              fontWeight={isTarget && has ? 'bold' : 'normal'}
            >
              {h}
            </Text>
          );
        })}
      </HStack>

      {entry.bias.length > 0 && (
        <>
          <Text color="whiteAlpha.300">·</Text>
          <HStack spacing={1}>
            {entry.bias.map((b) => {
              const hit = (bias as string[]).includes(b);
              return (
                <Text key={b} color={hit ? '#63b3ed' : 'whiteAlpha.500'} fontWeight={hit ? 'bold' : 'normal'}>
                  {b}
                </Text>
              );
            })}
          </HStack>
        </>
      )}

      <Text color="whiteAlpha.300">·</Text>

      <Tooltip
        label={`Tone distance ${fitDist}${biasOverlap > 0 ? `, bias overlap ${biasOverlap}` : ''}`}
        hasArrow
        openDelay={300}
      >
        <HStack spacing={1}>
          <Text color={fitC} fontWeight="bold">
            {fitDist === 0 ? '★' : `Δ${fitDist}`}
          </Text>
          {biasOverlap > 0 && (
            <Text color="#63b3ed">↯{biasOverlap}</Text>
          )}
        </HStack>
      </Tooltip>
    </HStack>
  );
}

function SensorySection({
  slots,
  startIndex,
  debugVisible,
}: {
  slots: SceneSlot[];
  startIndex: number;
  debugVisible: boolean;
}) {
  const rerollSlot = useNarrativeJuiceStore((s) => s.rerollSlot);
  return (
    <Box>
      <Text color="whiteAlpha.900" fontSize="sm" lineHeight="1.7">
        <Text as="span" fontWeight="bold" color="whiteAlpha.800">
          Sensory:{' '}
        </Text>
        {slots.map((s, i) => (
          <React.Fragment key={i}>
            {s.entry ? (
              <Tooltip label="Click to re-roll this beat" placement="top" hasArrow openDelay={500}>
                <Box
                  as="span"
                  cursor="pointer"
                  borderRadius="sm"
                  px="2px"
                  mx="-2px"
                  transition="background 0.1s"
                  _hover={{ bg: 'whiteAlpha.150' }}
                  onClick={() => rerollSlot(startIndex + i)}
                >
                  {s.entry.text}
                </Box>
              </Tooltip>
            ) : (
              <Text as="span" color="whiteAlpha.400" fontStyle="italic">
                — roll to fill —
              </Text>
            )}
            {i < slots.length - 1 ? ' ' : ''}
          </React.Fragment>
        ))}
      </Text>
      {debugVisible && (
        <VStack align="stretch" spacing={0.5} mt={2} pl={4}>
          {slots.map(
            (s, i) =>
              s.entry && (
                <HStack key={i} spacing={2} align="start">
                  <Text fontSize="2xs" color="whiteAlpha.400" w="2ch" mt="2px">
                    {i + 1}
                  </Text>
                  <Box flex="1">
                    <DebugStrip entry={s.entry} />
                  </Box>
                </HStack>
              ),
          )}
        </VStack>
      )}
    </Box>
  );
}

function ListSection({
  label,
  slots,
  startIndex,
  debugVisible,
}: {
  label: string;
  slots: SceneSlot[];
  startIndex: number;
  debugVisible: boolean;
}) {
  const rerollSlot = useNarrativeJuiceStore((s) => s.rerollSlot);
  return (
    <Box>
      <Text fontWeight="bold" color="whiteAlpha.800" fontSize="sm" mb={1.5}>
        {label}:
      </Text>
      <VStack align="stretch" spacing={1.5} pl={1}>
        {slots.map((s, i) => (
          <HStack key={i} align="start" spacing={2}>
            <Text color="whiteAlpha.500" fontSize="sm" lineHeight="1.6" mt="1px" flexShrink={0}>
              •
            </Text>
            <Box flex="1" minW={0}>
              <Text color="whiteAlpha.900" fontSize="sm" lineHeight="1.6">
                {s.entry?.text ?? (
                  <Text as="span" color="whiteAlpha.400" fontStyle="italic">
                    — roll to fill —
                  </Text>
                )}
              </Text>
              {debugVisible && s.entry && <DebugStrip entry={s.entry} />}
            </Box>
            <Tooltip label="Re-roll this slot" placement="left" hasArrow openDelay={400}>
              <IconButton
                aria-label="Re-roll slot"
                icon={<RepeatIcon />}
                size="xs"
                variant="ghost"
                colorScheme="whiteAlpha"
                isDisabled={!s.entry}
                onClick={() => rerollSlot(startIndex + i)}
              />
            </Tooltip>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

function ComplicationSection({
  slots,
  startIndex,
  debugVisible,
}: {
  slots: SceneSlot[];
  startIndex: number;
  debugVisible: boolean;
}) {
  const rerollSlot = useNarrativeJuiceStore((s) => s.rerollSlot);
  return (
    <Box>
      {slots.map((s, i) => (
        <Box key={i} mb={slots.length > 1 && i < slots.length - 1 ? 2 : 0}>
          <HStack align="start" spacing={2}>
            <Text color="whiteAlpha.900" fontSize="sm" lineHeight="1.7" flex="1">
              <Text as="span" fontWeight="bold" color="whiteAlpha.800">
                Complication:{' '}
              </Text>
              {s.entry?.text ?? (
                <Text as="span" color="whiteAlpha.400" fontStyle="italic">
                  — roll to fill —
                </Text>
              )}
            </Text>
            <Tooltip label="Re-roll this slot" placement="left" hasArrow openDelay={400}>
              <IconButton
                aria-label="Re-roll slot"
                icon={<RepeatIcon />}
                size="xs"
                variant="ghost"
                colorScheme="whiteAlpha"
                isDisabled={!s.entry}
                onClick={() => rerollSlot(startIndex + i)}
              />
            </Tooltip>
          </HStack>
          {debugVisible && s.entry && (
            <Box mt={1} pl={4}>
              <DebugStrip entry={s.entry} />
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}

function SceneHeader({
  archetype,
  skin,
  tone,
  heat,
  bias,
}: {
  archetype: JuiceArchetype;
  skin: string | null;
  tone: JuiceTone;
  heat: 1 | 2 | 3;
  bias: JuiceBias[];
}) {
  const toneSummary = useMemo(() => {
    const parts = TONE_AXES.map((a) => ({ a, v: tone[a.key] }))
      .filter((x) => Math.abs(x.v) >= 0.5)
      .sort((x, y) => Math.abs(y.v) - Math.abs(x.v))
      .map((x) => toneLabel(x.a.key, Math.round(x.v)));
    return parts.length ? parts.join(' + ') : 'Neutral';
  }, [tone]);

  const title = (skin ?? archetype).replace(/_/g, ' ');
  const archLabel = archetype.replace(/_/g, ' ');
  const heatStop = HEAT_STOPS.find((s) => s.value === heat) ?? HEAT_STOPS[0];

  return (
    <Box pb={2} borderBottom="1px solid" borderColor="whiteAlpha.150">
      <Heading
        size="sm"
        color="whiteAlpha.900"
        textTransform="capitalize"
        mb={0.5}
        letterSpacing="wide"
      >
        {title}
      </Heading>
      <HStack
        spacing={2}
        fontSize="xs"
        color="whiteAlpha.600"
        flexWrap="wrap"
        textTransform="capitalize"
      >
        <Text>{archLabel}</Text>
        <Text color="whiteAlpha.400">·</Text>
        <Text color="whiteAlpha.800" fontWeight="medium">
          {toneSummary}
        </Text>
        <Text color="whiteAlpha.400">·</Text>
        <Text color={heatStop.color}>Heat {heat}</Text>
        {bias.length > 0 && (
          <>
            <Text color="whiteAlpha.400">·</Text>
            <Text>Bias: {bias.join(' + ')}</Text>
          </>
        )}
      </HStack>
    </Box>
  );
}

function AggregateTone({ scene }: { scene: SceneSlot[] }) {
  const tone = useMemo(() => {
    const entries = scene.map((s) => s.entry).filter(Boolean) as NonNullable<SceneSlot['entry']>[];
    if (entries.length === 0) return null;
    const avg = (k: keyof JuiceTone) =>
      entries.reduce((sum, e) => sum + e.tone[k], 0) / entries.length;
    return {
      pulpy: avg('pulpy'),
      seedy: avg('seedy'),
      intrigue: avg('intrigue'),
      refined: avg('refined'),
    };
  }, [scene]);
  if (!tone) return null;
  return (
    <HStack spacing={3} fontSize="xs" color="whiteAlpha.700" fontVariantNumeric="tabular-nums">
      {TONE_AXES.map((a) => (
        <HStack key={a.key} spacing={1}>
          <Text color="whiteAlpha.500">{a.label}</Text>
          <Text color="whiteAlpha.900">{tone[a.key].toFixed(1)}</Text>
        </HStack>
      ))}
    </HStack>
  );
}

const NarrativeJuicePanel: React.FC = () => {
  const {
    isOpen,
    close,
    archetype,
    skin,
    heat,
    bias,
    scene,
    setArchetype,
    setSkin,
    setHeat,
    toggleBias,
    rollScene,
  } = useNarrativeJuiceStore();

  const tone = useMemo(
    () => computeToneTarget(archetype, skin, heat, bias),
    [archetype, skin, heat, bias],
  );

  const [debugVisible, setDebugVisible] = React.useState(true);

  // Auto-roll once when first opened so the panel isn't empty.
  useEffect(() => {
    if (isOpen && scene.every((s) => s.entry === null)) {
      rollScene();
    }
  }, [isOpen, scene, rollScene]);

  const archetypes = listAvailableArchetypes();
  const skins = SKINS_BY_ARCHETYPE[archetype];

  const matchStats = useMemo(
    () => getMatchStats(archetype, skin, tone, heat, bias),
    [archetype, skin, tone, heat, bias],
  );

  const toneAvailability = useMemo(
    () => getToneAvailability(archetype, skin, heat),
    [archetype, skin, heat],
  );

  const heatAvailability = useMemo(
    () => getHeatAvailability(archetype, skin),
    [archetype, skin],
  );

  // Group scene slots by type for display
  const sceneBySlot = useMemo(() => {
    const groups: Record<string, { slots: SceneSlot[]; startIndex: number }> = {};
    let currentSlot = '';
    let startIndex = 0;
    scene.forEach((s, i) => {
      if (s.slot !== currentSlot) {
        currentSlot = s.slot;
        startIndex = i;
      }
      if (!groups[s.slot]) groups[s.slot] = { slots: [], startIndex };
      groups[s.slot].slots.push(s);
    });
    return groups;
  }, [scene]);

  return (
    <Modal isOpen={isOpen} onClose={close} size="5xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="#2F3136" color="whiteAlpha.900" maxH="86vh">
        <ModalHeader
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
          py={3}
          px={4}
          fontSize="md"
        >
          <Heading size="sm">Narrative Juice</Heading>
        </ModalHeader>
        <ModalCloseButton top={2} right={2} />
        <ModalBody p={0}>
          <Grid templateColumns="260px 1fr" h="100%">
            {/* SETTINGS */}
            <GridItem borderRight="1px solid" borderColor="whiteAlpha.200" p={3}>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    Archetype
                  </Text>
                  <Select
                    size="sm"
                    bg="whiteAlpha.50"
                    borderColor="whiteAlpha.200"
                    value={archetype}
                    onChange={(e) => setArchetype(e.target.value as JuiceArchetype)}
                  >
                    {archetypes.map((a) => (
                      <option key={a} value={a} style={{ background: '#2F3136' }}>
                        {a.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    Skin
                  </Text>
                  <Select
                    size="sm"
                    bg="whiteAlpha.50"
                    borderColor="whiteAlpha.200"
                    value={skin ?? ''}
                    onChange={(e) => setSkin(e.target.value || null)}
                  >
                    <option value="" style={{ background: '#2F3136' }}>
                      any
                    </option>
                    {skins.map((s) => (
                      <option key={s} value={s} style={{ background: '#2F3136' }}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    Tone
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {TONE_AXES.map((a) => (
                      <ToneSlider
                        key={a.key}
                        axis={a}
                        value={tone[a.key]}
                        perValue={toneAvailability[a.key].perValue}
                        maxCount={toneAvailability[a.key].max}
                      />
                    ))}
                  </VStack>
                </Box>

                <HeatSlider
                  value={heat}
                  onChange={setHeat}
                  perValue={heatAvailability.perValue}
                  maxCount={heatAvailability.max}
                />

                <Box>
                  <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    Bias (multi)
                  </Text>
                  <Flex wrap="wrap" gap={1.5}>
                    {ALL_BIASES.map((b) => {
                      const active = bias.includes(b);
                      return (
                        <Tag
                          key={b}
                          size="sm"
                          variant={active ? 'solid' : 'outline'}
                          colorScheme={active ? 'blue' : 'gray'}
                          cursor="pointer"
                          onClick={() => toggleBias(b as JuiceBias)}
                          userSelect="none"
                        >
                          {b}
                        </Tag>
                      );
                    })}
                  </Flex>
                </Box>

                <Button colorScheme="blue" onClick={rollScene} size="sm">
                  Roll Scene
                </Button>

                <HStack justify="space-between" align="center" pt={1}>
                  <Text fontSize="2xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">
                    Debug
                  </Text>
                  <Switch
                    size="sm"
                    isChecked={debugVisible}
                    onChange={(e) => setDebugVisible(e.target.checked)}
                    colorScheme="blue"
                  />
                </HStack>
              </VStack>
            </GridItem>

            {/* SCENE */}
            <GridItem p={4} overflowY="auto">
              <VStack align="stretch" spacing={3}>
                <SceneHeader
                  archetype={archetype}
                  skin={skin}
                  tone={tone}
                  heat={heat}
                  bias={bias}
                />

                {(['sensory', 'npc', 'environmental', 'complication'] as const).map((slotType) => {
                  const group = sceneBySlot[slotType];
                  if (!group) return null;
                  if (slotType === 'sensory') {
                    return (
                      <SensorySection
                        key={slotType}
                        slots={group.slots}
                        startIndex={group.startIndex}
                        debugVisible={debugVisible}
                      />
                    );
                  }
                  if (slotType === 'complication') {
                    return (
                      <ComplicationSection
                        key={slotType}
                        slots={group.slots}
                        startIndex={group.startIndex}
                        debugVisible={debugVisible}
                      />
                    );
                  }
                  return (
                    <ListSection
                      key={slotType}
                      label={SLOT_LABELS[slotType]}
                      slots={group.slots}
                      startIndex={group.startIndex}
                      debugVisible={debugVisible}
                    />
                  );
                })}

                <Divider borderColor="whiteAlpha.150" />

                <Box>
                  <Text
                    fontSize="2xs"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color="whiteAlpha.500"
                    mb={1.5}
                  >
                    Pool
                  </Text>
                  <VStack align="stretch" spacing={1} fontSize="xs" fontVariantNumeric="tabular-nums">
                    {matchStats.map((s) => {
                      const short = (SLOT_LABELS[s.slot] ?? s.slot).toLowerCase();
                      const understocked = s.matches < s.needed;
                      return (
                        <HStack key={s.slot} justify="space-between" color="whiteAlpha.700">
                          <Text>{short}</Text>
                          <HStack spacing={3}>
                            <Tooltip
                              label={`${s.matches} entries pass archetype/skin/heat filters; need ${s.needed} to fill the scene`}
                              placement="left"
                              hasArrow
                              openDelay={300}
                            >
                              <Text color={understocked ? 'orange.300' : 'whiteAlpha.900'}>
                                {s.matches}
                                <Text as="span" color="whiteAlpha.400">
                                  {' '}/ {s.needed}
                                </Text>
                              </Text>
                            </Tooltip>
                            <Tooltip
                              label={`${s.perfectTone} entries match the tone exactly`}
                              placement="left"
                              hasArrow
                              openDelay={300}
                            >
                              <Text color={s.perfectTone > 0 ? 'yellow.300' : 'whiteAlpha.400'}>
                                {s.perfectTone}★
                              </Text>
                            </Tooltip>
                            {bias.length > 0 && (
                              <Tooltip
                                label={`${s.biasOverlap} entries share at least one selected bias tag`}
                                placement="left"
                                hasArrow
                                openDelay={300}
                              >
                                <Text color={s.biasOverlap > 0 ? 'blue.300' : 'whiteAlpha.400'}>
                                  {s.biasOverlap}↯
                                </Text>
                              </Tooltip>
                            )}
                          </HStack>
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>

                {debugVisible && (
                  <HStack justify="space-between">
                    <Text
                      fontSize="2xs"
                      textTransform="uppercase"
                      letterSpacing="wider"
                      color="whiteAlpha.500"
                    >
                      Aggregate tone
                    </Text>
                    <AggregateTone scene={scene} />
                  </HStack>
                )}
              </VStack>
            </GridItem>
          </Grid>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NarrativeJuicePanel;
