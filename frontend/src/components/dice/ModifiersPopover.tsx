import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Collapse,
  HStack,
  Text,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { ReactComponent as BoostSvg } from '@/assets/dice/boost.svg';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as DifficultySvg } from '@/assets/dice/difficulty.svg';
import { ReactComponent as AbilitySvg } from '@/assets/dice/ability.svg';
import {
  CATEGORY_LABEL,
  MODIFIERS,
  type ModifierCategory,
  type ModifierEntry,
} from './modifiers';
import type { DiceRollMode } from './mockSnapshots';
import useDiceRollerStore from '@/state/diceRollerStore';

interface Props {
  mode: DiceRollMode;
  appliedModifierIds: string[];
}

// Per-category visual tints — keep them very subtle so the eye gets a quiet
// anchor without the panel screaming for attention.
const CATEGORY_TINT: Record<ModifierCategory, { bg: string; activeBg: string; border: string }> = {
  maneuver:      { bg: '#1f2733', activeBg: '#3a4f6b', border: '#2a3242' },
  combat:        { bg: '#2c1f1f', activeBg: '#7a3535', border: '#3a2a2a' },
  environmental: { bg: '#1f2920', activeBg: '#3a6b4f', border: '#2a3a2c' },
};

const EFFECT_ICON = {
  boost: BoostSvg,
  setback: SetbackSvg,
  difficulty: DifficultySvg,
  ability: AbilitySvg,
} as const;

// Effect glyphs now live in the tooltip — keeps the pill visually quiet.
const TooltipBody: React.FC<{ mod: ModifierEntry }> = ({ mod }) => {
  const chips: React.ReactNode[] = [];
  for (const key of ['boost', 'setback', 'difficulty', 'ability'] as const) {
    const value = mod.effect[key];
    if (!value) continue;
    const Svg = EFFECT_ICON[key];
    const sign = value > 0 ? '+' : '';
    chips.push(
      <HStack key={key} spacing={1}>
        <Text fontSize="xs" fontWeight="bold">{sign}{value}</Text>
        <Svg width={12} />
      </HStack>,
    );
  }
  return (
    <VStack align="start" spacing={1} maxW="280px">
      {chips.length > 0 && <HStack spacing={2}>{chips}</HStack>}
      <Text fontSize="xs">{mod.description}</Text>
    </VStack>
  );
};

const ModifierPill: React.FC<{
  mod: ModifierEntry;
  isOn: boolean;
  tint: { bg: string; activeBg: string; border: string };
}> = ({ mod, isOn, tint }) => {
  const toggleModifier = useDiceRollerStore((s) => s.toggleModifier);
  const hasEffect = Object.values(mod.effect).some((v) => v && v !== 0);
  return (
    <Tooltip
      label={<TooltipBody mod={mod} />}
      placement="top"
      hasArrow
      openDelay={400}
      bg="gray.800"
      borderColor="gray.700"
      borderWidth="1px"
    >
      <Button
        size="xs"
        bg={isOn ? tint.activeBg : tint.bg}
        color={isOn ? 'whiteAlpha.900' : 'whiteAlpha.800'}
        borderWidth="1px"
        borderColor={isOn ? tint.activeBg : tint.border}
        _hover={{ bg: isOn ? tint.activeBg : tint.border }}
        onClick={() => hasEffect && toggleModifier(mod)}
        isDisabled={!hasEffect}
        opacity={!hasEffect ? 0.5 : 1}
        px={2}
        fontWeight={isOn ? 'semibold' : 'normal'}
      >
        {mod.label}
      </Button>
    </Tooltip>
  );
};

const CATEGORY_ORDER: ModifierCategory[] = ['maneuver', 'combat', 'environmental'];

// Inline expandable bar of pill toggles for the PDF modifier tables (2-2,
// 2-7, 2-8). Collapsed by default with an active-count badge — opens to show
// grouped pills styled like the difficulty bar.
export const ModifiersPopover: React.FC<Props> = ({ mode, appliedModifierIds }) => {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const applied = new Set(appliedModifierIds);

  const visible = MODIFIERS.filter(
    (m) => m.modes.includes('any') || m.modes.includes(mode),
  );

  // Info-only entries (no dice effect) are noisy by default — collapse them
  // behind a "Show all" toggle so the default state is just the actionable
  // toggles. Always show info-only entries that the user has explicitly
  // toggled on so they don't disappear unexpectedly.
  const dropInfoOnly = (m: ModifierEntry) =>
    Object.values(m.effect).some((v) => v && v !== 0) || applied.has(m.id);

  const filtered = showAll ? visible : visible.filter(dropInfoOnly);
  const hiddenInfoCount = visible.length - filtered.length;

  const byCategory = filtered.reduce<Record<ModifierCategory, ModifierEntry[]>>(
    (acc, m) => {
      (acc[m.category] ||= []).push(m);
      return acc;
    },
    { maneuver: [], combat: [], environmental: [] },
  );

  const activeCount = appliedModifierIds.length;

  return (
    <VStack align="stretch" spacing={2}>
      <HStack justify="center">
        <Button
          size="xs"
          variant="ghost"
          colorScheme={activeCount > 0 ? 'orange' : 'gray'}
          onClick={() => setOpen((v) => !v)}
          rightIcon={
            <ChevronDownIcon
              transition="transform 150ms ease-out"
              transform={open ? 'rotate(180deg)' : 'rotate(0)'}
            />
          }
        >
          <HStack spacing={2}>
            <Text fontSize="xs" letterSpacing="0.08em" textTransform="uppercase">
              Modifiers
            </Text>
            {activeCount > 0 && (
              <Badge colorScheme="orange" variant="solid" fontSize="9px">
                {activeCount}
              </Badge>
            )}
          </HStack>
        </Button>
      </HStack>

      <Collapse in={open} animateOpacity>
        <VStack align="stretch" spacing={1} pt={1}>
          {CATEGORY_ORDER.map((cat) => {
            const entries = byCategory[cat];
            if (entries.length === 0) return null;
            const tint = CATEGORY_TINT[cat];
            return (
              <Box
                key={cat}
                borderLeftWidth="2px"
                borderColor={tint.border}
                pl={2}
                py={1}
              >
                <HStack align="start" spacing={3}>
                  <Text
                    fontSize="9px"
                    letterSpacing="0.16em"
                    textTransform="uppercase"
                    color="gray.500"
                    fontWeight="bold"
                    minW="80px"
                    pt="3px"
                  >
                    {CATEGORY_LABEL[cat]}
                  </Text>
                  <Wrap spacing={1} flex="1">
                    {entries.map((m) => (
                      <WrapItem key={m.id}>
                        <ModifierPill mod={m} isOn={applied.has(m.id)} tint={tint} />
                      </WrapItem>
                    ))}
                  </Wrap>
                </HStack>
              </Box>
            );
          })}
          {hiddenInfoCount > 0 && (
            <HStack justify="center" pt={1}>
              <Button
                size="2xs"
                variant="link"
                color="gray.500"
                fontSize="10px"
                onClick={() => setShowAll(true)}
              >
                + Show {hiddenInfoCount} info-only entr{hiddenInfoCount === 1 ? 'y' : 'ies'}
              </Button>
            </HStack>
          )}
          {showAll && (
            <HStack justify="center" pt={1}>
              <Button
                size="2xs"
                variant="link"
                color="gray.500"
                fontSize="10px"
                onClick={() => setShowAll(false)}
              >
                − Hide info-only
              </Button>
            </HStack>
          )}
        </VStack>
      </Collapse>
    </VStack>
  );
};
