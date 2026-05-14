import React, { useEffect, useRef } from 'react';
import {
  Box,
  Button,
  HStack,
  Input,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import useParticipantStore from '@/state/participantsStore';
import useGameplayStore from '@/state/newGameplayStore';
import useActiveVehicleStore from '@/state/activeVehicleStore';
import { useQuickActionsStore } from '@/state/quickActionsStore';

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

// Key-hint chip with explicit colors — Chakra's default Kbd collapses to
// white-on-white on the dark modal.
const HintKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Kbd
    bg="gray.700"
    color="gray.100"
    borderColor="whiteAlpha.300"
    fontSize="2xs"
    px="6px"
    flexShrink={0}
  >
    {children}
  </Kbd>
);

/**
 * QuickActionsBar — the keyboard-driven quick-action surface for the
 * selected target. Despite the legacy name it's a *popup* now: a centered
 * modal that overlays rather than an inline block that shifts the
 * surrounding layout. Consistent with the Crit / Effects modals.
 *
 * It opens whenever the quickActions store leaves `idle` (D/S/P/W). The
 * body switches on mode: a damage/strain/pouch input field, or the weapon
 * picker list. Closing (Esc / overlay click / submit) returns to idle.
 */
const QuickActionsBar: React.FC = () => {
  const selectedParticipantId = useParticipantStore((s) => s.selectedParticipantId);
  const selectedName = useParticipantStore(
    (s) => s.participants.find((p) => p.id === s.selectedParticipantId)?.name ?? 'Target',
  );
  const mode = useQuickActionsStore((s) => s.mode);
  const cancel = useQuickActionsStore((s) => s.cancel);
  const submit = useQuickActionsStore((s) => s.submit);
  const pickWeapon = useQuickActionsStore((s) => s.pickWeapon);

  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState('');

  // Clear the field whenever we enter an input mode.
  useEffect(() => {
    if (mode === 'damage' || mode === 'strain' || mode === 'pouch') {
      setValue('');
    }
  }, [mode]);

  // Weapon mode acts on the ACTIVE participant (the one taking the turn),
  // not the selected target — see quickActionsStore.enterWeapon.
  const activeParticipantId = useGameplayStore((s) => s.context.activeParticipantId);
  const activeParticipant = useParticipantStore((s) =>
    s.participants.find((p) => p.id === activeParticipantId) ?? null,
  );
  const vehicles = useActiveVehicleStore((s) => s.vehicles);

  // Personal weapon-pick is handled by the Kbd overlay on the Active card's
  // weapon list (see WeaponListOld) — no modal. The *vehicle* weapon case
  // still uses this modal: a vehicle's guns aren't otherwise overlay-able.
  const activeVehicle = activeParticipant?.equippedVehicleId
    ? vehicles[activeParticipant.equippedVehicleId]
    : undefined;
  const weaponModeInVehicle = mode === 'weapon' && !!activeVehicle;

  const isOpen =
    mode === 'damage' || mode === 'strain' || mode === 'pouch' || weaponModeInVehicle;

  let title = '';
  let body: React.ReactNode = null;

  if (weaponModeInVehicle && activeVehicle) {
    const rawWeapons = activeVehicle.weapons ?? [];
    title = `${activeVehicle.name}'s weapon`;
    body = (
      <Box>
        <Text fontSize="2xs" color="whiteAlpha.500" mb={2}>
          Press 1–{Math.min(9, rawWeapons.length)} or click to roll.{' '}
          <HintKey>Esc</HintKey> cancels.
        </Text>
        <VStack align="stretch" spacing={1}>
          {rawWeapons.map((raw: any, i: number) => {
            const detail = [
              'Gunnery',
              raw.range,
              raw.damage != null ? `Dmg ${raw.damage}` : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <Box
                as="button"
                key={i}
                onClick={() => pickWeapon(i)}
                w="100%"
                textAlign="left"
                bg="#26292d"
                borderWidth="1px"
                borderColor="whiteAlpha.150"
                borderRadius="md"
                px={2}
                py={1.5}
                _hover={{ bg: '#2c2f34', borderColor: 'whiteAlpha.300' }}
                transition="background-color 100ms, border-color 100ms"
              >
                <HStack spacing={2} w="100%">
                  <HintKey>{i < 9 ? String(i + 1) : '·'}</HintKey>
                  <VStack align="start" spacing={0} flex="1" minW={0}>
                    <Text fontWeight="semibold" fontSize="sm" color="whiteAlpha.900" noOfLines={1}>
                      {raw.name ?? `Weapon ${i + 1}`}
                    </Text>
                    {detail && (
                      <Text fontSize="2xs" color="whiteAlpha.500" noOfLines={1}>
                        {detail}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </Box>
            );
          })}
        </VStack>
      </Box>
    );
  } else if (mode === 'damage' || mode === 'strain' || mode === 'pouch') {
    const prompt = PROMPT[mode];
    title = `${prompt.label} — ${selectedName}`;
    body = (
      <Box>
        <Input
          ref={inputRef}
          size="md"
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
        />
        <Text mt={2} fontSize="2xs" color="whiteAlpha.500">
          {prompt.help}
        </Text>
        <HStack mt={3} justify="flex-end" spacing={2}>
          <Button size="xs" variant="ghost" onClick={cancel}>
            <HStack spacing={1}>
              <HintKey>Esc</HintKey>
              <Text>Cancel</Text>
            </HStack>
          </Button>
          <Button
            size="xs"
            colorScheme="blue"
            onClick={() => {
              submit(value);
              setValue('');
            }}
          >
            <HStack spacing={1}>
              <HintKey>↵</HintKey>
              <Text>Apply</Text>
            </HStack>
          </Button>
        </HStack>
      </Box>
    );
  }

  // Nothing to act on without a selected target.
  if (!selectedParticipantId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={cancel}
      isCentered
      // The vehicle weapon list has name + detail rows — give it more room
      // than the single-field input modes.
      size={weaponModeInVehicle ? 'md' : 'sm'}
      // Land focus straight on the input for the damage/strain/pouch modes
      // so the GM can type immediately. Weapon mode has no inputRef — Chakra
      // falls back to its default focus target, which is fine for the list.
      initialFocusRef={inputRef}
    >
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent bg="#2A2C30" color="whiteAlpha.900" borderWidth="1px" borderColor="whiteAlpha.100">
        <ModalBody py={4}>
          <Text
            fontSize="2xs"
            color="whiteAlpha.500"
            letterSpacing="0.16em"
            textTransform="uppercase"
            fontWeight="bold"
            mb={2}
          >
            {title}
          </Text>
          {body}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default QuickActionsBar;
