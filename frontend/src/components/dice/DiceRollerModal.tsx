import React from 'react';
import {
  Heading,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
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
import { SkillChallengePlaceholder } from './SkillChallengePlaceholder';
import { ModifiersPopover } from './ModifiersPopover';
import { SegmentedToggle } from '@/components/ParticipantSheetView';
import useDiceRollerStore from '@/state/diceRollerStore';

interface DiceRollerModalProps {
  snapshot: ModalSnapshot | null;
  onClose: () => void;
}

const MODE_LABEL: Record<string, string> = {
  basic:          'Skill Check',
  opposed:        'Opposed',
  combat:         'Combat',
  skillChallenge: 'Skill Challenge',
};

function formatSkill(skill?: string): string {
  if (!skill) return '';
  return skill.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function formatChar(c?: string): string {
  if (!c) return '';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

/** Inline header chip showing the resolved attack target. When the snapshot
 * carries both a candidate participant and vehicle (vehicle weapon resolved
 * to a ship via a selected occupant), renders a [Pilot|Ship] segmented
 * switch right next to the name so the GM can flip without leaving the
 * modal. Direct selections (no candidates) render plain text. */
const TargetIndicator: React.FC<{ snapshot: ModalSnapshot }> = ({ snapshot }) => {
  const flipAttackTarget = useDiceRollerStore((s) => s.flipAttackTarget);
  const isVehicleTarget = !!snapshot.targetVehicleId;
  const targetName = isVehicleTarget
    ? snapshot.targetVehicleName
    : snapshot.target?.name;
  if (!targetName) return null;

  const hasToggle =
    snapshot.weaponKind === 'vehicle'
    && !!snapshot.targetCandidateParticipantId
    && !!snapshot.targetCandidateVehicleId;

  return (
    <HStack spacing={2} align="center">
      <Text fontSize="sm" color="gray.500">→</Text>
      <Text fontSize="sm" color="gray.50" fontWeight="semibold" noOfLines={1} maxW="220px">
        {targetName}
      </Text>
      {hasToggle && (
        <SegmentedToggle
          options={[
            { value: 'vehicle', label: 'Ship' },
            { value: 'character', label: 'Pilot' },
          ]}
          value={isVehicleTarget ? 'vehicle' : 'character'}
          onChange={(v) => flipAttackTarget(v as 'vehicle' | 'character')}
        />
      )}
    </HStack>
  );
};

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({ snapshot, onClose }) => {
  const isOpen = snapshot !== null;
  const mode = snapshot?.mode ?? 'basic';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent bg="gray.900" color="gray.100" maxH="85vh">
        <ModalHeader bg="gray.800" borderBottomWidth="1px" borderColor="gray.700" py={3}>
          <HStack spacing={3} align="baseline">
            <Tag colorScheme="orange" variant="subtle" size="sm" textTransform="uppercase" letterSpacing="0.1em">
              {MODE_LABEL[mode] ?? 'Roll'}
            </Tag>
            {snapshot?.attacker && (
              <Heading as="h3" size="sm" color="gray.50">
                {snapshot.attacker.name}
              </Heading>
            )}
            {snapshot && <TargetIndicator snapshot={snapshot} />}
            {snapshot?.skill && (
              <Text fontSize="sm" color="gray.400">
                {formatSkill(snapshot.skill)}
                {snapshot.characteristic && (
                  <Text as="span" color="gray.500">{` · ${formatChar(snapshot.characteristic)}`}</Text>
                )}
              </Text>
            )}
            {snapshot?.difficultyLabel && (
              <Tag colorScheme="purple" variant="outline" size="sm">
                {snapshot.difficultyLabel}
              </Tag>
            )}
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
