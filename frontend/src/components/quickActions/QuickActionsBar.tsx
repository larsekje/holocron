import React, { useEffect, useRef } from 'react';
import { Box, Button, HStack, Input, Kbd, Text, Tooltip, VStack } from '@chakra-ui/react';
import useParticipantStore from '@/state/participantsStore';
import useGameplayStore from '@/state/newGameplayStore';
import useActiveVehicleStore from '@/state/activeVehicleStore';
import { useQuickActionsStore } from '@/state/quickActionsStore';
import HotkeyHint from '@components/quickActions/HotkeyHint';
import { resolveWeapon } from '@components/statblock/WeaponListOld';
import { finalWeaponDamage } from '@/utils/diceSnapshots';

const PROMPT: Record<'damage' | 'strain' | 'pouch', { label: string; placeholder: string; help: string }> = {
  damage: {
    label: 'Damage',
    placeholder: 'raw damage, e.g. 8',
    help: 'Soak is subtracted automatically.',
  },
  strain: {
    label: 'Strain',
    placeholder: 'strain, e.g. 2',
    help: 'PC / Nemesis only. Minions/Rivals don\'t track strain.',
  },
  pouch: {
    label: 'Pouch',
    placeholder: '3a, bbb, 1 triumph, 2 success…',
    help: 'a=advantage · t=threat · s=success · f=failure · b=boost · k=setback · h=triumph · d=despair · fo=force. Repeated letters count: bbb = 3 boost.',
  },
};

