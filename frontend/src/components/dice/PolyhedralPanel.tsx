import React from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
  keyframes,
} from '@chakra-ui/react';
import type { ModalSnapshot } from './mockSnapshots';
import useDiceRollerStore from '@/state/diceRollerStore';
import { POLY_DICE, type PolyDie, type PolyRollResult } from '@/engine/polyDice';

/** Per-die accent — makes each die type instantly recognisable. */
const DIE_COLOR: Record<PolyDie, string> = {
  d4: '#e06666',
  d6: '#e0934d',
  d8: '#d9c24d',
  d10: '#6bbf59',
  d12: '#4db6c8',
  d20: '#8a8fe6',
  d100: '#c87fd0',
};

/** Die silhouettes, drawn flat to match the narrative dice's polygon look:
 * d4 triangle, d6 square, d8 diamond, d10 point-down pentagon, d12 point-up
 * pentagon, d20 hexagon, d100 circle. viewBox is 0 0 100 100. */
const SHAPE: Record<PolyDie, React.ReactNode> = {
  d4: <polygon points="50,10 89,80 11,80" />,
  d6: <rect x="16" y="16" width="68" height="68" rx="12" />,
  d8: <polygon points="50,7 91,50 50,93 9,50" />,
  d10: <polygon points="50,93 89,55 74,11 26,11 11,55" />,
  d12: <polygon points="50,7 89,45 74,89 26,89 11,45" />,
  d20: <polygon points="50,5 89,27 89,73 50,95 11,73 11,27" />,
  d100: <circle cx="50" cy="50" r="44" />,
};

/** Tiny vertical text nudge so the label/value sits on each shape's visual
 * centre (a triangle's mass is low, etc.). Fraction of die size. */
const TEXT_DY: Partial<Record<PolyDie, number>> = { d4: 0.12, d12: 0.05, d10: -0.04 };

// Same tumble + bounce as the narrative dice (PoolBuilder.rollAnim) so the two
// modes feel identical when toggled.
const rollAnim = keyframes`
  0%   { transform: translateY(0)     rotate(0)      scale(1);    }
  18%  { transform: translateY(-14px) rotate(220deg) scale(1.06); }
  36%  { transform: translateY(0)     rotate(440deg) scale(1);    }
  55%  { transform: translateY(-9px)  rotate(660deg) scale(1.04); }
  75%  { transform: translateY(0)     rotate(880deg) scale(1);    }
  90%  { transform: translateY(-2px)  rotate(1050deg) scale(1);   }
  100% { transform: translateY(0)     rotate(1080deg) scale(1);   }
`;

const PolyDieShape: React.FC<{ die: PolyDie; size: number; label?: string; value?: number }> = ({
  die,
  size,
  label,
  value,
}) => {
  const color = DIE_COLOR[die];
  const showValue = value != null;
  const content = showValue ? String(value) : label;
  const fontSize = showValue ? Math.round(size * 0.36) : Math.round(size * 0.24);
  const dy = (TEXT_DY[die] ?? 0) * size;
  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} display="flex" alignItems="center" justifyContent="center">
      <Box position="absolute" inset={0}>
        <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
          <g fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth={3} strokeLinejoin="round">
            {SHAPE[die]}
          </g>
        </svg>
      </Box>
      {content && (
        <Text
          position="relative"
          fontWeight="bold"
          color="#15171b"
          fontSize={`${fontSize}px`}
          lineHeight="1"
          transform={dy ? `translateY(${dy}px)` : undefined}
        >
          {content}
        </Text>
      )}
    </Box>
  );
};

// Palette die — click adds one to the pool, right-click removes one.
const PolyPaletteDie: React.FC<{ die: PolyDie }> = ({ die }) => {
  const addPolyDie = useDiceRollerStore((s) => s.addPolyDie);
  const removePolyDie = useDiceRollerStore((s) => s.removePolyDie);
  return (
    <Tooltip label={`Add ${die}`} placement="top" hasArrow openDelay={400}>
      <Box
        as="button"
        boxSize="48px"
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
        <PolyDieShape die={die} size={40} label={die} />
      </Box>
    </Tooltip>
  );
};

