import React, { useState } from 'react';
import {
  Box,
  Center,
  Collapse,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Text,
  Tooltip,
  VStack,
  keyframes,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import type {
  DicePool,
  DieRoll,
  DieType,
  RollResult,
  SymbolTotals,
} from '@/engine/diceEngine';
import type { SymbolKind } from './DiceChip';
import { ReactComponent as AbilitySvg } from '@/assets/dice/ability.svg';
import { ReactComponent as ProficiencySvg } from '@/assets/dice/proficiency.svg';
import { ReactComponent as DifficultySvg } from '@/assets/dice/difficulty.svg';
import { ReactComponent as ChallengeSvg } from '@/assets/dice/challenge.svg';
import { ReactComponent as BoostSvg } from '@/assets/dice/boost.svg';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as ForceSvg } from '@/assets/dice/force.svg';
import useDiceRollerStore, { type BonusSymbolKind } from '@/state/diceRollerStore';
import useParticipantStore, { type DicePouch } from '@/state/participantsStore';
import { DifficultyRangeList } from './DifficultyRangeList';
import { POLY_DICE, type PolyDie } from '@/engine/polyDice';
import { PolyDieShape } from './polyDieVisuals';

interface PoolBuilderProps {
  pool: DicePool;
  result: RollResult | null;
}

const DIE_ORDER: DieType[] = [
  'ability',
  'proficiency',
  'difficulty',
  'challenge',
  'boost',
  'setback',
  'force',
];

const DIE_LABEL: Record<DieType, string> = {
  ability: 'Ability',
  proficiency: 'Proficiency',
  difficulty: 'Difficulty',
  challenge: 'Challenge',
  boost: 'Boost',
  setback: 'Setback',
  force: 'Force',
};

const DIE_SVG: Record<DieType, React.ComponentType<{ width?: number | string }>> = {
  ability: AbilitySvg,
  proficiency: ProficiencySvg,
  difficulty: DifficultySvg,
  challenge: ChallengeSvg,
  boost: BoostSvg,
  setback: SetbackSvg,
  force: ForceSvg,
};

// Raw symbols the user can inject without rolling — left-to-right ordered so
// "good for me" symbols come first, then "bad for me", then Force pips.
const BONUS_SYMBOL_ORDER: { kind: SymbolKind; storeKey: 'success' | 'advantage' | 'triumph' | 'failure' | 'threat' | 'despair' | 'light' | 'dark'; label: string }[] = [
  { kind: 'success',   storeKey: 'success',   label: 'Success' },
  { kind: 'advantage', storeKey: 'advantage', label: 'Advantage' },
  { kind: 'triumph',   storeKey: 'triumph',   label: 'Triumph' },
  { kind: 'failure',   storeKey: 'failure',   label: 'Failure' },
  { kind: 'threat',    storeKey: 'threat',    label: 'Threat' },
  { kind: 'despair',   storeKey: 'despair',   label: 'Despair' },
  { kind: 'lightside', storeKey: 'light',     label: 'Light pip' },
  { kind: 'darkside',  storeKey: 'dark',      label: 'Dark pip' },
];

// Tumble + bounce while rolling. Three full rotations with two arcing bounces,
// finishing settled at the original orientation. Pairs with hiding the symbol
// overlay until rolling=false so the face only "appears" once the die settles.
const rollAnim = keyframes`
  0%   { transform: translateY(0)     rotate(0)      scale(1);    }
  18%  { transform: translateY(-14px) rotate(220deg) scale(1.06); }
  36%  { transform: translateY(0)     rotate(440deg) scale(1);    }
  55%  { transform: translateY(-9px)  rotate(660deg) scale(1.04); }
  75%  { transform: translateY(0)     rotate(880deg) scale(1);    }
  90%  { transform: translateY(-2px)  rotate(1050deg) scale(1);   }
  100% { transform: translateY(0)     rotate(1080deg) scale(1);   }
`;

