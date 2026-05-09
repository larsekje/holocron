import React from 'react';
import { Badge, Box, Button, Collapse, HStack, Text, VStack, useDisclosure } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import type { RollResult } from '@/engine/diceEngine';
import type { DiceRollMode, SnapshotWeapon } from './mockSnapshots';

interface SpendOption {
  id: string;
  label: string;
  cost: { advantage?: number; threat?: number; triumph?: number; despair?: number };
  modes: ('any' | DiceRollMode)[];
  repeatable?: boolean;
}

const BASE_OPTIONS: SpendOption[] = [
  { id: 'recover-strain',    label: 'Recover 1 strain',                       cost: { advantage: 1 }, modes: ['any'],    repeatable: true },
  { id: 'boost-ally',        label: "Add Boost to ally's next check",         cost: { advantage: 1 }, modes: ['any'] },
  { id: 'notice-detail',     label: 'Notice an important detail',             cost: { advantage: 1 }, modes: ['any'] },
  { id: 'free-maneuver',     label: 'Perform a free maneuver',                cost: { advantage: 2 }, modes: ['combat'] },
  { id: 'setback-target',    label: "Add Setback to target's next check",     cost: { advantage: 2 }, modes: ['any'] },
  { id: 'negate-defense',    label: "Negate target's defensive bonuses",      cost: { advantage: 2 }, modes: ['combat'] },
  { id: 'force-drop-weapon', label: 'Force target to drop a weapon',          cost: { advantage: 3 }, modes: ['combat'] },
  { id: 'crit',              label: 'Inflict a Critical Injury',              cost: { triumph: 1 },   modes: ['combat'] },
  { id: 'destroy-equipment', label: "Destroy a piece of target's gear",       cost: { despair: 1 },   modes: ['combat'] },
];

function quirkOptionsForWeapon(weapon?: SnapshotWeapon): SpendOption[] {
  if (!weapon) return [];
  return weapon.qualities.map((q) => ({
    id: `activate-${q.name.toLowerCase().replace(/\s+/g, '-')}`,
    label: `Activate ${q.name}${q.rank ? ` ${q.rank}` : ''}`,
    cost: { advantage: 2 },
    modes: ['combat'] as const as ('any' | DiceRollMode)[],
  }));
}

interface SpendPanelProps {
  result: RollResult | null;
  mode: DiceRollMode;
  spent: { optionId: string }[];
  weapon?: SnapshotWeapon;
}

function affordable(option: SpendOption, available: { advantage: number; threat: number; triumph: number; despair: number }): boolean {
  if ((option.cost.advantage ?? 0) > available.advantage) return false;
  if ((option.cost.threat ?? 0)    > available.threat)    return false;
  if ((option.cost.triumph ?? 0)   > available.triumph)   return false;
  if ((option.cost.despair ?? 0)   > available.despair)   return false;
  return true;
}

const CostBadge: React.FC<{ cost: SpendOption['cost'] }> = ({ cost }) => (
  <HStack spacing={1} minW="36px" justify="flex-end">
    {!!cost.advantage && (
      <HStack spacing={0.5}><Text fontSize="xs" color="gray.300">{cost.advantage}</Text><Box className="icon advantage" fontSize="13px" /></HStack>
    )}
    {!!cost.threat && (
      <HStack spacing={0.5}><Text fontSize="xs" color="gray.300">{cost.threat}</Text><Box className="icon threat" fontSize="13px" /></HStack>
    )}
    {!!cost.triumph && (
      <HStack spacing={0.5}><Text fontSize="xs" color="gray.300">{cost.triumph}</Text><Box className="icon triumph" fontSize="13px" /></HStack>
    )}
    {!!cost.despair && (
      <HStack spacing={0.5}><Text fontSize="xs" color="gray.300">{cost.despair}</Text><Box className="icon despair" fontSize="13px" /></HStack>
    )}
  </HStack>
);

