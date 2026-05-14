import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  Text,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import type { RollResult } from '@/engine/diceEngine';
import type { DiceRollMode, ModalSnapshot, SnapshotWeapon } from './mockSnapshots';
import useDiceRollerStore from '@/state/diceRollerStore';
import useParticipantStore, { type DicePouch, type Participant } from '@/state/participantsStore';
import useFSMStore from '@/state/FSMStore';
import { useEffectStore } from '@/state/effectStore';
import { StatusFactories, type Effect, type EffectTarget } from '@/types/effectTypes';
import { nanoid } from 'nanoid';

type SpendTarget = 'self' | 'ally' | 'next-ally' | 'target' | 'any';

interface SpendOption {
  id: string;
  label: string;
  cost: { advantage?: number; threat?: number; triumph?: number; despair?: number };
  modes: ('any' | DiceRollMode)[];
  /** What the spend affects. 'self' = attacker, 'target' = combat target,
   * 'ally' = picker of any other participant, 'any' = picker of any
   * participant (including target/self), undefined = no participant target. */
  target?: SpendTarget;
  /** When set, depositing the named token+amount into the recipient's pouch
   * is the spend's mechanical effect (e.g. Advantage → Boost on ally). */
  passDice?: { kind: keyof DicePouch; amount: number };
  repeatable?: boolean;
  /** Escape hatch for spends with bespoke side-effects (recover-strain). */
  apply?: (snap: ModalSnapshot, recipientId?: string) => void;
  /** Inverse of apply — called when the spend is undone. */
  unapply?: (snap: ModalSnapshot, recipientId?: string) => void;
}

const BASE_OPTIONS: SpendOption[] = [
  // ---- Advantage / Triumph spends ---------------------------------------
  {
    id: 'recover-strain',
    label: 'Recover 1 strain',
    cost: { advantage: 1 },
    modes: ['any'],
    target: 'self',
    repeatable: true,
    apply: (snap) => {
      if (snap.attackerParticipantId) {
        useParticipantStore.getState().removeStrain(snap.attackerParticipantId, 1);
      }
    },
    unapply: (snap) => {
      if (snap.attackerParticipantId) {
        useParticipantStore.getState().addStrain(snap.attackerParticipantId, 1);
      }
    },
  },
  { id: 'boost-ally',        label: "Boost ally's next check",                cost: { advantage: 1 }, modes: ['any'],     target: 'next-ally', passDice: { kind: 'boost', amount: 1 } },
  { id: 'boost-specific-ally', label: 'Boost a specific ally',                cost: { advantage: 1 }, modes: ['any'],     target: 'ally',      passDice: { kind: 'boost', amount: 1 } },
  { id: 'notice-detail',     label: 'Notice an important detail',             cost: { advantage: 1 }, modes: ['any'] },
  { id: 'free-maneuver',     label: 'Perform a free maneuver',                cost: { advantage: 2 }, modes: ['combat'], target: 'self' },
  { id: 'setback-target',    label: "Setback on target's next check",         cost: { advantage: 2 }, modes: ['any'],     target: 'target', passDice: { kind: 'setback',  amount: 1 } },
  { id: 'negate-defense',    label: "Negate target's defensive bonuses",      cost: { advantage: 2 }, modes: ['combat'], target: 'target' },
  { id: 'force-drop-weapon', label: 'Force target to drop a weapon',          cost: { advantage: 3 }, modes: ['combat'], target: 'target' },
  { id: 'pass-triumph',      label: 'Pass Triumph to ally',                   cost: { triumph: 1 },   modes: ['any'],     target: 'ally',   passDice: { kind: 'triumph',  amount: 1 } },
  { id: 'crit',              label: 'Inflict a Critical Injury',              cost: { triumph: 1 },   modes: ['combat'], target: 'target' },

  // ---- Threat / Despair spends (PDF table 2-12) -------------------------
  {
    id: 'suffer-strain',
    label: 'Suffer 1 strain',
    cost: { threat: 1 },
    modes: ['any'],
    target: 'self',
    repeatable: true,
    apply: (snap) => {
      if (snap.attackerParticipantId) {
        useParticipantStore.getState().addStrain(snap.attackerParticipantId, 1);
      }
    },
    unapply: (snap) => {
      if (snap.attackerParticipantId) {
        useParticipantStore.getState().removeStrain(snap.attackerParticipantId, 1);
      }
    },
  },
  { id: 'lose-maneuver-benefit', label: 'Lose benefit of a prior maneuver',    cost: { threat: 1 }, modes: ['combat'] },
  { id: 'opponent-free-maneuver', label: 'Opponent gains a free maneuver',     cost: { threat: 2 }, modes: ['combat'], target: 'target' },
  { id: 'setback-self-next',     label: 'Setback on attacker’s next action',   cost: { threat: 2 }, modes: ['any'],     target: 'self',   passDice: { kind: 'setback', amount: 1 } },
  { id: 'fall-prone',            label: 'Active character falls prone',        cost: { threat: 3 }, modes: ['combat'], target: 'self' },
  { id: 'enemy-advantage-narr',  label: 'Grant enemy a significant advantage', cost: { threat: 3 }, modes: ['combat'] },

  { id: 'inflict-despair',   label: 'Inflict Despair on a foe',               cost: { despair: 1 },   modes: ['any'],     target: 'any',    passDice: { kind: 'despair',  amount: 1 } },
  { id: 'destroy-equipment', label: "Destroy a piece of target's gear",       cost: { despair: 1 },   modes: ['combat'], target: 'target' },
  { id: 'weapon-out-of-ammo', label: 'Ranged weapon runs out of ammo',         cost: { despair: 1 },   modes: ['combat'] },
  { id: 'tool-damaged',       label: 'Tool / melee weapon damaged one step',   cost: { despair: 1 },   modes: ['any'] },
];