function symbolsList(face: SymbolTotals): { kind: SymbolKind; n: number }[] {
  const out: { kind: SymbolKind; n: number }[] = [];
  if (face.success)   out.push({ kind: 'success',    n: face.success   });
  if (face.failure)   out.push({ kind: 'failure',    n: face.failure   });
  if (face.advantage) out.push({ kind: 'advantage',  n: face.advantage });
  if (face.threat)    out.push({ kind: 'threat',     n: face.threat    });
  if (face.triumph)   out.push({ kind: 'triumph',    n: face.triumph   });
  if (face.despair)   out.push({ kind: 'despair',    n: face.despair   });
  if (face.light)     out.push({ kind: 'lightside',  n: face.light     });
  if (face.dark)      out.push({ kind: 'darkside',   n: face.dark      });
  return out;
}

const PoolDie: React.FC<{ die: DieType; roll?: DieRoll; rolling: boolean; source?: string }> = ({
  die,
  roll,
  rolling,
  source,
}) => {
  const Svg = DIE_SVG[die];
  const removeDie = useDiceRollerStore((s) => s.removeDie);
  const isRolled = !!roll;
  const symbols = isRolled ? symbolsList(roll.symbols) : [];
  const isBlank = isRolled && symbols.length === 0;
  const totalSymbols = symbols.reduce((n, s) => n + s.n, 0);
  const symbolFont = totalSymbols >= 3 ? '11px' : totalSymbols === 2 ? '14px' : '20px';
  const isDarkDie = die === 'force' || die === 'challenge' || die === 'setback';

  // Tooltip shows only the source — the rolled face is already visible on
  // the die itself, so a "→ 2 advantage" suffix is just noise.
  const tip = source ?? DIE_LABEL[die];

  return (
    <Tooltip label={tip} placement="top" hasArrow openDelay={400}>
      <Box
        data-die={die}
        data-source={source}
        position="relative"
        w="56px"
        minH="56px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        animation={rolling ? `${rollAnim} 700ms cubic-bezier(0.2, 0.6, 0.3, 1)` : undefined}
        cursor={isRolled ? 'default' : 'pointer'}
        onClick={() => {
          if (!isRolled) removeDie(die);
        }}
      >
        <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center">
          <Svg width={52} />
        </Box>
        {isRolled && !isBlank && !rolling && (
          <VStack
            spacing="-1px"
            position="relative"
            sx={{
              '& .icon, & .icon::before, & .icon::after': {
                color: isDarkDie ? 'whiteAlpha.900' : 'blackAlpha.800',
                fontSize: symbolFont,
                lineHeight: 1,
                top: 0,
              },
            }}
          >
            {symbols.flatMap((s, i) =>
              Array.from({ length: s.n }).map((_, j) => (
                <Box
                  key={`${i}-${j}`}
                  className={`icon ${s.kind}`}
                  fontSize={symbolFont}
                  lineHeight={1}
                  display="block"
                />
              )),
            )}
          </VStack>
        )}
      </Box>
    </Tooltip>
  );
};

// Palette die — click adds a die to the pool, right-click removes one.
const PaletteDie: React.FC<{ die: DieType }> = ({ die }) => {
  const Svg = DIE_SVG[die];
  const addDie = useDiceRollerStore((s) => s.addDie);
  const removeDie = useDiceRollerStore((s) => s.removeDie);
  return (
    <IconButton
      aria-label={`Add ${DIE_LABEL[die]}`}
      icon={<Svg width={36} />}
      variant="ghost"
      boxSize="48px"
      minW="48px"
      _hover={{ bg: 'whiteAlpha.100', transform: 'translateY(-1px)' }}
      transition="transform 80ms ease-out, background 120ms ease-out"
      onClick={() => addDie(die, 'Manual')}
      onContextMenu={(e) => {
        e.preventDefault();
        removeDie(die);
      }}
    />
  );
};

// Plain numbered dice share the pool with the narrative dice. Palette die adds
// one; right-click removes one. Smaller than narrative dice so they read as a
// secondary row.
const PolyPaletteDie: React.FC<{ die: PolyDie }> = ({ die }) => {
  const addPolyDie = useDiceRollerStore((s) => s.addPolyDie);
  const removePolyDie = useDiceRollerStore((s) => s.removePolyDie);
  return (
    <Tooltip label={`Add ${die}`} placement="top" hasArrow openDelay={400}>
      <Box
        as="button"
        w="40px"
        minH="42px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="md"
        _hover={{ bg: 'whiteAlpha.100', transform: 'translateY(-1px)' }}
        transition="transform 80ms ease-out, background 120ms ease-out"
        onClick={() => addPolyDie(die)}
        onContextMenu={(e) => {
          e.preventDefault();
          removePolyDie(die);
        }}
      >
        <PolyDieShape die={die} size={30} />
      </Box>
    </Tooltip>
  );
};

