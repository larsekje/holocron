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
  Switch,
  Tag,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import {
  ALL_BIASES,
  computeToneTarget,
  getSkinProfile,
  JuiceArchetype,
  JuiceBias,
  JuiceEntry,
  JuiceTone,
  SKINS_BY_ARCHETYPE,
  listAvailableArchetypes,
} from '@/data/narrativeJuice';
import {
  useNarrativeJuiceStore,
  Scene,
  SceneCard,
  SceneCardKind,
  getMatchStats,
  getToneAvailability,
  getHeatAvailability,
  toneDistance,
} from '@/state/narrativeJuiceStore';

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

function nearestDescriptor(axis: keyof JuiceTone, value: number): string {
  const rounded = Math.round(value);
  return TONE_DESCRIPTORS[axis][rounded] ?? String(rounded);
}

const SLOT_LABELS: Record<string, string> = {
  atmosphere: 'Atmosphere',
  npc: 'NPCs',
  environmental: 'Environment',
  complication: 'Complication',
};

const STOP_VALUES = [-1, 0, 1, 2];
const WELL_BG = '#1a1c1f';

interface StopConfig {
  value: number;
  color: string;
  label?: string;
  count?: number;
  maxCount?: number;
}

function ballSize(count: number | undefined, max: number | undefined, isActive: boolean): number {
  if (count === undefined || max === undefined) return isActive ? 6 : 4;
  if (max <= 0) return isActive ? 3 : 2;
  if (count === 0) return isActive ? 3 : 2;
  const t = Math.min(1, count / max);
  const base = 3 + Math.round(t * 5);
  return isActive ? Math.min(9, base + 1) : base;
}

function ballOpacity(count: number | undefined, max: number | undefined, isActive: boolean): number {
  if (count === undefined || max === undefined) return isActive ? 1 : 0.42;
  if (count === 0) return isActive ? 0.55 : 0.18;
  if (isActive) return 1;
  const t = max > 0 ? Math.min(1, count / max) : 0;
  return 0.35 + t * 0.45;
}

