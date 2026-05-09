import React from 'react';
import {
  Box,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { DiceRollMode, ModalSnapshot } from './mockSnapshots';
import { PoolBuilder } from './PoolBuilder';
import { PresetBar } from './PresetBar';
import { RollButton } from './RollButton';
import { SpendPanel } from './SpendPanel';
import { CombatPanel } from './CombatPanel';
import { OpposedPanel } from './OpposedPanel';
import { SkillChallengePlaceholder } from './SkillChallengePlaceholder';

interface DiceRollerModalProps {
  snapshot: ModalSnapshot | null;
  onClose: () => void;
}

const MODES: { mode: DiceRollMode; label: string }[] = [
  { mode: 'basic',          label: 'Skill Check' },
  { mode: 'opposed',        label: 'Opposed' },
  { mode: 'combat',         label: 'Combat' },
  { mode: 'skillChallenge', label: 'Skill Challenge' },
];

function formatSkill(skill?: string): string {
  if (!skill) return '';
  return skill.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function formatChar(c?: string): string {
  if (!c) return '';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({ snapshot, onClose }) => {
  const isOpen = snapshot !== null;
  const mode = snapshot?.mode ?? 'basic';
  const hasContext = !!(snapshot?.attacker || snapshot?.skill || snapshot?.difficultyLabel);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="rgba(0,0,0,0.6)" />
      <ModalContent bg="#1f2125" color="gray.100" borderColor="gray.700" borderWidth="1px">
        {/* Tabs as header */}
        <ModalHeader p={0} borderBottomWidth="1px" borderColor="gray.700">
          <HStack spacing={0} px={4}>
            {MODES.map((m) => {
              const isActive = m.mode === mode;
              return (
                <Box
                  key={m.mode}
                  as="button"
                  type="button"
                  onClick={() => undefined}
                  py={3}
                  px={4}
                  fontSize="sm"
                  fontWeight={isActive ? 'semibold' : 'normal'}
                  color={isActive ? 'purple.200' : 'gray.500'}
                  borderBottomWidth="2px"
                  borderBottomColor={isActive ? 'purple.300' : 'transparent'}
                  mb="-1px"
                  cursor="pointer"
                  _hover={{ color: 'gray.100' }}
                >
                  {m.label}
                </Box>
              );
            })}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pt={4} pb={4}>
          {snapshot && (
            <VStack align="stretch" spacing={3}>
              {hasContext && (
                <HStack spacing={2} fontSize="sm" wrap="wrap">
                  {snapshot.attacker && (
                    <Text color="gray.100" fontWeight="semibold">{snapshot.attacker.name}</Text>
                  )}
                  {snapshot.skill && (
                    <Text color="gray.400">
                      · {formatSkill(snapshot.skill)}
                      {snapshot.characteristic && ` (${formatChar(snapshot.characteristic)})`}
                    </Text>
                  )}
                  {snapshot.difficultyLabel && (
                    <Text color="gray.500">· {snapshot.difficultyLabel}</Text>
                  )}
                </HStack>
              )}

              {mode === 'skillChallenge' ? (
                <SkillChallengePlaceholder />
              ) : (
                <>
                  <PresetBar mode={mode} appliedPresetIds={snapshot.appliedPresets} />
                  <PoolBuilder pool={snapshot.pool} result={snapshot.result} />

                  {mode === 'combat'  && <CombatPanel  snapshot={snapshot} />}
                  {mode === 'opposed' && <OpposedPanel snapshot={snapshot} />}

                  {snapshot.result && (
                    <SpendPanel
                      result={snapshot.result}
                      mode={mode}
                      spent={snapshot.spent}
                      weapon={snapshot.weapon}
                    />
                  )}
                </>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor="gray.700">
          <Box width="100%">
            {snapshot && mode !== 'skillChallenge' && (
              <RollButton pool={snapshot.pool} hasResult={snapshot.result !== null} />
            )}
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