// Active weapon qualities and their activation costs / narrative effects, per
// Holocron v2 / SWRPG CRB p. 26. Passive qualities (Pierce, Vicious, Defensive,
// etc.) are intentionally absent — they apply automatically and aren't spends.
type ActiveQualitySpec = {
  cost: SpendOption['cost'];
  /** Effect summary appended to the spend label. Receives the quality's rank
   * when present so ranked qualities (Burn 2, Linked 3) read clearly. */
  effectSummary: (rank?: number) => string;
  /** Stackable activations — Linked / Auto-fire / Knockdown can be spent more
   * than once on the same attack. */
  repeatable?: boolean;
  /** Build a status effect to drop on the target when the GM activates this
   * quality. When set, performSpend will push the effect into effectStore so
   * the chip lights up automatically; undo removes the most recent matching
   * chip. Auto-fire / Linked / Blast intentionally have no buildStatus —
   * they're "extra hits", resolved in the damage panel rather than via status. */
  buildStatus?: (target: EffectTarget, rank?: number) => Effect;
};

const ACTIVE_QUALITY_SPECS: Record<string, ActiveQualitySpec> = {
  'auto-fire': {
    cost: { advantage: 2 },
    effectSummary: () => 'extra hit (same or new target in range)',
    repeatable: true,
  },
  blast: {
    cost: { advantage: 2 },
    effectSummary: (r) =>
      `engaged targets take ${r ?? 'rating'} damage on hit (3 [AD] on a miss)`,
  },
  burn: {
    cost: { advantage: 2 },
    effectSummary: (r) => `target burns for ${r ?? 'rating'} round(s)`,
    buildStatus: (target, rank) => StatusFactories.burn(nanoid(), target, rank ?? 1),
  },
  concussive: {
    cost: { advantage: 2 },
    effectSummary: (r) => `staggered ${r ?? 'rating'} round(s)`,
    buildStatus: (target, rank) => StatusFactories.staggered(nanoid(), target, rank ?? 1),
  },
  disorient: {
    cost: { advantage: 2 },
    effectSummary: (r) => `disoriented ${r ?? 'rating'} round(s)`,
    buildStatus: (target, rank) =>
      StatusFactories.disoriented(nanoid(), target, rank ?? 1, rank ?? 1),
  },
  ensnare: {
    cost: { advantage: 2 },
    effectSummary: (r) => `immobilised ${r ?? 'rating'} round(s)`,
    buildStatus: (target, rank) => StatusFactories.ensnared(nanoid(), target, rank ?? 1),
  },
  guided: {
    cost: { advantage: 3 },
    effectSummary: () => 'on a miss, re-roll attack at end of round',
  },
  knockdown: {
    cost: { advantage: 2 },
    effectSummary: () => 'knock target prone (+1 [AD] per silhouette beyond 1)',
    repeatable: true,
    buildStatus: (target) => StatusFactories.prone(nanoid(), target),
  },
  linked: {
    cost: { advantage: 2 },
    effectSummary: (r) => `extra hit (up to Linked ${r ?? 'rating'} times)`,
    repeatable: true,
  },
  stun: {
    cost: { advantage: 2 },
    effectSummary: (r) => `target suffers ${r ?? 'rating'} strain after soak`,
  },
  sunder: {
    cost: { advantage: 1 },
    effectSummary: () => "damage opponent's item one step",
    repeatable: true,
  },
};

