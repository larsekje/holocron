import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  VStack,
} from '@chakra-ui/react';
import { SKILL_CHALLENGE_PRESETS } from '@/state/skillChallengeStore';

interface StartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (cfg: {
    name: string;
    targetSuccesses: number;
    allowedFailures: number;
    turnLimit?: number;
  }) => void;
}

const DEFAULT_FAILURES = 3;

export const StartChallengeModal: React.FC<StartModalProps> = ({ isOpen, onClose, onStart }) => {
  const [name, setName] = useState('');
  const [targetSuccesses, setTargetSuccesses] = useState(10);
  const [allowedFailures, setAllowedFailures] = useState(DEFAULT_FAILURES);
  const [limitTurns, setLimitTurns] = useState(false);
  const [turnLimit, setTurnLimit] = useState(5);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const applyPreset = (presetId: typeof SKILL_CHALLENGE_PRESETS[number]['id']) => {
    const preset = SKILL_CHALLENGE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setTargetSuccesses(preset.targetSuccesses);
    setTurnLimit(preset.turnLimit);
    setLimitTurns(true);
    setActivePresetId(preset.id);
  };

  const handleStart = () => {
    const trimmed = name.trim() || 'Skill Challenge';
    onStart({
      name: trimmed,
      targetSuccesses,
      allowedFailures,
      turnLimit: limitTurns ? turnLimit : undefined,
    });
    setName('');
    setTargetSuccesses(10);
    setAllowedFailures(DEFAULT_FAILURES);
    setLimitTurns(false);
    setTurnLimit(5);
    setActivePresetId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent bg="gray.900" color="gray.100">
        <ModalHeader>Start skill challenge</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontSize="xs" color="gray.400" mb={1} textTransform="uppercase" letterSpacing="0.06em">
                Name
              </Text>
              <Box
                as="input"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') handleStart();
                }}
                placeholder="e.g. Speeder chase through the canyon"
                w="100%"
                bg="gray.800"
                borderWidth="1px"
                borderColor="gray.700"
                borderRadius="md"
                px={3}
                py={2}
                fontSize="sm"
                color="gray.100"
                _focus={{ outline: 'none', borderColor: 'orange.400' }}
              />
            </Box>

            <HStack spacing={3}>
              <Box flex="1">
                <Text fontSize="xs" color="gray.400" mb={1} textTransform="uppercase" letterSpacing="0.06em">
                  Successes needed
                </Text>
                <NumberInput
                  value={targetSuccesses}
                  onChange={(_, num) => {
                    setTargetSuccesses(Number.isFinite(num) ? num : 1);
                    setActivePresetId(null);
                  }}
                  min={1}
                  max={30}
                  size="sm"
                >
                  <NumberInputField bg="gray.800" borderColor="gray.700" />
                  <NumberInputStepper>
                    <NumberIncrementStepper color="gray.300" borderColor="gray.700" />
                    <NumberDecrementStepper color="gray.300" borderColor="gray.700" />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
              <Box flex="1">
                <Text fontSize="xs" color="gray.400" mb={1} textTransform="uppercase" letterSpacing="0.06em">
                  Failures allowed
                </Text>
                <NumberInput
                  value={allowedFailures}
                  onChange={(_, num) => {
                    setAllowedFailures(Number.isFinite(num) ? num : 1);
                    setActivePresetId(null);
                  }}
                  min={1}
                  max={20}
                  size="sm"
                >
                  <NumberInputField bg="gray.800" borderColor="gray.700" />
                  <NumberInputStepper>
                    <NumberIncrementStepper color="gray.300" borderColor="gray.700" />
                    <NumberDecrementStepper color="gray.300" borderColor="gray.700" />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
            </HStack>

            <Box>
              <HStack
                as="button"
                type="button"
                onClick={() => {
                  setLimitTurns(!limitTurns);
                  setActivePresetId(null);
                }}
                spacing={2}
                cursor="pointer"
                _hover={{ color: 'gray.200' }}
              >
                <Box
                  w="14px"
                  h="14px"
                  borderWidth="1px"
                  borderColor={limitTurns ? 'orange.400' : 'gray.600'}
                  bg={limitTurns ? 'orange.500' : 'transparent'}
                  borderRadius="sm"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="10px"
                  color="gray.900"
                  fontWeight="bold"
                >
                  {limitTurns ? '✓' : ''}
                </Box>
                <Text fontSize="xs" color="gray.300">
                  Also impose a turn limit
                </Text>
              </HStack>
              {limitTurns && (
                <Box mt={2} pl={5}>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Turns allowed
                  </Text>
                  <NumberInput
                    value={turnLimit}
                    onChange={(_, num) => {
                      setTurnLimit(Number.isFinite(num) ? num : 1);
                      setActivePresetId(null);
                    }}
                    min={1}
                    max={20}
                    size="sm"
                    maxW="120px"
                  >
                    <NumberInputField bg="gray.800" borderColor="gray.700" />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.300" borderColor="gray.700" />
                      <NumberDecrementStepper color="gray.300" borderColor="gray.700" />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>
              )}
            </Box>

            <Box>
              <Text fontSize="xs" color="gray.400" mb={1.5} textTransform="uppercase" letterSpacing="0.06em">
                Difficulty preset (PDF p. 15)
              </Text>
              <HStack spacing={1.5}>
                {SKILL_CHALLENGE_PRESETS.map((p) => {
                  const isActive = activePresetId === p.id;
                  return (
                    <Button
                      key={p.id}
                      size="xs"
                      flex="1"
                      variant={isActive ? 'solid' : 'outline'}
                      colorScheme={isActive ? 'orange' : 'whiteAlpha'}
                      color={isActive ? undefined : 'whiteAlpha.800'}
                      onClick={() => applyPreset(p.id)}
                    >
                      <VStack spacing={0} lineHeight="1">
                        <Text fontSize="11px" fontWeight="bold">
                          {p.label}
                        </Text>
                        <Text fontSize="9px" color={isActive ? 'whiteAlpha.800' : 'whiteAlpha.500'}>
                          {p.targetSuccesses}s / {p.turnLimit}t
                        </Text>
                      </VStack>
                    </Button>
                  );
                })}
              </HStack>
              <Text fontSize="10px" color="gray.500" mt={1.5}>
                Presets set successes + turn limit. Failure cap stays at your value.
              </Text>
            </Box>

            <Text fontSize="xs" color="gray.500">
              Reach {targetSuccesses} successes before {allowedFailures} failures
              {limitTurns ? `, within ${turnLimit} turn${turnLimit === 1 ? '' : 's'}` : ''}.
              The GM judges each roll and clicks +Success / +Failure
              {limitTurns ? ' / Next Turn' : ''}.
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={2} onClick={onClose} color="gray.300">
            Cancel
          </Button>
          <Button colorScheme="orange" onClick={handleStart}>
            Start
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StartChallengeModal;
