import React, { useEffect, useState } from 'react';
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
  Select,
  Tag,
  Text,
  VStack,
} from '@chakra-ui/react';
import useParticipantStore from '@/state/participantsStore';
import useActiveVehicleStore, {
  buildVehicleSpecFromSpotlight,
  type Occupant,
} from '@/state/activeVehicleStore';
import type { VehicleRole } from '@/state/participantsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The spotlight detail entry for the vehicle being added — contains
   * characteristics, derived, weapons, info needed to build a fresh active
   * vehicle instance. */
  vehicleDetail: any | null;
  /** Optional callback after the vehicle is added to the encounter (used by
   * Spotlight to close itself and toast). */
  onAdded?: (vehicleId: string) => void;
}

const ROLES: VehicleRole[] = ['pilot', 'gunner', 'astromech', 'passenger'];

function defaultRoleForIndex(i: number): VehicleRole {
  if (i === 0) return 'pilot';
  if (i === 1) return 'gunner';
  if (i === 2) return 'astromech';
  return 'passenger';
}

/**
 * Multi-select participant + role picker for adding a vehicle to the
 * encounter. Occupants are optional — a ship can sit in the encounter empty
 * and be entered later. Multi-crew is supported: multiple participants can
 * share one ship instance, all referencing the shared hull pool. Roles are
 * free-form display labels and don't gate mechanics.
 */
export const AddVehicleModal: React.FC<Props> = ({ isOpen, onClose, vehicleDetail, onAdded }) => {
  const participants = useParticipantStore((s) => s.participants);
  const addVehicle = useActiveVehicleStore((s) => s.add);

  const [selected, setSelected] = useState<Record<string, VehicleRole>>({});
  const [groupSize, setGroupSize] = useState<number>(1);

  // Reset selection state every time the modal opens with a new vehicle.
  useEffect(() => {
    if (isOpen) {
      setSelected({});
      setGroupSize(1);
    }
  }, [isOpen, vehicleDetail?.id]);

  const selectedIds = Object.keys(selected);
  const canAdd = !!vehicleDetail;

  const toggle = (participantId: string) => {
    setSelected((prev) => {
      if (prev[participantId]) {
        const next = { ...prev };
        delete next[participantId];
        return next;
      }
      const idx = Object.keys(prev).length;
      return { ...prev, [participantId]: defaultRoleForIndex(idx) };
    });
  };

  const setRole = (participantId: string, role: VehicleRole) => {
    setSelected((prev) => ({ ...prev, [participantId]: role }));
  };

  const handleAdd = () => {
    if (!vehicleDetail) return;
    const spec = buildVehicleSpecFromSpotlight(vehicleDetail);
    const occupants: Occupant[] = selectedIds.map((id) => ({
      participantId: id,
      role: selected[id],
    }));
    const id = addVehicle(spec, occupants, { minions: groupSize });
    onAdded?.(id);
    onClose();
  };

  const vehicleName = vehicleDetail?.fullName ?? vehicleDetail?.name ?? 'Vehicle';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent bg="gray.900" color="gray.100">
        <ModalHeader>
          <HStack spacing={2}>
            <Text>Add to encounter</Text>
            <Text color="gray.400">{vehicleName}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* Group size — leave at 1 for a single ship; bump up to add a
              starship-scale minion group (TIE squadron etc.) sharing one
              hull pool. Crew assignment below still applies to the group as
              a whole, not per-ship. */}
          <HStack mb={3} spacing={3} align="center">
            <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="0.06em">
              Group size
            </Text>
            <NumberInput
              size="xs"
              min={1}
              max={20}
              value={groupSize}
              onChange={(_, n) => setGroupSize(Number.isFinite(n) && n >= 1 ? n : 1)}
              w="64px"
            >
              <NumberInputField bg="gray.800" borderColor="gray.700" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Text fontSize="xs" color="gray.500" fontStyle="italic" noOfLines={1}>
              {groupSize > 1 ? `Minion group of ${groupSize} ships (shared hull pool)` : 'Single ship'}
            </Text>
          </HStack>
          {participants.length === 0 ? (
            <Text fontSize="sm" color="gray.400">
              The ship will be added to the encounter empty. Add PCs/NPCs first if you want to
              place crew aboard now.
            </Text>
          ) : (
            <VStack align="stretch" spacing={1}>
              <HStack justify="space-between" mb={1}>
                <Text
                  fontSize="xs"
                  color="gray.400"
                  textTransform="uppercase"
                  letterSpacing="0.06em"
                >
                  Pick occupants
                </Text>
                <Text fontSize="xs" color="gray.500" fontStyle="italic">
                  optional
                </Text>
              </HStack>
              {participants.map((p) => {
                const isSelected = !!selected[p.id];
                const alreadyAboard = !!p.equippedVehicleId;
                return (
                  <HStack
                    key={p.id}
                    spacing={2}
                    px={2}
                    py={2}
                    borderRadius="sm"
                    bg={isSelected ? 'rgba(211,153,57,0.10)' : 'transparent'}
                    _hover={{ bg: isSelected ? 'rgba(211,153,57,0.15)' : 'whiteAlpha.50' }}
                    align="center"
                  >
                    <Box
                      as="button"
                      type="button"
                      onClick={() => toggle(p.id)}
                      w="14px"
                      h="14px"
                      borderWidth="1px"
                      borderColor={isSelected ? 'orange.400' : 'gray.600'}
                      bg={isSelected ? 'orange.500' : 'transparent'}
                      borderRadius="sm"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="10px"
                      color="gray.900"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {isSelected ? '✓' : ''}
                    </Box>
                    <HStack
                      as="button"
                      type="button"
                      onClick={() => toggle(p.id)}
                      flex="1"
                      minW={0}
                      spacing={2}
                      justify="flex-start"
                    >
                      <Text fontSize="sm" color="gray.100" noOfLines={1}>
                        {p.name}
                      </Text>
                      {p.isPC && <Tag size="sm" variant="subtle" colorScheme="blue">PC</Tag>}
                      {alreadyAboard && (
                        <Tag size="sm" variant="subtle" colorScheme="orange">
                          already aboard
                        </Tag>
                      )}
                    </HStack>
                    {isSelected && (
                      <Select
                        size="xs"
                        w="110px"
                        flexShrink={0}
                        bg="gray.800"
                        borderColor="gray.700"
                        value={selected[p.id]}
                        onChange={(e) => setRole(p.id, e.target.value as VehicleRole)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} style={{ background: '#1a202c' }}>
                            {r[0].toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </Select>
                    )}
                  </HStack>
                );
              })}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={2} onClick={onClose} color="gray.300">
            Cancel
          </Button>
          <Button colorScheme="orange" onClick={handleAdd} isDisabled={!canAdd}>
            {selectedIds.length > 0 ? 'Add with crew' : 'Add empty'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddVehicleModal;