function quirkOptionsForWeapon(weapon?: SnapshotWeapon): SpendOption[] {
  if (!weapon) return [];
  const out: SpendOption[] = [];
  // Inflict a Critical Injury by spending Advantage equal to the weapon's
  // Crit Rating (SWRPG CRB p. 220). The Triumph route — cost 1, regardless of
  // the weapon's rating — lives in BASE_OPTIONS; this is its Advantage-priced
  // sibling, so it only surfaces once net Advantage reaches the Crit Rating.
  if (weapon.crit && weapon.crit > 0) {
    out.push({
      id: 'crit-advantage',
      label: `Inflict a Critical Injury (Crit ${weapon.crit})`,
      cost: { advantage: weapon.crit },
      modes: ['combat'],
      target: 'target',
    });
  }
  for (const q of weapon.qualities) {
    const spec = ACTIVE_QUALITY_SPECS[q.name.toLowerCase()];
    if (!spec) continue; // passive or unknown — not a spend
    const labelHead = `Activate ${q.name}${q.rank ? ` ${q.rank}` : ''}`;
    const buildStatus = spec.buildStatus;
    const rank = q.rank;
    out.push({
      id: `activate-${q.name.toLowerCase().replace(/\s+/g, '-')}`,
      label: `${labelHead} — ${spec.effectSummary(rank)}`,
      cost: spec.cost,
      modes: ['combat'] as const as ('any' | DiceRollMode)[],
      target: 'target',
      repeatable: spec.repeatable,
      ...(buildStatus
        ? {
            apply: (_snap, recipientId) => {
              if (!recipientId) return;
              const target: EffectTarget = { type: 'character', participantId: recipientId };
              const effect = buildStatus(target, rank);
              useEffectStore.getState().addEffect(effect, target);
            },
            unapply: (_snap, recipientId) => {
              if (!recipientId) return;
              // Match by status name on the same target — effectStore dedupes by
              // name, so the most recent one is the only one to remove.
              const probe = buildStatus({ type: 'character', participantId: recipientId }, rank);
              const found = useEffectStore
                .getState()
                .effects
                .filter(
                  (e) =>
                    e.target.type === 'character' &&
                    e.target.participantId === recipientId &&
                    e.effect.name === probe.name,
                )
                .pop();
              if (found) useEffectStore.getState().removeEffect(found.id);
            },
          }
        : {}),
    });
  }
  return out;
}

interface SpendPanelProps {
  result: RollResult | null;
  mode: DiceRollMode;
  spent: { optionId: string }[];
  weapon?: SnapshotWeapon;
}

