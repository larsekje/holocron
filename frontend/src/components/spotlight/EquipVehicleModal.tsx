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
  /** The spotlight detail entry for the vehicle being equipped — contains
   * characteristics, derived, weapons, info needed to build a fresh active
   * vehicle instance. */
  vehicleDetail: any | null;
  /** Optional callback after a successful equip (used by Spotlight to close
   * itself and toast). */
  onEquipped?: (vehicleId: string) => void;
}

const ROLES: VehicleRole[] = ['pilot', 'gunner', 'passenger'];

function defaultRoleForIndex(i: number): VehicleRole {
  if (i === 0) return 'pilot';
  if (i === 1) return 'gunner';
  return 'passenger';
}

/**
 * Multi-select participant + role picker for equipping a vehicle. Supports
 * multi-crew: multiple participants can be aboard the same instance, sharing
 * its hull pool. The selected role is a free-form display label only — the
 * mechanics don't enforce who can fire what.
 */
export const EquipVehicleModal: React.FC<Props> = ({ isOpen, onClose, vehicleDetail, onEquipped }) => {
  const participants = useParticipantStore((s) => s.participants);
  const equip = useActiveVehicleStore((s) => s.equip);

  const [selected, setSelected] = useState<Record<string, VehicleRole>>({});

  // Reset selection state every time the modal opens with a new vehicle.
  useEffect(() => {
    if (isOpen) setSelected({});
  }, [isOpen, vehicleDetail?.id]);

  const selectedIds = Object.keys(selected);
  const canEquip = selectedIds.length > 0 && !!vehicleDetail;

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

  const handleEquip = () => {
    if (!vehicleDetail) return;
    const spec = buildVehicleSpecFromSpotlight(vehicleDetail);
    const occupants: Occupant[] = selectedIds.map((id) => ({
      participantId: id,
      role: selected[id],
    }));
    const id = equip(spec, occupants);
    onEquipped?.(id);
    onClose();
  };

  const vehicleName = vehicleDetail?.fullName ?? vehicleDetail?.name ?? 'Vehicle';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
      <ModalContent bg="gray.900" color="gray.100">
        <ModalHeader>
          <HStack spacing={2}>
            <Text>Equip</Text>
            <Text color="gray.400">{vehicleName}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {participants.length === 0 ? (
            <Text fontSize="sm" color="gray.400">
              No participants in the encounter. Add at least one PC or NPC before equipping a
              vehicle on them.
            </Text>
          ) : (
            <VStack align="stretch" spacing={1}>
              <Text
                fontSize="xs"
                color="gray.400"
                mb={1}
                textTransform="uppercase"
                letterSpacing="0.06em"
              >
                Pick occupants
              </Text>
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
          <Button colorScheme="orange" onClick={handleEquip} isDisabled={!canEquip}>
            Equip
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EquipVehicleModal;