export const SpendPanel: React.FC<SpendPanelProps> = ({ result, mode, spent, weapon }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: spent.length > 0 });
  if (!result) return null;

  const allOptions = [
    ...BASE_OPTIONS.filter((o) => o.modes.includes('any') || o.modes.includes(mode)),
    ...quirkOptionsForWeapon(weapon),
  ];

  const available = {
    advantage: Math.max(0, result.net.netAdvantage),
    threat:    Math.max(0, -result.net.netAdvantage),
    triumph:   result.net.triumph,
    despair:   result.net.despair,
  };
  for (const s of spent) {
    const opt = allOptions.find((o) => o.id === s.optionId);
    if (!opt) continue;
    available.advantage -= opt.cost.advantage ?? 0;
    available.threat    -= opt.cost.threat    ?? 0;
    available.triumph   -= opt.cost.triumph   ?? 0;
    available.despair   -= opt.cost.despair   ?? 0;
  }

  const spentMap = spent.reduce<Record<string, number>>((acc, s) => {
    acc[s.optionId] = (acc[s.optionId] ?? 0) + 1;
    return acc;
  }, {});

  const renderableOptions = allOptions.filter(
    (o) => affordable(o, available) || (spentMap[o.id] ?? 0) > 0,
  );
  const totalAvailable = available.advantage + available.threat + available.triumph + available.despair;

  return (
    <Box bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
      <HStack
        as="button"
        type="button"
        onClick={onToggle}
        w="100%"
        px={3}
        py={2}
        justify="space-between"
        _hover={{ bg: 'whiteAlpha.50' }}
      >
        <HStack spacing={2}>
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.06em">
            Spends
          </Text>
          <Text fontSize="xs" color="gray.500">
            {renderableOptions.length} option{renderableOptions.length === 1 ? '' : 's'}
            {spent.length > 0 && ` · ${spent.length} spent`}
          </Text>
        </HStack>
        <HStack spacing={2} fontSize="xs" color="gray.300">
          {available.advantage > 0 && <HStack spacing={0.5}><Text>{available.advantage}</Text><Box className="icon advantage" fontSize="13px" /></HStack>}
          {available.threat    > 0 && <HStack spacing={0.5}><Text>{available.threat}</Text><Box className="icon threat" fontSize="13px" /></HStack>}
          {available.triumph   > 0 && <HStack spacing={0.5}><Text>{available.triumph}</Text><Box className="icon triumph" fontSize="13px" /></HStack>}
          {available.despair   > 0 && <HStack spacing={0.5}><Text>{available.despair}</Text><Box className="icon despair" fontSize="13px" /></HStack>}
          {totalAvailable === 0 && <Text color="gray.500">— all spent</Text>}
        </HStack>
      </HStack>
      <Collapse in={isOpen} animateOpacity>
        <Box px={2} pb={2}>
          {renderableOptions.length === 0 ? (
            <Text fontSize="xs" color="gray.500" px={2} pb={1}>No affordable spends.</Text>
          ) : (
            <VStack align="stretch" spacing={1}>
              {renderableOptions.map((opt) => {
                const spentCount = spentMap[opt.id] ?? 0;
                const canAfford = affordable(opt, available);
                return (
                  <HStack
                    key={opt.id}
                    spacing={2}
                    px={2}
                    py={1}
                    borderRadius="sm"
                    bg={spentCount > 0 ? 'purple.900' : 'transparent'}
                    opacity={canAfford || spentCount > 0 ? 1 : 0.5}
                    justify="space-between"
                  >
                    <HStack spacing={2} flex="1" minW={0}>
                      <CostBadge cost={opt.cost} />
                      <Text fontSize="sm" color="gray.100" noOfLines={1}>
                        {opt.label}
                      </Text>
                      {spentCount > 0 && (
                        <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                          {spentCount > 1 ? `×${spentCount}` : '✓'}
                        </Badge>
                      )}
                    </HStack>
                    <Button size="xs" variant="ghost" onClick={() => undefined} isDisabled={!canAfford}>
                      Spend
                    </Button>
                  </HStack>
                );
              })}
            </VStack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};
