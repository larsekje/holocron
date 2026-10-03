import React from 'react';
import {
  Box,
  Button,
  Heading,
  HStack,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Tag,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { ModalSnapshot } from './mockSnapshots';
import { PoolBuilder } from './PoolBuilder';
import { RollButton } from './RollButton';
import { SpendPanel } from './SpendPanel';
import { CombatPanel } from './CombatPanel';
import { CombatDamagePanel } from './CombatDamagePanel';
import { OpposedPanel } from './OpposedPanel';
import { OppositionRow } from './OppositionRow';
import { SkillChallengePlaceholder } from './SkillChallengePlaceholder';
import { ModifiersPopover } from './ModifiersPopover';
import { SegmentedToggle } from '@/components/ParticipantSheetView';
import useDiceRollerStore from '@/state/diceRollerStore';
import useParticipantStore, { isParticipantDead, teamOf } from '@/state/participantsStore';
import { ChevronDownIcon } from '@chakra-ui/icons';

interface DiceRollerModalProps {
  snapshot: ModalSnapshot | null;
  onClose: () => void;
}

const MODE_LABEL: Record<string, string> = {
  basic:          'Skill Check',
  opposed:        'Opposed',
  combat:         'Combat',
  skillChallenge: 'Skill Challenge',
  polyhedral:     'Dice',
};

/** `→ TargetName` — sits inline next to the attacker name so the GM reads
 * "Han Solo → TIE Advanced" as one phrase. In combat it's a menu: pick who
 * the attack goes at without closing the roller (the default is the
 * selected target, which is easy to get wrong mid-turn). Vehicle targets
 * stay plain text — they're routed via the [Ship|Pilot] toggle. */
const TargetText: React.FC<{ snapshot: ModalSnapshot }> = ({ snapshot }) => {
  const participants = useParticipantStore((s) => s.participants);
  const setAttackTarget = useDiceRollerStore((s) => s.setAttackTarget);
  const isVehicleTarget = !!snapshot.targetVehicleId;
  const targetName = isVehicleTarget
    ? snapshot.targetVehicleName
    : snapshot.target?.name;

  if (snapshot.mode !== 'combat' || isVehicleTarget) {
    if (!targetName) return null;
    return (
      <HStack spacing={2} align="center">
        <Text fontSize="sm" color="gray.500">→</Text>
        <Text fontSize="sm" color="gray.50" fontWeight="semibold" noOfLines={1} maxW="220px">
          {targetName}
        </Text>
      </HStack>
    );
  }

  const attacker = participants.find((p) => p.id === snapshot.attackerParticipantId);
  const candidates = participants.filter(
    (p) => p.id !== snapshot.attackerParticipantId && !isParticipantDead(p),
  );
  // Opponents first: the other side of the table from the attacker.
  const opponents = candidates.filter((p) => !attacker || teamOf(p) !== teamOf(attacker));
  const sameSide = candidates.filter((p) => attacker && teamOf(p) === teamOf(attacker));
  const item = (p: (typeof candidates)[number]) => (
    <MenuItem
      key={p.id}
      bg="transparent"
      _hover={{ bg: 'whiteAlpha.100' }}
      fontSize="sm"
      fontWeight={p.id === snapshot.targetParticipantId ? 'bold' : 'normal'}
      onClick={() => setAttackTarget(p.id)}
    >
      {p.name}
    </MenuItem>
  );

  return (
    <HStack spacing={2} align="center">
      <Text fontSize="sm" color="gray.500">→</Text>
      {/* Box wrapper: as a direct HStack child the menu's popper div would
          inherit the stack's spacing margin (Popper warns about it). */}
      <Box>
      <Menu placement="bottom-start" isLazy>
        <MenuButton
          as={Button}
          size="xs"
          variant="ghost"
          rightIcon={<ChevronDownIcon />}
          color={targetName ? 'gray.50' : 'orange.300'}
          fontWeight="semibold"
          fontSize="sm"
          px={1.5}
          maxW="240px"
          _hover={{ bg: 'whiteAlpha.100' }}
          _active={{ bg: 'whiteAlpha.200' }}
        >
          <Text as="span" noOfLines={1}>{targetName ?? 'Pick a target'}</Text>
        </MenuButton>
        <MenuList bg="gray.800" borderColor="gray.600" color="whiteAlpha.900" maxH="50vh" overflowY="auto" zIndex={1500}>
          {opponents.length > 0 && (
            <MenuGroup title="Opponents" fontSize="2xs" color="gray.400" textTransform="uppercase" letterSpacing="0.12em">
              {opponents.map(item)}
            </MenuGroup>
          )}
          {sameSide.length > 0 && (
            <MenuGroup title="Same side" fontSize="2xs" color="gray.400" textTransform="uppercase" letterSpacing="0.12em">
              {sameSide.map(item)}
            </MenuGroup>
          )}
          {snapshot.targetParticipantId && (
            <MenuItem
              bg="transparent"
              _hover={{ bg: 'whiteAlpha.100' }}
              fontSize="sm"
              color="gray.400"
              onClick={() => setAttackTarget(null)}
            >
              No target
            </MenuItem>
          )}
        </MenuList>
      </Menu>
      </Box>
    </HStack>
  );
};

/** [Ship|Pilot] segmented switch — right-anchored in the header so flipping
 * doesn't shift its position under the cursor. Only renders when the
 * snapshot carries both a candidate participant and vehicle (a vehicle
 * weapon resolved to a ship via a selected occupant). */
const TargetToggle: React.FC<{ snapshot: ModalSnapshot }> = ({ snapshot }) => {
  const flipAttackTarget = useDiceRollerStore((s) => s.flipAttackTarget);
  const isVehicleTarget = !!snapshot.targetVehicleId;
  const hasToggle =
    snapshot.weaponKind === 'vehicle'
    && !!snapshot.targetCandidateParticipantId
    && !!snapshot.targetCandidateVehicleId;
  if (!hasToggle) return null;
  return (
    <SegmentedToggle
      options={[
        { value: 'vehicle', label: 'Ship' },
        { value: 'character', label: 'Pilot' },
      ]}
      value={isVehicleTarget ? 'vehicle' : 'character'}
      onChange={(v) => flipAttackTarget(v as 'vehicle' | 'character')}
    />
  );
};

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({ snapshot, onClose }) => {
  const isOpen = snapshot !== null;
  const mode = snapshot?.mode ?? 'basic';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent bg="gray.900" color="gray.100" maxH="85vh">
        <ModalHeader bg="gray.800" borderBottomWidth="1px" borderColor="gray.700" py={3} pr={12}>
          <HStack spacing={3} align="baseline">
            <Tag colorScheme="orange" variant="subtle" size="sm" textTransform="uppercase" letterSpacing="0.1em">
              {MODE_LABEL[mode] ?? 'Roll'}
            </Tag>
            {snapshot?.attacker && (
              <Heading as="h3" size="sm" color="gray.50">
                {snapshot.attacker.name}
              </Heading>
            )}
            {snapshot && <TargetText snapshot={snapshot} />}
            <Spacer />
            {snapshot && <TargetToggle snapshot={snapshot} />}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={4}>
          {snapshot && (
            <VStack align="stretch" spacing={3}>
              {mode === 'skillChallenge' ? (
                <SkillChallengePlaceholder />
              ) : (
                <>
                  {mode === 'combat' && <CombatPanel snapshot={snapshot} />}
                  {(mode === 'basic' || mode === 'opposed') && snapshot.skill && (
                    <OppositionRow snapshot={snapshot} />
                  )}
                  {mode === 'opposed' && <OpposedPanel snapshot={snapshot} />}

                  <ModifiersPopover mode={mode} appliedModifierIds={snapshot.appliedModifiers} />
                  <PoolBuilder
                    pool={snapshot.pool}
                    result={snapshot.result}
                    mode={mode}
                    appliedPresetIds={snapshot.appliedPresets}
                    weaponRange={snapshot.weapon?.range}
                  />

                  <RollButton pool={snapshot.pool} hasResult={snapshot.result !== null} />

                  {mode === 'combat' && <CombatDamagePanel snapshot={snapshot} />}

                  <SpendPanel
                    result={snapshot.result}
                    mode={mode}
                    spent={snapshot.spent}
                    weapon={snapshot.weapon}
                  />
                </>
              )}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
