import React from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  HStack,
  Text,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react';
import type { ModalSnapshot } from './mockSnapshots';
import useDiceRollerStore from '@/state/diceRollerStore';
import useParticipantStore from '@/state/participantsStore';
import useSessionLogStore from '@/state/sessionLogStore';

interface Props {
  snapshot: ModalSnapshot;
}

const Chip: React.FC<{ tip: string; children: React.ReactNode; color?: string }> = ({
  tip,
  children,
  color,
}) => (
  <Tooltip label={tip} placement="top" hasArrow openDelay={400}>
    <HStack
      spacing={1}
      px={2}
      py={0.5}
      bg="gray.700"
      borderRadius="md"
      fontSize="sm"
      color={color ?? 'gray.100'}
    >
      {children}
    </HStack>
  </Tooltip>
);

// Single-line damage breakdown: weapon damage chip + net successes chip −
// soak chip = total. The chip strip + Apply button render the same in pre-
// and post-roll states (just with em-dashes pre-roll) so the modal height
// is stable when a roll lands. The threshold-exceeded alert is also always
// rendered but hidden via visibility when the threshold isn't crossed —
// keeps the slot reserved.
export const CombatDamagePanel: React.FC<Props> = ({ snapshot }) => {
  const toast = useToast();
  const update = useDiceRollerStore((s) => s.update);
  const addWounds = useParticipantStore((s) => s.addWounds);

  const { weapon, target, result } = snapshot;
  if (!weapon) return null;

  const netSuccess = result?.net.netSuccess ?? 0;
  const succeeded = result?.net.succeeded ?? false;
  const soak = target?.soak ?? 0;
  const baseDamage = (weapon.damage ?? 0) + Math.max(0, netSuccess);
  const finalDamage = result ? Math.max(0, baseDamage - soak) : 0;
  const newWounds = (target?.wounds ?? 0) + finalDamage;
  const exceedsThreshold = !!result && succeeded && !!target && newWounds > target.woundThreshold;

  const damageDisplay = !result ? '—' : succeeded ? String(finalDamage) : '—';
  const successesDisplay = !result ? '—' : String(Math.max(0, netSuccess));
  const applyLabel = !result
    ? 'Apply'
    : target
      ? `Apply ${finalDamage} to ${target.name}`
      : 'Apply';

  return (
    <VStack align="stretch" spacing={2}>
      <HStack
        bg="gray.800"
        borderRadius="md"
        px={3}
        py={2}
        spacing={2}
        align="center"
        flexWrap="wrap"
      >
        <Chip tip={`${weapon.name} base damage`}>
          <Text>{weapon.damage}</Text>
        </Chip>
        <Text color="gray.500" fontSize="sm">+</Text>
        <Chip
          tip={!result ? 'Net successes (pending)' : succeeded ? 'Net successes' : 'Net successes (miss)'}
          color={result && succeeded ? 'green.300' : 'gray.400'}
        >
          <Text>{successesDisplay}</Text>
          <Box className="icon success" fontSize="13px" />
        </Chip>
        <Text color="gray.500" fontSize="sm">−</Text>
        <Chip tip={target ? `${target.name} soak` : 'Target soak'}>
          <Text>{soak}</Text>
        </Chip>
        <Text color="gray.500" fontSize="sm">=</Text>
        <Chip
          tip={!result ? 'Damage (pending)' : succeeded && target ? 'Wounds dealt' : succeeded ? 'Damage (no target)' : 'Miss'}
          color={result && succeeded && finalDamage > 0 ? 'red.300' : 'gray.400'}
        >
          <Text fontWeight="bold">{damageDisplay}</Text>
        </Chip>
        <Box flex="1" />
        <Button
          size="sm"
          colorScheme="orange"
          isDisabled={!result || !succeeded || !target || finalDamage === 0}
          onClick={() => {
            if (!result || !target || !snapshot.targetParticipantId || !succeeded || finalDamage === 0) return;
            const log = useSessionLogStore.getState();
            // Suppress the auto wound delta so we don't double-log the hit;
            // we replace the existing roll entry with a combined line that
            // names attacker, weapon, and the dice symbols.
            log.suppressNextWoundLog(snapshot.targetParticipantId);
            addWounds(snapshot.targetParticipantId, finalDamage);
            update({ target: { ...target, wounds: target.wounds + finalDamage } });

            const attackerName = snapshot.attacker?.name ?? 'Attacker';
            const net = result.net;
            const symbolBits: string[] = [];
            if (net.netSuccess > 0) symbolBits.push(`${net.netSuccess}[SU]`);
            else if (net.netSuccess < 0) symbolBits.push(`${-net.netSuccess}[FA]`);
            if (net.netAdvantage > 0) symbolBits.push(`${net.netAdvantage}[AD]`);
            else if (net.netAdvantage < 0) symbolBits.push(`${-net.netAdvantage}[TH]`);
            if (net.triumph > 0) symbolBits.push(`${net.triumph}[TR]`);
            if (net.despair > 0) symbolBits.push(`${net.despair}[DE]`);
            const symbolText = symbolBits.length > 0 ? ` (${symbolBits.join(' ')})` : '';
            const woundsWord = finalDamage === 1 ? 'wound' : 'wounds';
            log.rewriteLastDamageForRoll(
              snapshot.id,
              `${attackerName} — ${weapon.name} → ${target.name}: ${finalDamage} ${woundsWord}${symbolText}`,
            );

            toast({
              title: `${finalDamage} wounds applied to ${target.name}`,
              status: 'success',
              duration: 2500,
            });
          }}
        >
          {applyLabel}
        </Button>
      </HStack>

      {/* Always rendered so the modal doesn't grow when a Critical Injury
       * threshold is exceeded. Hidden via visibility, which keeps layout.
       * Custom bg/colour because the default subtle warning gives near-white
       * text on a pale amber background that's hard to read on dark theme. */}
      <Alert
        status="warning"
        variant="subtle"
        borderRadius="md"
        fontSize="xs"
        bg="#3a2a14"
        color="#ffd591"
        borderWidth="1px"
        borderColor="#7a4a18"
        visibility={exceedsThreshold ? 'visible' : 'hidden'}
        aria-hidden={!exceedsThreshold}
      >
        <AlertIcon color="#ffb454" />
        <Text fontWeight="semibold">
          {exceedsThreshold && target
            ? `Wounds exceed threshold (${newWounds}/${target.woundThreshold}) — Critical Injury.`
            : 'Critical Injury threshold reserved'}
        </Text>
      </Alert>
    </VStack>
  );
};