function StepSlider({
  stops,
  value,
  thumbFocusColor,
  fractional,
}: {
  stops: StopConfig[];
  value: number;
  thumbFocusColor: string;
  fractional?: boolean;
}) {
  const min = stops[0].value;
  const max = stops[stops.length - 1].value;
  return (
    <Slider min={min} max={max} step={fractional ? 0.01 : 1} value={value} isReadOnly focusThumbOnChange={false} h="18px">
      <SliderTrack
        bg={WELL_BG}
        h="4px"
        borderRadius="full"
        boxShadow="inset 0 1px 2px rgba(0,0,0,0.8), inset 0 -1px 0 rgba(255,255,255,0.06)"
      >
        <SliderFilledTrack bg="transparent" />
      </SliderTrack>
      {stops.map((s) => {
        const isActive = Math.abs(s.value - value) < 0.05;
        const size = ballSize(s.count, s.maxCount, isActive);
        const opacity = ballOpacity(s.count, s.maxCount, isActive);
        const tip = s.count !== undefined ? `${s.label ? `${s.label} · ` : ''}${s.count} entries available` : undefined;
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
              boxShadow={isActive ? `0 0 5px 1px ${s.color}, inset 0 0 1px rgba(255,255,255,0.5)` : 'inset 0 0.5px 0.5px rgba(0,0,0,0.4)'}
              transition="all 0.2s ease-out"
            />
          </SliderMark>
        );
      })}
      <SliderThumb
        boxSize="12px"
        border="none"
        bg="whiteAlpha.900"
        boxShadow="0 1px 2px rgba(0,0,0,0.55)"
        transition="left 0.2s ease-out"
        _focusVisible={{ boxShadow: `0 1px 2px rgba(0,0,0,0.55), 0 0 0 2px ${thumbFocusColor}99` }}
      />
    </Slider>
  );
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
  const stops: StopConfig[] = STOP_VALUES.map((v) => ({ value: v, color: axis.color, count: perValue?.[v], maxCount }));
  const nonZero = Math.abs(value) > 0.05;
  const numeric = `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
  return (
    <HStack spacing={2} align="center">
      <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wide" fontWeight="semibold" color="whiteAlpha.800" w="84px" flexShrink={0} whiteSpace="nowrap">
        {axis.label} <Text as="span" color="whiteAlpha.500" fontWeight="normal">{numeric}</Text>
      </Text>
      <Box flex="1" minW={0}>
        <StepSlider stops={stops} value={value} thumbFocusColor={axis.color} fractional />
      </Box>
      <Text fontSize="2xs" textAlign="right" color={nonZero ? axis.color : 'whiteAlpha.450'} fontWeight={nonZero ? 'semibold' : 'normal'} w="64px" flexShrink={0} noOfLines={1}>
        {nearestDescriptor(axis.key, value)}
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

const HEAT_COLORS: Record<1 | 2 | 3, string> = {
  1: '#63b3ed',
  2: '#f6ad55',
  3: '#fc8181',
};
const HEAT_LABELS: Record<1 | 2 | 3, string> = { 1: 'background', 2: 'brewing', 3: 'crisis' };

function DebugStrip({ entry }: { entry: JuiceEntry }) {
  const archetype = useNarrativeJuiceStore((s) => s.archetype);
  const skin = useNarrativeJuiceStore((s) => s.skin);
  const heat = useNarrativeJuiceStore((s) => s.heat);
  const bias = useNarrativeJuiceStore((s) => s.bias);
  const tone = useMemo(() => computeToneTarget(archetype, skin, heat, bias), [archetype, skin, heat, bias]);
  const fitDist = toneDistance(entry.tone, tone);
  const biasOverlap = entry.bias.filter((b) => (bias as string[]).includes(b)).length;
  const fitC = fitColor(fitDist);

  return (
    <HStack spacing={3} fontSize="2xs" mt={1} color="whiteAlpha.500" fontVariantNumeric="tabular-nums" flexWrap="wrap">
      <HStack spacing={2}>
        {TONE_AXES.map((a) => {
          const v = entry.tone[a.key];
          const tv = tone[a.key];
          const matches = Math.abs(v - tv) < 0.5;
          const tvFormatted = `${tv > 0 ? '+' : ''}${tv.toFixed(1)}`;
          return (
            <Tooltip key={a.key} label={`${a.label}: ${toneLabel(a.key, v)} (${v > 0 ? '+' : ''}${v}) · target ${tvFormatted}`} hasArrow openDelay={300}>
              <HStack spacing={1}>
                <Box w="5px" h="5px" borderRadius="full" bg={a.color} opacity={v === 0 ? 0.35 : matches ? 1 : 0.65} />
                <Text color={v === 0 ? 'whiteAlpha.500' : matches ? a.color : 'whiteAlpha.700'} fontWeight={matches && v !== 0 ? 'bold' : 'normal'}>
                  {toneLabel(a.key, v)}
                </Text>
              </HStack>
            </Tooltip>
          );
        })}
      </HStack>

      <Text color="whiteAlpha.300">·</Text>

      <HStack spacing={1}>
        <Text color="whiteAlpha.500">h</Text>
        {[1, 2, 3].map((h) => {
          const has = entry.heat === h;
          const isTarget = h === heat;
          const c = HEAT_COLORS[h as 1 | 2 | 3];
          return (
            <Text key={h} color={has ? (isTarget ? c : 'whiteAlpha.700') : 'whiteAlpha.200'} fontWeight={isTarget && has ? 'bold' : 'normal'}>
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

      <Tooltip label={`Tone distance ${fitDist}${biasOverlap > 0 ? `, bias overlap ${biasOverlap}` : ''}`} hasArrow openDelay={300}>
        <HStack spacing={1}>
          <Text color={fitC} fontWeight="bold">
            {fitDist === 0 ? '★' : `Δ${fitDist}`}
          </Text>
          {biasOverlap > 0 && <Text color="#63b3ed">↯{biasOverlap}</Text>}
        </HStack>
      </Tooltip>
    </HStack>
  );
}

// ─── Card visual variants ───────────────────────────────────────────────────
// Brief's CSS vars map to Chakra palette tokens here:
//   --color-background-info     → blue.900 + subtle alpha
//   --color-border-info         → blue.400
//   --color-background-warning  → orange.900 + alpha
//   --color-border-warning      → orange.400
//   --color-background-danger   → red.900 + alpha
//   --color-border-danger       → red.400

interface CardVariantStyle {
  bg: string;
  borderColor: string;
  borderWidth: string;
  pillBg: string;
  pillColor: string;
  bodyColor: string;
}

function variantStyle(kind: SceneCardKind, severity?: 'mild' | 'acute'): CardVariantStyle {
  if (kind === 'anchor') {
    return {
      bg: 'rgba(66, 153, 225, 0.16)',
      borderColor: 'blue.400',
      borderWidth: '2px',
      pillBg: 'blue.500',
      pillColor: 'white',
      bodyColor: 'whiteAlpha.900',
    };
  }
  if (kind === 'featured') {
    return {
      bg: 'whiteAlpha.50',
      borderColor: 'blue.400',
      borderWidth: '1px',
      pillBg: 'blue.500',
      pillColor: 'white',
      bodyColor: 'whiteAlpha.900',
    };
  }
  if (kind === 'complication') {
    if (severity === 'acute') {
      return {
        bg: 'rgba(245, 101, 101, 0.18)',
        borderColor: 'red.400',
        borderWidth: '1px',
        pillBg: 'red.500',
        pillColor: 'white',
        bodyColor: 'red.50',
      };
    }
    return {
      bg: 'rgba(246, 173, 85, 0.16)',
      borderColor: 'orange.300',
      borderWidth: '1px',
      pillBg: 'orange.400',
      pillColor: 'gray.900',
      bodyColor: 'orange.50',
    };
  }
  return {
    bg: 'whiteAlpha.50',
    borderColor: 'whiteAlpha.200',
    borderWidth: '1px',
    pillBg: 'whiteAlpha.200',
    pillColor: 'whiteAlpha.800',
    bodyColor: 'whiteAlpha.900',
  };
}

function cardLabel(card: SceneCard): string {
  switch (card.kind) {
    case 'atmosphere':
      return 'Atmosphere';
    case 'anchor':
      return 'Anchor';
    case 'featured':
      return 'Featured';
    case 'background':
      return 'Background';
    case 'environmental':
      return 'Environmental';
    case 'complication':
      return card.severity === 'acute' ? 'Complication · acute' : 'Complication';
    default:
      return card.kind;
  }
}

function CardPill({ style, children }: { style: CardVariantStyle; children: React.ReactNode }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      gap={1}
      px="7px"
      py="1px"
      borderRadius="999px"
      bg={style.pillBg}
      color={style.pillColor}
      fontSize="10px"
      fontWeight="500"
      textTransform="capitalize"
    >
      {children}
    </Box>
  );
}

function SceneCardView({
  card,
  index,
  debugVisible,
}: {
  card: SceneCard;
  index: number;
  debugVisible: boolean;
}) {
  const rerollCard = useNarrativeJuiceStore((s) => s.rerollCard);
  const style = variantStyle(card.kind, card.severity);
  const isAtmosphere = card.kind === 'atmosphere';

  // Concatenate atmosphere atoms into a single paragraph.
  const body = isAtmosphere
    ? card.entries.map((e) => e.text).join(' ')
    : card.entries[0]?.text ?? '';

  return (
    <Box
      bg={style.bg}
      border={`${style.borderWidth} solid`}
      borderColor={style.borderColor}
      borderRadius="md"
      px={card.kind === 'anchor' ? '11px' : '12px'}
      py={card.kind === 'anchor' ? '9px' : '10px'}
      mb={2}
    >
      <HStack justify="space-between" align="start" mb={1.5}>
        <HStack spacing={1.5} flexWrap="wrap">
          <CardPill style={style}>
            {card.kind === 'anchor' && (
              <Box as="span" mr="2px" aria-hidden>
                {/* tabler flame; codebase uses tabler-icons via class names elsewhere */}
                <i className="ti ti-flame" />
              </Box>
            )}
            {cardLabel(card)}
          </CardPill>
          {/* Secondary pills surface NPC composition + mode so the GM can read
              the room at a glance. */}
          {card.entries[0]?.npc_composition && (
            <Box as="span" px="7px" py="1px" borderRadius="999px" bg="whiteAlpha.150" color="whiteAlpha.700" fontSize="10px" fontWeight="500" textTransform="capitalize">
              {card.entries[0].npc_composition}
            </Box>
          )}
          {card.entries[0]?.npc_mode && (
            <Box as="span" px="7px" py="1px" borderRadius="999px" bg="whiteAlpha.100" color="whiteAlpha.600" fontSize="10px" fontWeight="500" textTransform="capitalize">
              {card.entries[0].npc_mode}
            </Box>
          )}
        </HStack>
        <Tooltip label="Re-roll this card" placement="left" hasArrow openDelay={400}>
          <IconButton
            aria-label="Re-roll this card"
            icon={<RepeatIcon />}
            size="xs"
            variant="ghost"
            colorScheme="whiteAlpha"
            isDisabled={card.entries.length === 0}
            onClick={() => rerollCard(index)}
          />
        </Tooltip>
      </HStack>
      <Text color={style.bodyColor} fontSize="sm" lineHeight="1.7">
        {body || (
          <Text as="span" color="whiteAlpha.400" fontStyle="italic">
            No entry available — bank may be incomplete for this combination.
          </Text>
        )}
      </Text>
      {debugVisible && card.entries.length > 0 && (
        <VStack align="stretch" spacing={0.5} mt={2} pl={1}>
          {card.entries.map((entry, i) => (
            <DebugStrip key={`${entry.text}-${i}`} entry={entry} />
          ))}
        </VStack>
      )}
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

  return (
    <Box pb={2} borderBottom="1px solid" borderColor="whiteAlpha.150">
      <Heading size="sm" color="whiteAlpha.900" textTransform="capitalize" mb={0.5} letterSpacing="wide">
        {title}
      </Heading>
      <HStack spacing={2} fontSize="xs" color="whiteAlpha.600" flexWrap="wrap" textTransform="capitalize">
        <Text>{archLabel}</Text>
        <Text color="whiteAlpha.400">·</Text>
        <Text color="whiteAlpha.800" fontWeight="medium">{toneSummary}</Text>
        <Text color="whiteAlpha.400">·</Text>
        <Text color={HEAT_COLORS[heat]}>Heat {heat} · {HEAT_LABELS[heat]}</Text>
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

function AggregateTone({ scene }: { scene: Scene }) {
  const tone = useMemo(() => {
    const entries: JuiceEntry[] = [];
    for (const card of scene.cards) entries.push(...card.entries);
    if (entries.length === 0) return null;
    const avg = (k: keyof JuiceTone) => entries.reduce((sum, e) => sum + e.tone[k], 0) / entries.length;
    return { pulpy: avg('pulpy'), seedy: avg('seedy'), intrigue: avg('intrigue'), refined: avg('refined') };
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

  const tone = useMemo(() => computeToneTarget(archetype, skin, heat, bias), [archetype, skin, heat, bias]);
  const [debugVisible, setDebugVisible] = React.useState(false);

  // Auto-roll once when first opened so the panel isn't empty.
  useEffect(() => {
    if (isOpen && scene.cards.length === 0) {
      rollScene();
    }
  }, [isOpen, scene, rollScene]);

  const archetypes = listAvailableArchetypes();
  const skins = SKINS_BY_ARCHETYPE[archetype];

  const matchStats = useMemo(() => getMatchStats(archetype, skin, tone, heat, bias), [archetype, skin, tone, heat, bias]);
  const toneAvailability = useMemo(() => getToneAvailability(archetype, skin, heat), [archetype, skin, heat]);
  const heatAvailability = useMemo(() => getHeatAvailability(archetype, skin), [archetype, skin]);

  return (
    <Modal isOpen={isOpen} onClose={close} size="5xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="#2F3136" color="whiteAlpha.900" maxH="86vh">
        <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.200" py={3} px={4} fontSize="md">
          <Heading size="sm">Narrative Juice</Heading>
        </ModalHeader>
        <ModalCloseButton top={2} right={2} />
        <ModalBody p={0}>
          <Grid templateColumns="280px 1fr" h="100%">
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
                  <Flex wrap="wrap" gap={1.5}>
                    {skins.map((s) => {
                      const active = s === skin;
                      const profile = getSkinProfile(archetype, s);
                      const tip = profile?.blurb ?? profile?.display_name ?? s.replace(/_/g, ' ');
                      return (
                        <Tooltip key={s} label={tip} placement="top" hasArrow openDelay={350}>
                          <Button
                            size="xs"
                            variant={active ? 'solid' : 'outline'}
                            colorScheme={active ? 'blue' : 'whiteAlpha'}
                            onClick={() => setSkin(active ? null : s)}
                            textTransform="capitalize"
                            fontWeight={active ? 'semibold' : 'normal'}
                          >
                            {s.replace(/_/g, ' ')}
                          </Button>
                        </Tooltip>
                      );
                    })}
                  </Flex>
                </Box>

                <Box>
                  <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    Heat
                  </Text>
                  <HStack spacing={1.5}>
                    {([1, 2, 3] as const).map((h) => {
                      const active = h === heat;
                      return (
                        <Button
                          key={h}
                          size="xs"
                          flex="1"
                          variant={active ? 'solid' : 'outline'}
                          colorScheme={active ? 'blue' : 'whiteAlpha'}
                          onClick={() => setHeat(h)}
                        >
                          {h} <Text as="span" ml={1} color={active ? 'whiteAlpha.800' : 'whiteAlpha.500'} fontSize="2xs">{HEAT_LABELS[h]}</Text>
                        </Button>
                      );
                    })}
                  </HStack>
                </Box>

                <Box>
                  <Flex justify="space-between" align="baseline" mb={1.5}>
                    <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.500">
                      Tone
                    </Text>
                    <Text fontSize="2xs" color="whiteAlpha.400">non-editable</Text>
                  </Flex>
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

                <HStack justify="space-between" align="center" pt={1}>
                  <Text fontSize="2xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider">
                    Debug
                  </Text>
                  <Switch size="sm" isChecked={debugVisible} onChange={(e) => setDebugVisible(e.target.checked)} colorScheme="blue" />
                </HStack>
              </VStack>
            </GridItem>

            {/* SCENE */}
            <GridItem p={4} overflowY="auto">
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between" align="center">
                  <SceneHeader archetype={archetype} skin={skin} tone={tone} heat={heat} bias={bias} />
                </HStack>
                <HStack justify="flex-end">
                  <Button leftIcon={<RepeatIcon />} colorScheme="blue" size="sm" onClick={rollScene}>
                    Reroll all
                  </Button>
                </HStack>

                {scene.cards.length === 0 ? (
                  <Text color="whiteAlpha.500" fontStyle="italic">— click Reroll all to generate a scene —</Text>
                ) : (
                  scene.cards.map((card, i) => (
                    <SceneCardView key={`${card.kind}-${i}`} card={card} index={i} debugVisible={debugVisible} />
                  ))
                )}

                <Divider borderColor="whiteAlpha.150" />

                <Box>
                  <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
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
                            <Tooltip label={`${s.matches} entries pass archetype/skin/heat filters; need ${s.needed} to fill the scene`} placement="left" hasArrow openDelay={300}>
                              <Text color={understocked ? 'orange.300' : 'whiteAlpha.900'}>
                                {s.matches}
                                <Text as="span" color="whiteAlpha.400"> / {s.needed}</Text>
                              </Text>
                            </Tooltip>
                            <Tooltip label={`${s.perfectTone} entries match the tone exactly`} placement="left" hasArrow openDelay={300}>
                              <Text color={s.perfectTone > 0 ? 'yellow.300' : 'whiteAlpha.400'}>{s.perfectTone}★</Text>
                            </Tooltip>
                            {bias.length > 0 && (
                              <Tooltip label={`${s.biasOverlap} entries share at least one selected bias tag`} placement="left" hasArrow openDelay={300}>
                                <Text color={s.biasOverlap > 0 ? 'blue.300' : 'whiteAlpha.400'}>{s.biasOverlap}↯</Text>
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
                    <Text fontSize="2xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.500">
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