// A numbered die in the shared pool — tumbles with the same rollAnim as the
// narrative dice, hiding its value until it settles.
const PolyPoolDie: React.FC<{ die: PolyDie; value?: number; rolling: boolean }> = ({ die, value, rolling }) => {
  const removePolyDie = useDiceRollerStore((s) => s.removePolyDie);
  const isRolled = value != null;
  // Show the number only once the die has landed; blank while unrolled or
  // tumbling so the result "appears" on the settle.
  const showFace = isRolled && !rolling;
  return (
    <Tooltip label={isRolled ? `${die}: ${value}` : die} placement="top" hasArrow openDelay={400}>
      <Box
        position="relative"
        w="56px"
        minH="56px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        animation={rolling ? `${rollAnim} 700ms cubic-bezier(0.2, 0.6, 0.3, 1)` : undefined}
        cursor={isRolled ? 'default' : 'pointer'}
        onClick={() => {
          if (!isRolled) removePolyDie(die);
        }}
      >
        <PolyDieShape die={die} size={50} value={showFace ? value : undefined} blank={!showFace} />
      </Box>
    </Tooltip>
  );
};

function expandPolyPool(pool?: Partial<Record<PolyDie, number>>): PolyDie[] {
  const out: PolyDie[] = [];
  for (const d of POLY_DICE) {
    const n = pool?.[d] ?? 0;
    for (let i = 0; i < n; i++) out.push(d);
  }
  return out;
}

function expandPool(pool: DicePool): DieType[] {
  const out: DieType[] = [];
  for (const die of DIE_ORDER) {
    const n = pool[die] ?? 0;
    for (let i = 0; i < n; i++) out.push(die);
  }
  return out;
}

function expandSources(
  pool: DicePool,
  sources: Partial<Record<DieType, string[]>> | undefined,
): (string | undefined)[] {
  const out: (string | undefined)[] = [];
  for (const die of DIE_ORDER) {
    const n = pool[die] ?? 0;
    const arr = sources?.[die] ?? [];
    for (let i = 0; i < n; i++) out.push(arr[i]);
  }
  return out;
}

function pairRolls(dice: DieType[], rolls: DieRoll[]): (DieRoll | undefined)[] {
  const byType = new Map<DieType, DieRoll[]>();
  for (const r of rolls) {
    if (!byType.has(r.die)) byType.set(r.die, []);
    byType.get(r.die)!.push(r);
  }
  const cursor = new Map<DieType, number>();
  return dice.map((d) => {
    const i = cursor.get(d) ?? 0;
    cursor.set(d, i + 1);
    return byType.get(d)?.[i];
  });
}

