import React from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Progress,
  Tag,
  Text,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import useGameplayStore from '@/state/newGameplayStore';
import { AddIcon, ExternalLinkIcon, MinusIcon, TimeIcon } from '@chakra-ui/icons';
import HotkeyHint from '@components/quickActions/HotkeyHint';
import useParticipantStore, {
  DicePouch as DicePouchType,
  isParticipantDead,
  type Participant,
} from '@/state/participantsStore';
import { useEffectStore } from '@/state/effectStore';
import { useQuickActionsStore, pouchIconString } from '@/state/quickActionsStore';
import useSessionLogStore from '@/state/sessionLogStore';
import { ReactComponent as AbilitySvg } from '@/assets/dice/ability.svg';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as DifficultySvg } from '@/assets/dice/difficulty.svg';
import { ReactComponent as ChallengeSvg } from '@/assets/dice/challenge.svg';
import { getDetail } from '@/data/spotlightIndex';
import { statify } from '@/utils/statify';
import { renderSwrpgText } from '@/utils/swrpgText';
import { talentNames } from '@/utils/talents';
import WoundBar from '@components/target/WoundBar';

// Talents are stored as bare names ("Quick Strike 2"). The spotlight index
// keys talents by a slug; strip the trailing rank-number then kebab-case
// what's left, prefix `talent_`. Matches the helper used in StatSheetOld so
// the description shown in the tooltip is the same the full sheet would show.
function talentSlugFromName(name: string): string {
  const stripped = name.replace(/\s+\d+$/, '').trim();
  return (
    'talent_' +
    stripped
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

function lookupTalentDescription(name: string): string | undefined {
  const detail = getDetail('talent', talentSlugFromName(name));
  return (detail as any)?.description;
}

// Parse the trailing rank off names like "Quick Strike 2". Default to rank 1
// (single-rank talents have no number on the chip).
function parseTalentRank(name: string): number {
  const m = name.match(/\s+(\d+)$/);
  return m ? parseInt(m[1], 10) : 1;
}

// Render the tooltip body for a talent chip. Pipes through statify (resolves
// `{ranks}`, `{ranks|times}`, `{ranks|boost}` etc. using the rank parsed from
// the chip name) and then renderSwrpgText (icons + colon-tags). Falls back
// to the bare name when no description is in the index.
function renderTalentTooltip(name: string): React.ReactNode {
  const desc = lookupTalentDescription(name);
  if (!desc) return name;
  const substituted = statify(desc, null, parseTalentRank(name));
  return renderSwrpgText(substituted);
}

// Pouch chip palette — matches the existing DicePouch component so the
// visual language stays consistent.
const POUCH_KINDS: { key: keyof DicePouchType; label: string; color: string }[] = [
  { key: 'boost', label: 'B', color: 'blue.300' },
  { key: 'setback', label: 'K', color: 'gray.400' },
  { key: 'advantage', label: 'A', color: 'green.300' },
  { key: 'threat', label: 'T', color: 'purple.300' },
  { key: 'success', label: 'S', color: 'yellow.300' },
  { key: 'failure', label: 'F', color: 'red.300' },
  { key: 'triumph', label: 'TR', color: 'yellow.500' },
  { key: 'despair', label: 'DE', color: 'red.500' },
  { key: 'force', label: 'FO', color: 'whiteAlpha.800' },
];

// Tier badge sizing
const DICE_BOX = 22;

// Renders the participant's tier as the matching narrative-dice icon. PCs use
// the green Ability die; Minions/Rivals/Nemeses use Setback/Difficulty/Challenge
// — same color language as the dice roller and adversary picker.
function TierIcon({ participant }: { participant: Participant }) {
  if (participant.isPC) return <AbilitySvg width={DICE_BOX} height={DICE_BOX} />;
  const type = participant.stats?.type ?? 'Minion';
  if (type === 'Nemesis') return <ChallengeSvg width={DICE_BOX} height={DICE_BOX} />;
  if (type === 'Rival') return <DifficultySvg width={DICE_BOX} height={DICE_BOX} />;
  return <SetbackSvg width={DICE_BOX} height={DICE_BOX} />;
}

// Prominent stat block (used for soak / defenses). Big number, small label.
function BigStat({ label, value, color = 'whiteAlpha.900' }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <VStack spacing={0} align="center" minW="38px">
      <Text fontSize="2xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wider" lineHeight="1">
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold" color={color} sx={{ fontVariantNumeric: 'tabular-nums' }} lineHeight="1.1">
        {value}
      </Text>
    </VStack>
  );
}

const MiniStatCard: React.FC = () => {
  const participants = useParticipantStore((s) => s.participants);
  const selectedId = useParticipantStore((s) => s.selectedParticipantId);
  const clearDicePouch = useParticipantStore((s) => s.clearDicePouch);
  const removeDice = useParticipantStore((s) => s.removeDice);
  const removeCriticalInjury = useParticipantStore((s) => s.removeCriticalInjury);
  const addWounds = useParticipantStore((s) => s.addWounds);
  const openFullSheet = useQuickActionsStore((s) => s.openFullSheet);
  const removeWounds = useParticipantStore((s) => s.removeWounds);
  const addStrain = useParticipantStore((s) => s.addStrain);
  const removeStrain = useParticipantStore((s) => s.removeStrain);
  const effects = useEffectStore((s) => s.effects);
  const removeEffect = useEffectStore((s) => s.removeEffect);
  const activeParticipantId = useGameplayStore((s) => s.context.activeParticipantId);
  const setActiveParticipantId = useGameplayStore((s) => s.setActiveParticipantId);

  const participant = participants.find((p) => p.id === selectedId) ?? null;

  // Fixed shell so the targets list below never shifts when cycling between
  // targets, regardless of how many talents/effects/pouch chips they have.
  // Content scrolls inside the box when it overflows.
  const CARD_HEIGHT = '200px';

  if (!participant) {
    return (
      <Box
        mb={2}
        h={CARD_HEIGHT}
        p={2}
        borderRadius="md"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        bg="whiteAlpha.50"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="whiteAlpha.500" fontSize="xs" fontStyle="italic">
          Click a target to see its state here.
        </Text>
      </Box>
    );
  }

  const stats = participant.stats ?? {};
  const type = stats.type ?? (participant.isPC ? 'PC' : 'Minion');
  const isMinionGroup = stats.minions !== undefined;
  const tracksStrain = participant.isPC || type === 'Nemesis';
  const selectedIsActive = participant.id === activeParticipantId;

  const wt = stats.woundThreshold ?? (participant.isPC ? 12 : 8);
  const wounds = stats.wounds ?? 0;
  const strain = (stats as any).strain ?? 0;
  const strainThreshold = (stats as any).strainThreshold ?? (participant.isPC ? 14 : 0);
  const soak = stats.soak ?? 0;
  const meleeDefense = stats.meleeDefense ?? 0;
  const rangedDefense = stats.rangedDefense ?? 0;
  const dead = isParticipantDead(participant);

  // Minion-group alive count: initial size minus floor(wounds / per-minion threshold).
  const initialMinions = isMinionGroup ? (stats.minions as number) : 0;
  const aliveMinions = isMinionGroup
    ? Math.max(initialMinions - Math.floor(wounds / Math.max(wt, 1)), 0)
    : 0;

  // Total wound capacity — per-minion threshold × group size for minion
  // groups, else just the threshold. The wound bar + the n/total readout
  // both work off this so a minion group reads correctly.
  const groupTotal = isMinionGroup ? wt * initialMinions : wt;
  const strainPct = strainThreshold > 0 ? Math.min(100, (strain / strainThreshold) * 100) : 0;

  const pouch = participant.dicePouch;
  const pouchEntries = pouch
    ? POUCH_KINDS.filter((k) => (pouch[k.key] ?? 0) > 0).map((k) => ({
        ...k,
        count: pouch[k.key] as number,
      }))
    : [];

  const crits = participant.criticalInjuries ?? [];
  const talents: string[] = talentNames(stats.talents);

  // Effects targeting this participant. Shown as a separate chip row with
  // hover-tooltip descriptions and click-to-dispel — the row badges on
  // TargetCardOld are a glanceable preview; this is the manage view.
  const myEffects = effects.filter(
    (e) => e.target.type === 'character' && e.target.participantId === participant.id,
  );

  return (
    <Box
      mb={2}
      p={2.5}
      h={CARD_HEIGHT}
      overflowY="auto"
      borderRadius="md"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      bg="whiteAlpha.50"
      opacity={dead ? 0.55 : 1}
      display="flex"
      flexDirection="column"
      gap={2}
      flexShrink={0}
    >
      {/* Row 1: tier dice icon + name + DOWN; right side: Set Active button */}
      <Flex align="center" justify="space-between" gap={2}>
        <HStack spacing={2} minW={0}>
          <Tooltip label={type} hasArrow openDelay={400}>
            <Box flexShrink={0}><TierIcon participant={participant} /></Box>
          </Tooltip>
          <VStack align="start" spacing={0} minW={0}>
            <Text fontWeight="semibold" color="whiteAlpha.900" fontSize="md" noOfLines={2} lineHeight="1.15">
              {participant.name}
            </Text>
            {participant.originalName &&
              participant.originalName !== participant.name && (
                <Text fontSize="2xs" color="whiteAlpha.500" noOfLines={1} lineHeight="1">
                  {participant.originalName}
                </Text>
              )}
          </VStack>
          {dead && (
            <Text fontSize="2xs" color="red.300" textTransform="uppercase" letterSpacing="wider" flexShrink={0}>
              down
            </Text>
          )}
        </HStack>
        <HStack spacing={1} flexShrink={0}>
          <Button
            size="xs"
            colorScheme={selectedIsActive ? 'yellow' : 'blue'}
            variant={selectedIsActive ? 'solid' : 'outline'}
            isDisabled={selectedIsActive}
            onClick={() => setActiveParticipantId(participant.id)}
          >
            {selectedIsActive ? 'Active' : 'Set Active'}
          </Button>
          <Tooltip label="Open full character sheet (F)" hasArrow openDelay={400}>
            <Box position="relative">
              <IconButton
                aria-label="Open full character sheet"
                icon={<ExternalLinkIcon/>}
                size="xs"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={() => openFullSheet()}
              />
              <HotkeyHint>F</HotkeyHint>
            </Box>
          </Tooltip>
        </HStack>
      </Flex>

      {/* Row 2: prominent stat block — soak / m-def / r-def / minions */}
      <HStack spacing={4} justify="flex-start" align="center" px={1}>
        <BigStat label="Soak" value={soak} />
        <Box w="1px" h="28px" bg="whiteAlpha.200" />
        <BigStat label="M-Def" value={meleeDefense} />
        <BigStat label="R-Def" value={rangedDefense} />
        {isMinionGroup && (
          <>
            <Box w="1px" h="28px" bg="whiteAlpha.200" />
            <BigStat
              label="Minions"
              value={`${aliveMinions}/${initialMinions}`}
              color={aliveMinions === 0 ? 'red.300' : 'whiteAlpha.900'}
            />
          </>
        )}
      </HStack>

      {/* Row 3: wound + (optional) strain bars, each with ±1 nudge buttons */}
      <HStack spacing={3} align="center">
        <HStack spacing={1.5} flex="1" minW={0}>
          <Text fontSize="2xs" color="whiteAlpha.500" w="14px" flexShrink={0}>W</Text>
          <Box flex="1" h="8px" borderRadius="full" overflow="hidden">
            <WoundBar
              wounds={wounds}
              total={groupTotal}
              minions={isMinionGroup ? initialMinions : undefined}
            />
          </Box>
          <Text
            fontSize="2xs"
            color="whiteAlpha.800"
            sx={{ fontVariantNumeric: 'tabular-nums' }}
            flexShrink={0}
            minW="46px"
            textAlign="right"
          >
            {wounds}/{groupTotal}
          </Text>
          <HStack spacing={0.5} flexShrink={0}>
            <Box position="relative">
              <IconButton
                aria-label="Heal 1 wound"
                icon={<MinusIcon boxSize="8px"/>}
                size="xs"
                h="16px"
                minW="16px"
                variant="ghost"
                onClick={() => removeWounds(participant.id, 1)}
              />
              <HotkeyHint>←</HotkeyHint>
            </Box>
            <Box position="relative">
              <IconButton
                aria-label="Apply 1 wound"
                icon={<AddIcon boxSize="8px"/>}
                size="xs"
                h="16px"
                minW="16px"
                variant="ghost"
                onClick={() => addWounds(participant.id, 1)}
              />
              <HotkeyHint>→</HotkeyHint>
            </Box>
          </HStack>
        </HStack>

        {tracksStrain && strainThreshold > 0 && (
          <HStack spacing={1.5} flex="1" minW={0}>
            <Text fontSize="2xs" color="whiteAlpha.500" w="14px" flexShrink={0}>S</Text>
            <Box flex="1">
              <Progress value={strainPct} size="xs" colorScheme="purple" bg="whiteAlpha.100" borderRadius="full" />
            </Box>
            <Text
              fontSize="2xs"
              color="whiteAlpha.800"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
              flexShrink={0}
              minW="46px"
              textAlign="right"
            >
              {strain}/{strainThreshold}
            </Text>
            <HStack spacing={0.5} flexShrink={0}>
              <Box position="relative">
                <IconButton
                  aria-label="Reduce 1 strain"
                  icon={<MinusIcon boxSize="8px"/>}
                  size="xs"
                  h="16px"
                  minW="16px"
                  variant="ghost"
                  onClick={() => removeStrain(participant.id, 1)}
                />
                <HotkeyHint>⇧←</HotkeyHint>
              </Box>
              <Box position="relative">
                <IconButton
                  aria-label="Add 1 strain"
                  icon={<AddIcon boxSize="8px"/>}
                  size="xs"
                  h="16px"
                  minW="16px"
                  variant="ghost"
                  onClick={() => addStrain(participant.id, 1)}
                />
                <HotkeyHint>⇧→</HotkeyHint>
              </Box>
            </HStack>
          </HStack>
        )}
      </HStack>

      {/* Row 4: pouch + crits chips, with "clear" affordance for the pouch.
          Effects intentionally aren't shown here — TargetCardOld renders them
          on each target row directly below this card. */}
      {(pouchEntries.length > 0 || crits.length > 0) && (
        <Box position="relative">
          <Wrap spacing={1} pr={pouchEntries.length > 0 ? '40px' : 0}>
            {pouchEntries.map((p) => (
              <WrapItem key={p.key}>
                <Tooltip
                  label="Click: −1 · Shift-click: clear this kind"
                  hasArrow openDelay={400} placement="top" shouldWrapChildren
                >
                  <Tag
                    size="sm"
                    variant="subtle"
                    bg="whiteAlpha.150"
                    px="6px"
                    py="0px"
                    cursor="pointer"
                    _hover={{ bg: 'whiteAlpha.250' }}
                    onClick={(e) => {
                      const amount = e.shiftKey ? p.count : 1;
                      removeDice(participant.id, p.key, amount);
                      useSessionLogStore.getState().log({
                        kind: 'effect-removed',
                        participantId: participant.id,
                        participantName: participant.name,
                        summary: `${pouchIconString(p.key, amount)} was removed from ${participant.name}'s pouch`,
                        tone: 'info',
                      });
                    }}
                  >
                    <Text as="span" color={p.color} fontWeight="bold" fontSize="2xs" mr={1}>{p.label}</Text>
                    <Text as="span" color="whiteAlpha.900" fontSize="2xs" sx={{ fontVariantNumeric: 'tabular-nums' }}>{p.count}</Text>
                  </Tag>
                </Tooltip>
              </WrapItem>
            ))}
            {crits.map((c) => (
              <WrapItem key={c.id}>
                <Tooltip
                  label={`${c.severity} · ${c.summary}`}
                  hasArrow
                  openDelay={300}
                  placement="top"
                  shouldWrapChildren
                  maxW="320px"
                >
                  <Tag
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    px="6px"
                    py="0px"
                    cursor="pointer"
                    _hover={{ bg: 'red.500', color: 'white' }}
                    onClick={() => {
                      removeCriticalInjury(participant.id, c.id);
                      useSessionLogStore.getState().log({
                        kind: 'crit-applied',
                        participantId: participant.id,
                        participantName: participant.name,
                        summary: `${participant.name}: dispelled crit — ${c.title}`,
                        tone: 'good',
                      });
                    }}
                  >
                    <Text fontSize="2xs">
                      {c.title} <Text as="span" color="red.200">· {c.severity}</Text>
                    </Text>
                  </Tag>
                </Tooltip>
              </WrapItem>
            ))}
          </Wrap>
          {pouchEntries.length > 0 && (
            <Tooltip label="Clear dice pouch" hasArrow openDelay={400}>
              <Text
                position="absolute" top="0" right="0"
                fontSize="2xs" color="whiteAlpha.500" cursor="pointer"
                _hover={{ color: 'whiteAlpha.800' }}
                onClick={() => {
                  clearDicePouch(participant.id);
                  useSessionLogStore.getState().log({
                    kind: 'effect-removed',
                    participantId: participant.id,
                    participantName: participant.name,
                    summary: `${participant.name}: pouch cleared`,
                    tone: 'info',
                  });
                }}
              >
                clear
              </Text>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Talents — bare chips, no section header. The tooltip prefers the
          looked-up description; if a talent isn't in the spotlight index (e.g.
          adversary-specific custom abilities) the chip name itself is the
          fallback label. `shouldWrapChildren` is required because Chakra's
          Tooltip can't forward refs through Tag cleanly. */}
      {/* Active effects — manageable view. Hover for description, click to
          dispel. Compact row keeps duration + name in one chip. */}
      {myEffects.length > 0 && (
        <Wrap spacing={1}>
          {myEffects.map((ae) => (
            <WrapItem key={ae.id}>
              <Tooltip
                label={ae.effect.description ?? ae.effect.name}
                hasArrow
                openDelay={300}
                placement="top"
                shouldWrapChildren
                maxW="320px"
              >
                <Tag
                  size="sm"
                  variant="subtle"
                  colorScheme="orange"
                  px="6px"
                  py="0px"
                  cursor="pointer"
                  _hover={{ bg: 'orange.300', color: 'gray.900' }}
                  onClick={() => removeEffect(ae.id)}
                >
                  <HStack spacing={1} align="center">
                    <Text fontSize="2xs" noOfLines={1} maxW="220px">
                      {ae.effect.name}
                    </Text>
                    {typeof ae.remainingDuration === 'number' && (
                      <HStack spacing="2px" align="center" color="orange.200">
                        <TimeIcon boxSize="9px"/>
                        <Text fontSize="2xs" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {ae.remainingDuration}
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                </Tag>
              </Tooltip>
            </WrapItem>
          ))}
        </Wrap>
      )}

      {talents.length > 0 && (
        <Wrap spacing={1}>
          {talents.map((t, i) => (
            <WrapItem key={`${t}-${i}`}>
              <Tooltip
                label={renderTalentTooltip(t)}
                hasArrow
                openDelay={300}
                placement="top"
                shouldWrapChildren
                maxW="320px"
              >
                <Tag size="sm" variant="subtle" bg="whiteAlpha.100" color="whiteAlpha.900" px="6px" py="0px">
                  <Text fontSize="2xs" noOfLines={1} maxW="200px">{t}</Text>
                </Tag>
              </Tooltip>
            </WrapItem>
          ))}
        </Wrap>
      )}
    </Box>
  );
};

export default MiniStatCard;