// A die in the pool. Unrolled shows its type (d20); after the roll settles it
// shows the rolled value; during the tumble it shows neither (just the shape),
// mirroring how narrative dice hide their face until they land.
const PolyPoolDie: React.FC<{ die: PolyDie; value?: number; rolling: boolean }> = ({
  die,
  value,
  rolling,
}) => {
  const removePolyDie = useDiceRollerStore((s) => s.removePolyDie);
  const isRolled = value != null;
  return (
    <Tooltip label={isRolled ? `${die}: ${value}` : die} placement="top" hasArrow openDelay={400}>
      <Box
        position="relative"
        w="56px"
        h="56px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        animation={rolling ? `${rollAnim} 700ms cubic-bezier(0.2, 0.6, 0.3, 1)` : undefined}
        cursor={isRolled ? 'default' : 'pointer'}
        onClick={() => {
          if (!isRolled) removePolyDie(die);
        }}
      >
        <PolyDieShape
          die={die}
          size={52}
          label={!isRolled ? die : undefined}
          value={isRolled && !rolling ? value : undefined}
        />
      </Box>
    </Tooltip>
  );
};

// Mirrors PoolBuilder's ResultStrip: a muted "Pending" placeholder pre-roll,
// the summed Total once the dice settle.
const PolyResultStrip: React.FC<{ result: PolyRollResult | null; rolling: boolean }> = ({
  result,
  rolling,
}) => {
  if (!result || rolling) {
    return (
      <HStack spacing={4} align="baseline" minH="28px" opacity={0.4}>
        <Text fontSize="lg" fontWeight="bold" color="gray.500" letterSpacing="0.04em">
          Pending
        </Text>
        <Text fontSize="sm" color="gray.500">
          Roll to resolve
        </Text>
      </HStack>
    );
  }
  return (
    <HStack spacing={4} align="baseline" minH="28px">
      <Text fontSize="lg" fontWeight="bold" color="orange.300" letterSpacing="0.04em">
        Total
      </Text>
      <Text fontSize="2xl" fontWeight="extrabold" color="gray.50" lineHeight="1">
        {result.total}
      </Text>
    </HStack>
  );
};

function expandPolyPool(pool: ModalSnapshot['polyPool']): PolyDie[] {
  const out: PolyDie[] = [];
  for (const d of POLY_DICE) {
    const n = pool?.[d] ?? 0;
    for (let i = 0; i < n; i++) out.push(d);
  }
  return out;
}

export const PolyhedralPanel: React.FC<{ snapshot: ModalSnapshot }> = ({ snapshot }) => {
  const rollPoly = useDiceRollerStore((s) => s.rollPoly);
  const update = useDiceRollerStore((s) => s.update);
  const rolling = useDiceRollerStore((s) => s.rolling);

  const pool = snapshot.polyPool ?? {};
  const result = snapshot.polyResult ?? null;
  const dice = expandPolyPool(pool);
  // rollPolyPool emits values in POLY_DICE order, exactly as expandPolyPool
  // lays the dice out, so a positional zip lines values up with their dice.
  const values = result ? result.rolls.map((r) => r.value) : [];
  const totalDice = dice.length;

  return (
    <VStack align="stretch" spacing={5}>
      {/* Palette — same position/feel as the narrative die row. */}
      <HStack spacing={1} justify="center" wrap="wrap">
        {POLY_DICE.map((d) => (
          <PolyPaletteDie key={d} die={d} />
        ))}
      </HStack>

      {/* Pool — identical box + empty-state wording as PoolBuilder. */}
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
        {totalDice === 0 ? (
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Click a die above to add to the pool.
          </Text>
        ) : (
          <Wrap spacing={3}>
            {dice.map((d, i) => (
              <WrapItem key={i}>
                <PolyPoolDie die={d} value={values[i]} rolling={rolling} />
              </WrapItem>
            ))}
          </Wrap>
        )}
      </Box>

      <PolyResultStrip result={result} rolling={rolling} />

      <HStack spacing={2} width="100%">
        <Button
          size="md"
          flex="1"
          colorScheme="orange"
          letterSpacing="0.12em"
          textTransform="uppercase"
          isDisabled={totalDice === 0}
          isLoading={rolling}
          loadingText="Rolling…"
          onClick={rollPoly}
        >
          {result ? 'Re-roll' : 'Roll'}
        </Button>
        {totalDice > 0 && (
          <Button
            size="md"
            variant="ghost"
            color="gray.400"
            onClick={() => update({ polyPool: {}, polyResult: null })}
          >
            Clear
          </Button>
        )}
      </HStack>
    </VStack>
  );
};

export default PolyhedralPanel;
