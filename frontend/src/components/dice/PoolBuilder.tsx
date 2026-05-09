import React from 'react';
import { Badge, Box, HStack, Text, Tooltip, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import type { DicePool, DieRoll, DieType, RollResult, SymbolTotals } from '@/engine/diceEngine';
import type { SymbolKind } from './DiceChip';

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

const DIE_COLORS: Record<DieType, { border: string; bg: string }> = {
  ability:     { border: 'green.400',       bg: 'green.900' },
  proficiency: { border: 'yellow.300',      bg: 'yellow.800' },
  difficulty:  { border: 'purple.400',      bg: 'purple.900' },
  challenge:   { border: 'red.400',         bg: 'red.900' },
  boost:       { border: 'blue.300',        bg: 'blue.900' },
  setback:     { border: 'gray.400',        bg: 'blackAlpha.700' },
  force:       { border: 'whiteAlpha.800',  bg: 'gray.700' },
};

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

const PoolDie: React.FC<{ die: DieType; roll?: DieRoll }> = ({ die, roll }) => {
  const colors = DIE_COLORS[die];
  const isRolled = !!roll;
  const symbols = isRolled ? symbolsList(roll.symbols) : [];
  const isBlank = isRolled && symbols.length === 0;

  const tip = isRolled
    ? `${DIE_LABEL[die]} → ${isBlank ? 'blank' : symbols.map((s) => `${s.n} ${s.kind}`).join(', ')}\nclick: remove · shift: upgrade · ctrl: downgrade`
    : `${DIE_LABEL[die]}\nclick: remove · shift: upgrade · ctrl: downgrade`;

  return (
    <Tooltip label={tip} placement="top" hasArrow openDelay={400} whiteSpace="pre-line">
      <Box
        as="button"
        type="button"
        onClick={() => undefined}
        bg={colors.bg}
        borderColor={colors.border}
        borderWidth="2px"
        borderRadius="md"
        minW="44px"
        minH="44px"
        px={2}
        py={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        _hover={{ borderColor: 'whiteAlpha.900', filter: 'brightness(1.15)' }}
      >
        {!isRolled && <Box className={`icon ${die}`} fontSize="22px" />}
        {isRolled && isBlank && <Box className={`icon ${die}`} fontSize="22px" opacity={0.25} />}
        {isRolled && !isBlank && (
          <HStack spacing={0}>
            {symbols.flatMap((s, i) =>
              Array.from({ length: s.n }).map((_, j) => (
                <Box key={`${i}-${j}`} className={`icon ${s.kind}`} fontSize="20px" />
              )),
            )}
          </HStack>
        )}
      </Box>
    </Tooltip>
  );
};

const AddDieButton: React.FC<{ die: DieType }> = ({ die }) => (
  <Tooltip label={`Add ${DIE_LABEL[die]}`} placement="top" hasArrow openDelay={300}>
    <Box
      as="button"
      type="button"
      onClick={() => undefined}
      bg="gray.900"
      borderColor={DIE_COLORS[die].border}
      borderWidth="1px"
      borderRadius="md"
      px={2}
      py={1}
      cursor="pointer"
      display="flex"
      alignItems="center"
      justifyContent="center"
      _hover={{ bg: DIE_COLORS[die].bg, borderWidth: '2px', px: '7px', py: '3px' }}
    >
      <Box className={`icon ${die}`} fontSize="20px" />
    </Box>
  </Tooltip>
);

function expandPool(pool: DicePool): DieType[] {
  const out: DieType[] = [];
  for (const die of DIE_ORDER) {
    const n = pool[die] ?? 0;
    for (let i = 0; i < n; i++) out.push(die);
  }
  return out;
}

/**
 * Group rolls by die type so we can pair each visible pool die with its rolled face.
 * Pool dice are rendered in DIE_ORDER (not engine insertion order), so we can't index
 * straight into result.rolls.
 */
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

export const PoolBuilder: React.FC<PoolBuilderProps> = ({ pool, result }) => {
  const dice = expandPool(pool);
  const totalDice = dice.length;
  const pairedRolls = result ? pairRolls(dice, result.rolls) : [];
  const net = result?.net;
  const succeeded = net?.succeeded ?? false;

  return (
    <VStack align="stretch" spacing={2}>
      {/* Add-dice row */}
      <HStack spacing={3} align="center">
        <Text fontSize="xs" color="gray.500" minW="36px">ADD</Text>
        <Wrap spacing={1.5}>
          {DIE_ORDER.map((die) => (
            <WrapItem key={die}>
              <AddDieButton die={die} />
            </WrapItem>
          ))}
        </Wrap>
      </HStack>

      {/* Pool / Result panel */}
      <Box
        bg="gray.800"
        borderRadius="md"
        borderWidth="1px"
        borderColor={result ? (succeeded ? 'green.700' : 'red.700') : 'gray.700'}
        p={3}
        minH="80px"
      >
        <HStack justify="space-between" mb={2} align="center" minH="22px">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em">
            {result ? 'Result' : `Pool · ${totalDice} ${totalDice === 1 ? 'die' : 'dice'}`}
          </Text>
          {net && (
            <HStack spacing={3}>
              <HStack spacing={2} fontSize="md" color="gray.100">
                {net.netSuccess > 0 && (
                  <HStack spacing={0.5}><Text>{net.netSuccess}</Text><Box className="icon success" fontSize="16px" /></HStack>
                )}
                {net.netSuccess < 0 && (
                  <HStack spacing={0.5}><Text>{-net.netSuccess}</Text><Box className="icon failure" fontSize="16px" /></HStack>
                )}
                {net.netAdvantage > 0 && (
                  <HStack spacing={0.5}><Text>{net.netAdvantage}</Text><Box className="icon advantage" fontSize="16px" /></HStack>
                )}
                {net.netAdvantage < 0 && (
                  <HStack spacing={0.5}><Text>{-net.netAdvantage}</Text><Box className="icon threat" fontSize="16px" /></HStack>
                )}
                {net.triumph > 0 && (
                  <HStack spacing={0.5}><Text>{net.triumph}</Text><Box className="icon triumph" fontSize="16px" /></HStack>
                )}
                {net.despair > 0 && (
                  <HStack spacing={0.5}><Text>{net.despair}</Text><Box className="icon despair" fontSize="16px" /></HStack>
                )}
                {net.light > 0 && (
                  <HStack spacing={0.5}><Text>{net.light}</Text><Box className="icon lightside" fontSize="16px" /></HStack>
                )}
                {net.dark > 0 && (
                  <HStack spacing={0.5}><Text>{net.dark}</Text><Box className="icon darkside" fontSize="16px" /></HStack>
                )}
              </HStack>
              <Badge
                colorScheme={succeeded ? 'green' : 'red'}
                variant="solid"
                fontSize="xs"
                px={2}
                py={0.5}
              >
                {succeeded ? 'Succeeded' : 'Failed'}
              </Badge>
            </HStack>
          )}
        </HStack>

        {totalDice === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
            Empty pool — click a die above to add.
          </Text>
        ) : (
          <Wrap spacing={1.5}>
            {dice.map((die, i) => (
              <WrapItem key={i}>
                <PoolDie die={die} roll={pairedRolls[i]} />
              </WrapItem>
            ))}
          </Wrap>
        )}
      </Box>
    </VStack>
  );
};