// Always rendered so the modal doesn't grow when a roll lands. Pre-roll
// shows a muted placeholder of the same vertical footprint; post-roll
// shows the real Succeeded/Failed + symbol counts.
const ResultStrip: React.FC<{ result: RollResult | null; polyTotal?: number | null }> = ({ result, polyTotal }) => {
  const hasPoly = polyTotal != null;
  if (!result && !hasPoly) {
    return (
      <HStack spacing={4} align="baseline" wrap="wrap" minH="28px" opacity={0.4}>
        <Text fontSize="lg" fontWeight="bold" color="gray.500" letterSpacing="0.04em">
          Pending
        </Text>
        <Text fontSize="sm" color="gray.500">Roll to resolve</Text>
      </HStack>
    );
  }

  const polyChip = hasPoly ? (
    <HStack spacing={1} align="baseline">
      <Text fontSize="md" color="orange.300" fontWeight="bold">{polyTotal}</Text>
      <Text fontSize="sm" color="gray.400">dice total</Text>
    </HStack>
  ) : null;

  // Numbered-dice-only roll: just the total.
  if (!result) {
    return (
      <HStack spacing={4} align="baseline" wrap="wrap" minH="28px">
        {polyChip}
      </HStack>
    );
  }

  const { net } = result;
  const succeeded = net.succeeded;

  const counts: { kind: SymbolKind; n: number; label: string }[] = [];
  if (net.netSuccess > 0)   counts.push({ kind: 'success',   n: net.netSuccess,    label: net.netSuccess === 1 ? 'Success' : 'Successes' });
  if (net.netSuccess < 0)   counts.push({ kind: 'failure',   n: -net.netSuccess,   label: -net.netSuccess === 1 ? 'Failure' : 'Failures' });
  if (net.netAdvantage > 0) counts.push({ kind: 'advantage', n: net.netAdvantage,  label: net.netAdvantage === 1 ? 'Advantage' : 'Advantages' });
  if (net.netAdvantage < 0) counts.push({ kind: 'threat',    n: -net.netAdvantage, label: -net.netAdvantage === 1 ? 'Threat' : 'Threats' });
  if (net.triumph > 0)      counts.push({ kind: 'triumph',   n: net.triumph,       label: net.triumph === 1 ? 'Triumph' : 'Triumphs' });
  if (net.despair > 0)      counts.push({ kind: 'despair',   n: net.despair,       label: net.despair === 1 ? 'Despair' : 'Despairs' });
  if (net.light > 0)        counts.push({ kind: 'lightside', n: net.light,         label: net.light === 1 ? 'Light' : 'Light' });
  if (net.dark > 0)         counts.push({ kind: 'darkside',  n: net.dark,          label: net.dark === 1 ? 'Dark' : 'Dark' });

  return (
    <HStack spacing={4} align="baseline" wrap="wrap" minH="28px">
      <Text
        fontSize="lg"
        fontWeight="bold"
        color={succeeded ? 'green.300' : 'red.300'}
        letterSpacing="0.04em"
      >
        {succeeded ? 'Succeeded' : 'Failed'}
      </Text>
      {counts.length === 0 ? (
        <Text fontSize="sm" color="gray.500">No symbols</Text>
      ) : (
        <HStack spacing={3} wrap="wrap">
          {counts.map((s, i) => (
            <HStack key={i} spacing={1} align="baseline">
              <Text fontSize="md" color="gray.100" fontWeight="semibold">{s.n}</Text>
              <Box className={`icon ${s.kind}`} fontSize="16px" />
              <Text fontSize="sm" color="gray.400">{s.label}</Text>
            </HStack>
          ))}
        </HStack>
      )}
      {polyChip}
    </HStack>
  );
};

// Tokens that the receiver can fold straight into their pool as un-rolled
// dice. Skill-side dice (ability/proficiency/difficulty/challenge) land here
// when an entire pool was passed via Pass-to.
const POUCH_DIE_KINDS: (keyof DicePouch & DieType)[] = [
  'ability', 'proficiency', 'difficulty', 'challenge', 'boost', 'setback', 'force',
];

const POUCH_RAW_KINDS: (keyof DicePouch)[] = [
  'advantage',
  'threat',
  'triumph',
  'despair',
  'success',
  'failure',
];

const RAW_TO_ICON: Record<string, SymbolKind> = {
  advantage: 'advantage',
  threat: 'threat',
  triumph: 'triumph',
  despair: 'despair',
  success: 'success',
  failure: 'failure',
};