function affordable(
  option: SpendOption,
  available: { advantage: number; threat: number; triumph: number; despair: number },
): boolean {
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

// Walk forward in initiative order from the attacker's current slot, returning
// the participantId of the next slot owned by the same team that has a
// committed participant. Returns null when no encounter is active or no
// matching slot exists.
function resolveNextAlly(
  attackerId: string | undefined,
  participants: Participant[],
): string | null {
  if (!attackerId) return null;
  const attacker = participants.find((p) => p.id === attackerId);
  if (!attacker) return null;
  const team: 'PC' | 'NPC' = attacker.isPC ? 'PC' : 'NPC';

  const ctx = useFSMStore.getState().context;
  const order = ctx.initiativeOrder ?? [];
  if (order.length === 0) return null;
  const startIdx = order.findIndex((s) => s.participantId === attackerId);
  if (startIdx < 0) return null;

  for (let step = 1; step <= order.length; step++) {
    const slot = order[(startIdx + step) % order.length];
    if (slot.team !== team) continue;
    if (slot.participantId && slot.participantId !== attackerId) {
      return slot.participantId;
    }
  }
  return null;
}

export const SpendPanel: React.FC<SpendPanelProps> = ({ result, mode, spent, weapon }) => {
  const snapshot = useDiceRollerStore((s) => s.snapshot);
  const recordSpend = useDiceRollerStore((s) => s.recordSpend);
  const undoSpend = useDiceRollerStore((s) => s.undoSpend);
  const participants = useParticipantStore((s) => s.participants);
  const addDice = useParticipantStore((s) => s.addDice);
  const removeDice = useParticipantStore((s) => s.removeDice);
  // Subscribe so the spend panel re-renders if the encounter advances while
  // the modal is open and the next-ally suggestion shifts.
  useFSMStore((s) => s.context.currentTurnIndex);

  if (!result) {
    return (
      <HStack
        spacing={2}
        bg="gray.800"
        borderRadius="md"
        px={3}
        py={2}
        opacity={0.6}
      >
        <Text
          fontSize="9px"
          color="gray.500"
          letterSpacing="0.16em"
          textTransform="uppercase"
          fontWeight="bold"
        >
          Spends
        </Text>
        <Text fontSize="xs" color="gray.500">
          Roll to see available spends.
        </Text>
      </HStack>
    );
  }

  const attackerId = snapshot?.attackerParticipantId;
  const targetId = snapshot?.targetParticipantId;

  // Resolve who a spend targets. For 'self'/'target'/'next-ally', returns the
  // implicit recipient when one exists. For 'ally'/'any' or unresolved
  // 'next-ally', returns null — caller must show a picker.
  function resolveDirectRecipient(opt: SpendOption): string | null {
    if (opt.target === 'self') return attackerId ?? null;
    if (opt.target === 'target') return targetId ?? null;
    if (opt.target === 'next-ally') return resolveNextAlly(attackerId, participants);
    return null;
  }

  function performSpend(opt: SpendOption, recipientId?: string) {
    if (!snapshot) return;
    if (opt.passDice && recipientId) {
      const attackerName = snapshot.attacker?.name ?? 'Someone';
      const sourceLabel = `${attackerName} — ${opt.label}`;
      addDice(recipientId, opt.passDice.kind, opt.passDice.amount, sourceLabel);
    }
    opt.apply?.(snapshot, recipientId);
    const recipientName = recipientId
      ? participants.find((p) => p.id === recipientId)?.name
      : undefined;
    const labelWithRecipient = recipientName ? `${opt.label} → ${recipientName}` : opt.label;
    recordSpend(opt.id, labelWithRecipient, recipientId);
  }

  // Reverse the most recent occurrence of a given option. We only know how to
  // reverse passDice deposits and explicit unapply hooks — narrative-only
  // spends (notice detail, free maneuver) just drop from the spent log.
  function performUndoLast(optionId: string) {
    if (!snapshot) return;
    let lastIdx = -1;
    for (let i = snapshot.spent.length - 1; i >= 0; i--) {
      if (snapshot.spent[i].optionId === optionId) {
        lastIdx = i;
        break;
      }
    }
    if (lastIdx < 0) return;
    const entry = snapshot.spent[lastIdx];
    const opt = allOptions.find((o) => o.id === entry.optionId);
    if (opt) {
      if (opt.passDice && entry.recipientId) {
        removeDice(entry.recipientId, opt.passDice.kind, opt.passDice.amount);
      }
      opt.unapply?.(snapshot, entry.recipientId);
    }
    undoSpend(lastIdx);
  }

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

  // Group options under their primary cost symbol (Triumph > Despair >
  // Advantage > Threat) so the eye scans by what currency you have to spend.
  type Section = 'advantage' | 'triumph' | 'threat' | 'despair';
  const SECTION_ORDER: Section[] = ['advantage', 'triumph', 'threat', 'despair'];
  const SECTION_META: Record<Section, { label: string; iconClass: string; tint: string }> = {
    advantage: { label: 'Advantage spends', iconClass: 'icon advantage', tint: '#1f2920' },
    triumph:   { label: 'Triumph spends',   iconClass: 'icon triumph',   tint: '#2d2618' },
    threat:    { label: 'Threat spends',    iconClass: 'icon threat',    tint: '#2c1f24' },
    despair:   { label: 'Despair spends',   iconClass: 'icon despair',   tint: '#231a2c' },
  };
  function primaryCostSection(cost: SpendOption['cost']): Section {
    if (cost.triumph) return 'triumph';
    if (cost.despair) return 'despair';
    if (cost.threat) return 'threat';
    return 'advantage';
  }
  const sectioned: Record<Section, SpendOption[]> = {
    advantage: [], triumph: [], threat: [], despair: [],
  };
  for (const opt of allOptions) {
    if (!affordable(opt, available)) continue;
    sectioned[primaryCostSection(opt.cost)].push(opt);
  }

  // Spent log entries — rendered as a compact strip at the top so they don't
  // visually compete with the available actions.
  const spentEntries = spent.map((s, i) => {
    const opt = allOptions.find((o) => o.id === s.optionId);
    const recipient = s.recipientId ? participants.find((p) => p.id === s.recipientId) : null;
    return { idx: i, optionId: s.optionId, label: opt?.label ?? s.optionId, recipientName: recipient?.name };
  });

  return (
    <Accordion allowToggle defaultIndex={spent.length > 0 ? [0] : undefined}>
      <AccordionItem border="none" bg="gray.800" borderRadius="md">
        <AccordionButton _hover={{ bg: 'whiteAlpha.50' }} borderRadius="md">
          <HStack flex="1" justify="space-between">
            <HStack spacing={2}>
              <Text
                fontSize="9px"
                color="gray.400"
                letterSpacing="0.16em"
                textTransform="uppercase"
                fontWeight="bold"
              >
                Spends
              </Text>
              <Text fontSize="xs" color="gray.500">
                {totalAvailable > 0 ? `${totalAvailable} unspent` : 'all spent'}
                {spent.length > 0 && ` · ${spent.length} spent`}
              </Text>
            </HStack>
            <HStack spacing={2} fontSize="xs" color="gray.300">
              {available.advantage > 0 && <Tag size="sm" colorScheme="green" variant="subtle"><HStack spacing={0.5}><Text>{available.advantage}</Text><Box className="icon advantage" fontSize="13px" /></HStack></Tag>}
              {available.threat    > 0 && <Tag size="sm" colorScheme="red"   variant="subtle"><HStack spacing={0.5}><Text>{available.threat}</Text><Box className="icon threat" fontSize="13px" /></HStack></Tag>}
              {available.triumph   > 0 && <Tag size="sm" colorScheme="yellow" variant="subtle"><HStack spacing={0.5}><Text>{available.triumph}</Text><Box className="icon triumph" fontSize="13px" /></HStack></Tag>}
              {available.despair   > 0 && <Tag size="sm" colorScheme="purple" variant="subtle"><HStack spacing={0.5}><Text>{available.despair}</Text><Box className="icon despair" fontSize="13px" /></HStack></Tag>}
            </HStack>
          </HStack>
          <AccordionIcon ml={2} />
        </AccordionButton>
        <AccordionPanel p={2}>
          <VStack align="stretch" spacing={2}>
            {/* Spent strip — separated from available actions so undo doesn't
              * fight with new spends visually. */}
            {spentEntries.length > 0 && (
              <Box bg="orange.900" borderRadius="md" px={2} py={1.5}>
                <HStack spacing={1} mb={1}>
                  <Text
                    fontSize="9px"
                    color="orange.200"
                    letterSpacing="0.16em"
                    textTransform="uppercase"
                    fontWeight="bold"
                  >
                    Spent
                  </Text>
                </HStack>
                <Wrap spacing={1}>
                  {spentEntries.map((s) => (
                    <WrapItem key={s.idx}>
                      <HStack
                        spacing={1}
                        bg="orange.800"
                        borderRadius="full"
                        px={2}
                        py={0.5}
                      >
                        <Text fontSize="xs" color="orange.50" noOfLines={1}>
                          {s.label}
                          {s.recipientName ? ` → ${s.recipientName}` : ''}
                        </Text>
                        <Tooltip label="Undo this spend" placement="top" hasArrow openDelay={300}>
                          <IconButton
                            aria-label="Undo spend"
                            size="2xs"
                            variant="ghost"
                            minW="14px"
                            h="14px"
                            fontSize="11px"
                            color="orange.100"
                            _hover={{ bg: 'orange.700' }}
                            icon={<span>×</span>}
                            onClick={(e) => {
                              e.stopPropagation();
                              performUndoLast(s.optionId);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            {/* Available actions, grouped by primary cost symbol. */}
            {SECTION_ORDER.every((s) => sectioned[s].length === 0) && (
              <Text fontSize="xs" color="gray.500" px={2} py={1}>No affordable spends.</Text>
            )}
            {SECTION_ORDER.map((section) => {
              const opts = sectioned[section];
              if (opts.length === 0) return null;
              const meta = SECTION_META[section];
              return (
                <Box key={section} bg={meta.tint} borderRadius="md" px={2} py={1.5}>
                  <HStack spacing={1.5} mb={1}>
                    <Box className={meta.iconClass} fontSize="13px" />
                    <Text
                      fontSize="9px"
                      color="gray.300"
                      letterSpacing="0.16em"
                      textTransform="uppercase"
                      fontWeight="bold"
                    >
                      {meta.label}
                    </Text>
                  </HStack>
                  <VStack align="stretch" spacing={0.5}>
                    {opts.map((opt) => {
                      const canAfford = affordable(opt, available);
                      const directRecipient = resolveDirectRecipient(opt);
                      const needsPicker =
                        (opt.target === 'ally' || opt.target === 'any') ||
                        ((opt.target === 'self' || opt.target === 'target' || opt.target === 'next-ally') && !directRecipient);
                      const candidates = !needsPicker
                        ? []
                        : (opt.target === 'ally' || opt.target === 'next-ally')
                          ? participants.filter((p) => p.id !== attackerId)
                          : participants;

                      return (
                        <HStack
                          key={opt.id}
                          spacing={2}
                          px={2}
                          py={1}
                          borderRadius="sm"
                          opacity={canAfford ? 1 : 0.5}
                          justify="space-between"
                          _hover={{ bg: 'whiteAlpha.50' }}
                        >
                          <HStack spacing={2} flex="1" minW={0}>
                            <CostBadge cost={opt.cost} />
                            <Text fontSize="sm" color="gray.100" noOfLines={1}>
                              {opt.label}
                            </Text>
                          </HStack>
                          {needsPicker ? (
                            // Picker variant gets a quieter ghost style — direct
                            // Spend is the common case and should land first.
                            <Menu placement="bottom-end" isLazy>
                              <MenuButton
                                as={Button}
                                size="xs"
                                variant="ghost"
                                color="orange.200"
                                _hover={{ bg: 'orange.900' }}
                                rightIcon={<span style={{ fontSize: 9 }}>▾</span>}
                                isDisabled={!canAfford || candidates.length === 0}
                              >
                                Spend
                              </MenuButton>
                              <MenuList bg="gray.800" borderColor="gray.700" maxH="240px" overflowY="auto">
                                {candidates.length === 0 ? (
                                  <MenuItem isDisabled bg="gray.800">No participants</MenuItem>
                                ) : (
                                  candidates.map((p) => (
                                    <MenuItem
                                      key={p.id}
                                      bg="gray.800"
                                      _hover={{ bg: 'gray.700' }}
                                      onClick={() => performSpend(opt, p.id)}
                                    >
                                      <HStack spacing={2} flex="1">
                                        <Text fontSize="sm" color="gray.100">{p.name}</Text>
                                        {p.isPC && <Tag size="sm" variant="subtle" colorScheme="blue">PC</Tag>}
                                      </HStack>
                                    </MenuItem>
                                  ))
                                )}
                              </MenuList>
                            </Menu>
                          ) : (
                            <Button
                              size="xs"
                              colorScheme="orange"
                              variant={canAfford ? 'solid' : 'ghost'}
                              onClick={() => canAfford && performSpend(opt, directRecipient ?? undefined)}
                              isDisabled={!canAfford}
                            >
                              Spend
                            </Button>
                          )}
                        </HStack>
                      );
                    })}
                  </VStack>
                </Box>
              );
            })}
          </VStack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};
