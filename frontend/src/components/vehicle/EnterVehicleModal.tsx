import React, {useEffect, useState} from 'react';
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
import useParticipantStore, {type VehicleRole} from '@/state/participantsStore';
import useActiveVehicleStore from '@/state/activeVehicleStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
}

const ROLES: VehicleRole[] = ['pilot', 'gunner', 'astromech', 'passenger'];

function defaultRoleForIndex(i: number): VehicleRole {
  if (i === 0) return 'pilot';
  if (i === 1) return 'gunner';
  if (i === 2) return 'astromech';
  return 'passenger';
}

/**
 * Bring participants aboard an existing vehicle. Multi-select with per-pick
 * role; submit calls `addOccupant` once per pick. Participants already aboard
 * another vehicle are flagged so the GM knows the assignment will move them.
 */
const EnterVehicleModal: React.FC<Props> = ({isOpen, onClose, vehicleId}) => {
  const participants = useParticipantStore((s) => s.participants);
  const vehicle = useActiveVehicleStore((s) => s.vehicles[vehicleId]);
  const addOccupant = useActiveVehicleStore((s) => s.addOccupant);

  const [selected, setSelected] = useState<Record<string, VehicleRole>>({});

  useEffect(() => {
    if (isOpen) setSelected({});
  }, [isOpen, vehicleId]);

  const selectedIds = Object.keys(selected);
  const canSubmit = selectedIds.length > 0;

  // Anyone not already on THIS vehicle is a candidate. Already-aboard-elsewhere
  // is allowed but flagged — selecting them moves them.
  const candidates = participants.filter((p) => p.equippedVehicleId !== vehicleId);

  const toggle = (participantId: string) => {
    setSelected((prev) => {
      if (prev[participantId]) {
        const next = {...prev};
        delete next[participantId];
        return next;
      }
      const idx = Object.keys(prev).length;
      return {...prev, [participantId]: defaultRoleForIndex(idx)};
    });
  };

  const setRole = (participantId: string, role: VehicleRole) => {
    setSelected((prev) => ({...prev, [participantId]: role}));
  };

  const handleSubmit = () => {
    for (const id of selectedIds) {
      addOccupant(vehicleId, id, selected[id]);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700"/>
      <ModalContent bg="gray.900" color="gray.100">
        <ModalHeader>
          <HStack spacing={2}>
            <Text>Bring aboard</Text>
            <Text color="gray.400">{vehicle?.name ?? 'Vehicle'}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton/>
        <ModalBody>
          {candidates.length === 0 ? (
            <Text fontSize="sm" color="gray.400">
              No participants available — every PC/NPC in the encounter is already aboard this
              ship.
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
                Pick crew
              </Text>
              {candidates.map((p) => {
                const isSelected = !!selected[p.id];
                const alreadyElsewhere = !!p.equippedVehicleId;
                return (
                  <HStack
                    key={p.id}
                    spacing={2}
                    px={2}
                    py={2}
                    borderRadius="sm"
                    bg={isSelected ? 'rgba(211,153,57,0.10)' : 'transparent'}
                    _hover={{bg: isSelected ? 'rgba(211,153,57,0.15)' : 'whiteAlpha.50'}}
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
                      {alreadyElsewhere && (
                        <Tag size="sm" variant="subtle" colorScheme="orange">
                          will move
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
                          <option key={r} value={r} style={{background: '#1a202c'}}>
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
          <Button colorScheme="orange" onClick={handleSubmit} isDisabled={!canSubmit}>
            {selectedIds.length > 1 ? `Bring ${selectedIds.length} aboard` : 'Bring aboard'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EnterVehicleModal;