const QuickActionsBar: React.FC = () => {
  const selectedParticipantId = useParticipantStore((s) => s.selectedParticipantId);
  const mode = useQuickActionsStore((s) => s.mode);
  const lastResult = useQuickActionsStore((s) => s.lastResult);
  const enterDamage = useQuickActionsStore((s) => s.enterDamage);
  const enterStrain = useQuickActionsStore((s) => s.enterStrain);
  const enterPouch = useQuickActionsStore((s) => s.enterPouch);
  const openCrit = useQuickActionsStore((s) => s.openCrit);
  const cancel = useQuickActionsStore((s) => s.cancel);
  const submit = useQuickActionsStore((s) => s.submit);

  const pickWeapon = useQuickActionsStore((s) => s.pickWeapon);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState('');

  // Focus the input whenever we enter an input mode. Clear value on enter.
  useEffect(() => {
    if (mode === 'damage' || mode === 'strain' || mode === 'pouch') {
      setValue('');
      // Defer focus to next tick so the input has mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [mode]);

  // Weapon mode acts on the ACTIVE participant (the one taking the turn),
  // not the selected target — see quickActionsStore.enterWeapon.
  const activeParticipantId = useGameplayStore((s) => s.context.activeParticipantId);
  const activeParticipant = useParticipantStore((s) =>
    s.participants.find((p) => p.id === activeParticipantId) ?? null,
  );

  if (!selectedParticipantId) return null;

  const disabled = !selectedParticipantId;

  if (mode === 'weapon') {
    // Mirror the store's branching: if the active participant is aboard a
    // vehicle, list the vehicle's weapons instead of their personal ones.
    const equippedVehicleId = activeParticipant?.equippedVehicleId;
    const vehicle = useActiveVehicleStore.getState().vehicles[equippedVehicleId ?? ''];
    const inVehicle = !!vehicle;
    const rawWeapons = inVehicle
      ? (vehicle.weapons ?? [])
      : (((activeParticipant?.stats as any)?.weapons ?? []) as any[]);
    const subjectName = inVehicle ? vehicle.name : (activeParticipant?.name ?? 'Active');
    return (
      <Box mb={2}>
        <HStack spacing={2} align="center" mb={1.5}>
          <Text fontSize="xs" color="blue.200" fontWeight="semibold" minW="58px">
            {subjectName}'s weapon:
          </Text>
          <Text fontSize="2xs" color="whiteAlpha.500">
            Press 1–{Math.min(9, rawWeapons.length)} or click to roll. <Kbd fontSize="2xs">Esc</Kbd> cancels.
          </Text>
        </HStack>
        <VStack align="stretch" spacing={1}>
          {rawWeapons.map((raw: any, i: number) => {
            // Vehicle weapons are already objects with name/damage/range/etc;
            // personal weapons are either strings (catalog lookups) or objects.
            const w = inVehicle ? null : resolveWeapon(raw);
            const name = inVehicle ? raw.name : (w?.name ?? (typeof raw === 'string' ? raw : `Weapon ${i + 1}`));
            const brawn = (activeParticipant?.stats as any)?.brawn ?? 2;
            const finalDmg = inVehicle
              ? (raw.damage ?? '—')
              : (w ? finalWeaponDamage(w, brawn) : '—');
            const skill = inVehicle ? 'Gunnery' : w?.skill;
            const range = inVehicle ? raw.range : w?.range;
            const detail = [skill, range, finalDmg !== '—' ? `Dmg ${finalDmg}` : null]
              .filter(Boolean)
              .join(' · ');
            return (
              <Button
                key={i}
                size="xs"
                variant="outline"
                justifyContent="flex-start"
                onClick={() => pickWeapon(i)}
                isDisabled={i >= 9 ? false : false /* always enabled; numbers above 9 are click-only */}
                position="relative"
              >
                <Kbd mr={2} fontSize="2xs">{i < 9 ? String(i + 1) : '·'}</Kbd>
                <Text as="span" fontWeight="semibold">{name}</Text>
                {detail && (
                  <Text as="span" ml={2} fontSize="2xs" color="whiteAlpha.500">
                    {detail}
                  </Text>
                )}
              </Button>
            );
          })}
        </VStack>
      </Box>
    );
  }

  if (mode === 'idle') {
    return (
      <Box mb={2}>
        <HStack spacing={1.5}>
          <Tooltip label="Apply damage (auto-soak)" hasArrow openDelay={500} placement="top">
            <Button size="xs" variant="outline" onClick={enterDamage} isDisabled={disabled} position="relative">
              Damage
              <HotkeyHint>D</HotkeyHint>
            </Button>
          </Tooltip>
          <Tooltip label="Apply strain (PC / Nemesis only)" hasArrow openDelay={500} placement="top">
            <Button size="xs" variant="outline" onClick={enterStrain} isDisabled={disabled} position="relative">
              Strain
              <HotkeyHint>S</HotkeyHint>
            </Button>
          </Tooltip>
          <Tooltip label="Add dice / symbols to target's pouch" hasArrow openDelay={500} placement="top">
            <Button size="xs" variant="outline" onClick={enterPouch} isDisabled={disabled} position="relative">
              Pouch
              <HotkeyHint>P</HotkeyHint>
            </Button>
          </Tooltip>
          <Tooltip label="Roll a critical injury on the target" hasArrow openDelay={500} placement="top">
            <Button size="xs" variant="outline" onClick={openCrit} isDisabled={disabled} position="relative">
              Crit
              <HotkeyHint>C</HotkeyHint>
            </Button>
          </Tooltip>
        </HStack>
        {lastResult && (
          <Text mt={1.5} fontSize="xs" color={lastResult.ok ? 'green.300' : 'orange.300'}>
            {lastResult.message}
          </Text>
        )}
      </Box>
    );
  }

  const prompt = PROMPT[mode];
  return (
    <Box mb={2}>
      <HStack spacing={2} align="center">
        <Text fontSize="xs" color="blue.200" fontWeight="semibold" minW="58px">
          {prompt.label}:
        </Text>
        <Input
          ref={inputRef}
          size="sm"
          variant="filled"
          placeholder={prompt.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit(value);
              setValue('');
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          autoFocus
          flex="1"
        />
        <Button size="xs" variant="ghost" onClick={cancel}>
          <Kbd fontSize="2xs">Esc</Kbd>
        </Button>
      </HStack>
      <Text mt={1} fontSize="2xs" color="whiteAlpha.500">
        {prompt.help}
      </Text>
    </Box>
  );
};

export default QuickActionsBar;