function summariseSources(sources: string[] | undefined): string {
  if (!sources || sources.length === 0) return '';
  // Group identical sources so "from Aqualish Thug" appears once with a count
  // when multiple identical tokens were deposited.
  const counts = new Map<string, number>();
  for (const s of sources) counts.set(s, (counts.get(s) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([s, n]) => (n > 1 ? `${s} ×${n}` : s))
    .join('\n');
}

const PouchDieEntry: React.FC<{
  kind: keyof DicePouch & DieType;
  count: number;
  participantId: string;
  sources?: string[];
}> = ({ kind, count, participantId, sources }) => {
  const Svg = DIE_SVG[kind];
  const addDie = useDiceRollerStore((s) => s.addDie);
  const removeDice = useParticipantStore((s) => s.removeDice);
  const ownerName = useParticipantStore(
    (s) => s.participants.find((p) => p.id === participantId)?.name ?? 'pouch',
  );
  const sourceLines = summariseSources(sources);
  const tipLabel = sourceLines
    ? `${count} ${DIE_LABEL[kind]} from:\n${sourceLines}\n\nClick to use one`
    : `${count} ${DIE_LABEL[kind]} from pouch — click to use one`;
  return (
    <Tooltip
      label={<span style={{ whiteSpace: 'pre-line' }}>{tipLabel}</span>}
      placement="top"
      hasArrow
      openDelay={300}
    >
      <Box
        as="button"
        position="relative"
        boxSize="40px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="md"
        _hover={{ bg: 'whiteAlpha.100', transform: 'translateY(-1px)' }}
        transition="transform 80ms ease-out, background 120ms ease-out"
        onClick={() => {
          addDie(kind, `Pouch (${ownerName})`);
          removeDice(participantId, kind, 1);
        }}
      >
        <Svg width={32} />
        <Box
          position="absolute"
          top="-4px"
          right="-4px"
          minW="16px"
          h="16px"
          px="4px"
          bg="orange.500"
          color="white"
          fontSize="10px"
          fontWeight="bold"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          {count}
        </Box>
      </Box>
    </Tooltip>
  );
};

// Map a pouch raw-symbol key to the engine's bonusSymbols key. They line up
// 1:1 — pouch and SymbolTotals share these field names.
const POUCH_TO_BONUS: Record<string, BonusSymbolKind> = {
  advantage: 'advantage',
  threat: 'threat',
  triumph: 'triumph',
  despair: 'despair',
  success: 'success',
  failure: 'failure',
};

const PouchSymbolEntry: React.FC<{
  kind: keyof DicePouch;
  count: number;
  participantId: string;
  sources?: string[];
}> = ({ kind, count, participantId, sources }) => {
  const iconClass = RAW_TO_ICON[kind] ?? kind;
  const addBonusSymbol = useDiceRollerStore((s) => s.addBonusSymbol);
  const removeDice = useParticipantStore((s) => s.removeDice);
  const bonusKind = POUCH_TO_BONUS[kind as string];
  const sourceLines = summariseSources(sources);
  const action = bonusKind
    ? 'Click to fold one into next roll'
    : 'Spend manually';
  const tipLabel = sourceLines
    ? `${count} ${kind} from:\n${sourceLines}\n\n${action}`
    : `${count} ${kind} from pouch — ${action.toLowerCase()}`;
  return (
    <Tooltip
      label={<span style={{ whiteSpace: 'pre-line' }}>{tipLabel}</span>}
      placement="top"
      hasArrow
      openDelay={300}
    >
      <HStack
        as="button"
        spacing={1}
        px={2}
        py={1}
        bg="gray.700"
        borderRadius="md"
        _hover={{ bg: 'gray.600' }}
        cursor={bonusKind ? 'pointer' : 'default'}
        onClick={() => {
          if (!bonusKind) return;
          addBonusSymbol(bonusKind, 1);
          removeDice(participantId, kind, 1);
        }}
      >
        <Text fontSize="xs" color="gray.100" fontWeight="semibold">{count}</Text>
        <Box className={`icon ${iconClass}`} fontSize="14px" />
      </HStack>
    </Tooltip>
  );
};

// Banked upgrade token: shows the upgraded die (Proficiency / Challenge)
// with an ↑ badge. Click applies one upgrade to the current pool.
const PouchUpgradeEntry: React.FC<{
  kind: 'upgrade' | 'upgradeDifficulty';
  count: number;
  participantId: string;
  sources?: string[];
}> = ({ kind, count, participantId, sources }) => {
  const upgradeDie = useDiceRollerStore((s) => s.upgradeDie);
  const removeDice = useParticipantStore((s) => s.removeDice);
  const ownerName = useParticipantStore(
    (s) => s.participants.find((p) => p.id === participantId)?.name ?? 'pouch',
  );
  const isAbility = kind === 'upgrade';
  const Svg = isAbility ? DIE_SVG.proficiency : DIE_SVG.challenge;
  const what = isAbility ? 'Ability → Proficiency' : 'Difficulty → Challenge';
  const sourceLines = summariseSources(sources);
  const tipLabel = sourceLines
    ? `${count} upgrade${count === 1 ? '' : 's'} (${what}) from:\n${sourceLines}\n\nClick to apply one`
    : `${count} upgrade${count === 1 ? '' : 's'} (${what}) — click to apply one`;
  return (
    <Tooltip
      label={<span style={{ whiteSpace: 'pre-line' }}>{tipLabel}</span>}
      placement="top"
      hasArrow
      openDelay={300}
    >
      <Box
        as="button"
        aria-label={`Apply upgrade: ${what}`}
        position="relative"
        boxSize="40px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="md"
        _hover={{ bg: 'whiteAlpha.100', transform: 'translateY(-1px)' }}
        transition="transform 80ms ease-out, background 120ms ease-out"
        onClick={() => {
          upgradeDie(isAbility ? 'ability' : 'difficulty', `Pouch upgrade (${ownerName})`);
          removeDice(participantId, kind, 1);
        }}
      >
        <Svg width={32} />
        <Text
          position="absolute"
          bottom="-2px"
          left="-2px"
          fontSize="14px"
          fontWeight="bold"
          color={isAbility ? 'yellow.300' : 'red.300'}
          lineHeight="1"
          pointerEvents="none"
          textShadow="0 0 3px black"
        >
          ↑
        </Text>
        <Box
          position="absolute"
          top="-4px"
          right="-4px"
          minW="16px"
          h="16px"
          px="4px"
          bg="orange.500"
          color="white"
          fontSize="10px"
          fontWeight="bold"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          {count}
        </Box>
      </Box>
    </Tooltip>
  );
};

const POUCH_UPGRADE_KINDS = ['upgrade', 'upgradeDifficulty'] as const;

const PouchStrip: React.FC<{ participantId: string }> = ({ participantId }) => {
  const participant = useParticipantStore((s) =>
    s.participants.find((p) => p.id === participantId),
  );
  const pouch = participant?.dicePouch;
  const sourcesByKind = participant?.dicePouchSources;
  if (!pouch) return null;

  const dieEntries = POUCH_DIE_KINDS
    .map((k) => [k, pouch[k] ?? 0] as const)
    .filter(([, n]) => n > 0);
  const symbolEntries = POUCH_RAW_KINDS
    .map((k) => [k, pouch[k] ?? 0] as const)
    .filter(([, n]) => n > 0);

  const upgradeEntries = POUCH_UPGRADE_KINDS
    .map((k) => [k, pouch[k] ?? 0] as const)
    .filter(([, n]) => n > 0);

  if (dieEntries.length === 0 && symbolEntries.length === 0 && upgradeEntries.length === 0) return null;

  return (
    <VStack align="start" spacing={1}>
      <Text
        fontSize="9px"
        color="gray.400"
        letterSpacing="0.16em"
        textTransform="uppercase"
        fontWeight="bold"
      >
        Pouch
      </Text>
      <HStack spacing={1} wrap="wrap">
        {dieEntries.map(([kind, n]) => (
          <PouchDieEntry
            key={kind}
            kind={kind as keyof DicePouch & DieType}
            count={n}
            participantId={participantId}
            sources={sourcesByKind?.[kind]}
          />
        ))}
        {upgradeEntries.map(([kind, n]) => (
          <PouchUpgradeEntry
            key={kind}
            kind={kind}
            count={n}
            participantId={participantId}
            sources={sourcesByKind?.[kind]}
          />
        ))}
        {symbolEntries.map(([kind, n]) => (
          <PouchSymbolEntry
            key={kind}
            kind={kind}
            count={n}
            participantId={participantId}
            sources={sourcesByKind?.[kind]}
          />
        ))}
      </HStack>
    </VStack>
  );
};

// Compact symbol +button used in the bonus-symbol palette. Click adds 1,
// right-click removes 1. The icon font draws in `#111` by default which
// disappears on the modal's dark background, so we force the glyph (and its
// outline pseudo-elements) to a light color here.
const BonusSymbolButton: React.FC<{
  kind: SymbolKind;
  storeKey: BonusSymbolKind;
  label: string;
}> = ({ kind, storeKey, label }) => {
  const addBonusSymbol = useDiceRollerStore((s) => s.addBonusSymbol);
  const removeBonusSymbol = useDiceRollerStore((s) => s.removeBonusSymbol);
  return (
    <Tooltip
      label={`Add ${label} (right-click to remove)`}
      placement="top"
      hasArrow
      openDelay={300}
    >
      <IconButton
        aria-label={`Add ${label}`}
        size="xs"
        variant="ghost"
        boxSize="28px"
        minW="28px"
        icon={
          <Box
            className={`icon ${kind}`}
            fontSize="18px"
            sx={{
              '&, &::before, &::after': { color: 'whiteAlpha.800' },
            }}
          />
        }
        _hover={{ bg: 'whiteAlpha.100' }}
        onClick={() => addBonusSymbol(storeKey, 1)}
        onContextMenu={(e) => {
          e.preventDefault();
          removeBonusSymbol(storeKey, 1);
        }}
      />
    </Tooltip>
  );
};

// Pre-roll bonus symbol rendered at the same size as a PoolDie so it sits
// inline with the rolled/un-rolled dice. Click removes one.
const BonusSymbolPip: React.FC<{ kind: SymbolKind; storeKey: BonusSymbolKind; label: string }> = ({
  kind,
  storeKey,
  label,
}) => {
  const removeBonusSymbol = useDiceRollerStore((s) => s.removeBonusSymbol);
  return (
    <Tooltip label={`${label} (pre-roll) — click to remove`} placement="top" hasArrow openDelay={300}>
      <Box
        as="button"
        position="relative"
        w="56px"
        h="56px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="md"
        _hover={{ bg: 'whiteAlpha.50' }}
        transition="background 120ms ease-out"
        onClick={() => removeBonusSymbol(storeKey, 1)}
      >
        <Box
          className={`icon ${kind}`}
          fontSize="34px"
          sx={{
            '&, &::before, &::after': { color: 'whiteAlpha.900' },
          }}
        />
      </Box>
    </Tooltip>
  );
};

function expandBonusPips(bonus: Partial<SymbolTotals>): { kind: SymbolKind; storeKey: BonusSymbolKind; label: string }[] {
  const out: { kind: SymbolKind; storeKey: BonusSymbolKind; label: string }[] = [];
  for (const b of BONUS_SYMBOL_ORDER) {
    const n = bonus[b.storeKey] ?? 0;
    for (let i = 0; i < n; i++) {
      out.push({ kind: b.kind, storeKey: b.storeKey, label: b.label });
    }
  }
  return out;
}

interface PoolBuilderPropsExt extends PoolBuilderProps {
  mode: import('./mockSnapshots').DiceRollMode;
  appliedPresetIds: string[];
  weaponRange?: import('./mockSnapshots').SnapshotWeapon['range'];
}

export const PoolBuilder: React.FC<PoolBuilderPropsExt> = ({
  pool,
  result,
  mode,
  appliedPresetIds,
  weaponRange,
}) => {
  const rolling = useDiceRollerStore((s) => s.rolling);
  const attackerId = useDiceRollerStore((s) => s.snapshot?.attackerParticipantId);
  const bonusSymbols = useDiceRollerStore((s) => s.snapshot?.bonusSymbols ?? {});
  const poolSources = useDiceRollerStore((s) => s.snapshot?.poolSources);
  const dice = expandPool(pool);
  const sources = expandSources(pool, poolSources);
  const totalDice = dice.length;
  const pairedRolls = result ? pairRolls(dice, result.rolls) : [];
  const polyPool = useDiceRollerStore((s) => s.snapshot?.polyPool);
  const polyResult = useDiceRollerStore((s) => s.snapshot?.polyResult);
  const polyDiceList = expandPolyPool(polyPool);
  const polyValues = polyResult ? polyResult.rolls.map((r) => r.value) : [];
  // Numbered dice palette is hidden behind a reveal — open it if some are
  // already pooled, otherwise it stays tucked away.
  const [polyOpen, setPolyOpen] = useState(polyDiceList.length > 0);

  // Fixed-column grid so the palette doesn't slide left/right when the pouch
  // empties or the difficulty list changes mode. Empty columns reserve their
  // width so the rest of the UI stays put.
  const showDifficultyList = mode !== 'opposed' && mode !== 'skillChallenge';
  return (
    <VStack align="stretch" spacing={5}>
      <Grid
        templateColumns="160px 1px 1fr 1px 160px"
        gap={3}
        alignItems="start"
      >
        <GridItem>
          {attackerId ? <PouchStrip participantId={attackerId} /> : null}
        </GridItem>
        <GridItem bg="gray.700" minH="100px" alignSelf="stretch" />
        <GridItem>
          <VStack align="stretch" spacing={1}>
            <HStack spacing={1} justify="center" wrap="wrap">
              {DIE_ORDER.map((die) => (
                <PaletteDie key={die} die={die} />
              ))}
            </HStack>
            <HStack spacing={0.5} justify="center" wrap="wrap">
              {BONUS_SYMBOL_ORDER.map((b) => (
                <BonusSymbolButton key={b.storeKey} kind={b.kind} storeKey={b.storeKey} label={b.label} />
              ))}
            </HStack>
            {/* Numbered dice (d4–d100) live behind a small reveal beneath the
                status symbols — out of the way until wanted; added dice still
                join this pool. */}
            {mode === 'basic' && (
              <VStack spacing={0} align="stretch">
                <Center>
                  <Tooltip
                    label={polyOpen ? 'Hide numbered dice' : 'Numbered dice (d4–d100)'}
                    placement="top"
                    openDelay={400}
                  >
                    <IconButton
                      aria-label="Toggle numbered dice"
                      size="xs"
                      variant="ghost"
                      h="14px"
                      minW="32px"
                      color="whiteAlpha.400"
                      _hover={{ color: 'whiteAlpha.700', bg: 'whiteAlpha.100' }}
                      icon={polyOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      onClick={() => setPolyOpen((v) => !v)}
                    />
                  </Tooltip>
                </Center>
                <Collapse in={polyOpen} animateOpacity>
                  <HStack spacing={0.5} justify="center" wrap="wrap" pt={0.5} pb={0.5}>
                    {POLY_DICE.map((d) => (
                      <PolyPaletteDie key={d} die={d} />
                    ))}
                  </HStack>
                </Collapse>
              </VStack>
            )}
          </VStack>
        </GridItem>
        <GridItem bg="gray.700" minH="100px" alignSelf="stretch" />
        <GridItem>
          {showDifficultyList && (
            <DifficultyRangeList
              mode={mode}
              appliedPresetIds={appliedPresetIds}
              weaponRange={weaponRange}
            />
          )}
        </GridItem>
      </Grid>

      <Box
        bg="gray.800"
        borderRadius="md"
        px={5}
        py={5}
        minH="96px"
        display="flex"
        flexDirection="column"
        alignItems="stretch"
        justifyContent={totalDice === 0 ? 'center' : 'flex-start'}
      >
        {(() => {
          const bonusPips = expandBonusPips(bonusSymbols);
          if (totalDice === 0 && bonusPips.length === 0 && polyDiceList.length === 0) {
            return (
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Click a die or symbol above to add to the pool.
              </Text>
            );
          }
          // Plain flex (not Chakra <Wrap>, which clips overflow) so the dice
          // can bounce up during the roll animation without being cut off.
          return (
            <Box display="flex" flexWrap="wrap" gap={3}>
              {dice.map((die, i) => (
                <PoolDie key={`d-${i}`} die={die} roll={pairedRolls[i]} rolling={rolling} source={sources[i]} />
              ))}
              {polyDiceList.map((d, i) => (
                <PolyPoolDie key={`p-${i}`} die={d} value={polyValues[i]} rolling={rolling} />
              ))}
              {bonusPips.map((b, i) => (
                <BonusSymbolPip key={`b-${i}`} kind={b.kind} storeKey={b.storeKey} label={b.label} />
              ))}
            </Box>
          );
        })()}
      </Box>

      <ResultStrip result={result} polyTotal={polyResult ? polyResult.total : null} />
    </VStack>
  );
};
