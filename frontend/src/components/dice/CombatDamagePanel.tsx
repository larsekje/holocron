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
import useActiveVehicleStore from '@/state/activeVehicleStore';
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
  const addHull = useActiveVehicleStore((s) => s.addHull);
  const addSystemStrain = useActiveVehicleStore((s) => s.addSystemStrain);
  const targetVehicle = useActiveVehicleStore((s) =>
    snapshot.targetVehicleId ? s.vehicles[snapshot.targetVehicleId] ?? null : null,
  );

  const { weapon, target, result } = snapshot;
  if (!weapon) return null;

  const isVehicleTarget = !!snapshot.targetVehicleId;
  // Ion damage routes to vehicle system strain instead of hull (rules: full
  // damage to droids, affected by soak — the soak step is the same, only
  // the destination changes). Quality match is case-insensitive.
  const isIonWeapon = (weapon.qualities ?? []).some(
    (q) => q.name.toLowerCase() === 'ion',
  );
  const vehicleDestination: 'hull' | 'system' = isIonWeapon ? 'system' : 'hull';

  const netSuccess = result?.net.netSuccess ?? 0;
  const succeeded = result?.net.succeeded ?? false;
  // Vehicle "soak" comes from `armor`; characters use the existing target.soak.
  const soak = isVehicleTarget ? (targetVehicle?.armor ?? 0) : (target?.soak ?? 0);
  const baseDamage = (weapon.damage ?? 0) + Math.max(0, netSuccess);
  const finalDamage = result ? Math.max(0, baseDamage - soak) : 0;

  // Threshold checks fork on target kind. Characters: wounds vs woundThreshold
  // → Critical Injury. Vehicles: hull vs hullThreshold (or system vs
  // systemThreshold for Ion) → Vehicle Critical Hit. Either way the same
  // amber alert slot is reused.
  const newWounds = (target?.wounds ?? 0) + finalDamage;
  const characterExceeds =
    !!result && succeeded && !!target && newWounds > target.woundThreshold;
  const newHull =
    (targetVehicle?.hullCurrent ?? 0)
    + (vehicleDestination === 'hull' ? finalDamage : 0);
  const newSystem =
    (targetVehicle?.systemCurrent ?? 0)
    + (vehicleDestination === 'system' ? finalDamage : 0);
  const vehicleExceeds =
    !!result
    && succeeded
    && isVehicleTarget
    && !!targetVehicle
    && finalDamage > 0
    && (vehicleDestination === 'hull'
      ? newHull > targetVehicle.hullThreshold
      : newSystem > targetVehicle.systemThreshold);
  const exceedsThreshold = characterExceeds || vehicleExceeds;

  // Display name + soak source for chips and the apply button label.
  const targetName = isVehicleTarget
    ? (targetVehicle?.name ?? snapshot.targetVehicleName ?? 'Vehicle')
    : (target?.name ?? null);
  const soakLabel = isVehicleTarget ? `${targetName} armor` : (target ? `${target.name} soak` : 'Target soak');
  const damageBucketLabel = isVehicleTarget
    ? (vehicleDestination === 'system' ? 'System strain' : 'Hull damage')
    : 'Wounds dealt';
  const hasTarget = isVehicleTarget ? !!targetVehicle : !!target;

  const damageDisplay = !result ? '—' : succeeded ? String(finalDamage) : '—';
  const successesDisplay = !result ? '—' : String(Math.max(0, netSuccess));
  const applyLabel = !result
    ? 'Apply'
    : isVehicleTarget && targetName
      ? vehicleDestination === 'system'
        ? `Apply ${finalDamage} system strain to ${targetName}`
        : `Apply ${finalDamage} to ${targetName} hull`
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
        <Chip tip={soakLabel}>
          <Text>{soak}</Text>
        </Chip>
        <Text color="gray.500" fontSize="sm">=</Text>
        <Chip
          tip={!result ? 'Damage (pending)' : succeeded && hasTarget ? damageBucketLabel : succeeded ? 'Damage (no target)' : 'Miss'}
          color={result && succeeded && finalDamage > 0 ? 'red.300' : 'gray.400'}
        >
          <Text fontWeight="bold">{damageDisplay}</Text>
        </Chip>
        <Box flex="1" />
        <Button
          size="sm"
          colorScheme="orange"
          isDisabled={!result || !succeeded || !hasTarget || finalDamage === 0}
          onClick={() => {
            if (!result || !succeeded || finalDamage === 0) return;
            const log = useSessionLogStore.getState();
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

            if (isVehicleTarget && snapshot.targetVehicleId && targetVehicle) {
              const destWord = vehicleDestination === 'system' ? 'system strain' : 'hull';
              if (vehicleDestination === 'system') {
                addSystemStrain(snapshot.targetVehicleId, finalDamage);
              } else {
                addHull(snapshot.targetVehicleId, finalDamage);
              }
              log.rewriteLastDamageForRoll(
                snapshot.id,
                `${attackerName} — ${weapon.name} → ${targetVehicle.name}: ${finalDamage} ${destWord}${symbolText}`,
              );
              toast({
                title: `${finalDamage} ${destWord} applied to ${targetVehicle.name}`,
                status: 'success',
                duration: 2500,
              });
              return;
            }

            if (!target || !snapshot.targetParticipantId) return;
            // Suppress the auto wound delta so we don't double-log the hit;
            // we replace the existing roll entry with a combined line that
            // names attacker, weapon, and the dice symbols.
            log.suppressNextWoundLog(snapshot.targetParticipantId);
            addWounds(snapshot.targetParticipantId, finalDamage);
            update({ target: { ...target, wounds: target.wounds + finalDamage } });

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
          {characterExceeds && target
            ? `Wounds exceed threshold (${newWounds}/${target.woundThreshold}) — Critical Injury.`
            : vehicleExceeds && targetVehicle
              ? vehicleDestination === 'system'
                ? `System strain exceeds threshold (${newSystem}/${targetVehicle.systemThreshold}) — Vehicle Critical Hit.`
                : `Hull exceeds threshold (${newHull}/${targetVehicle.hullThreshold}) — Vehicle Critical Hit.`
              : 'Critical threshold reserved'}
        </Text>
      </Alert>
    </VStack>
  );
};
