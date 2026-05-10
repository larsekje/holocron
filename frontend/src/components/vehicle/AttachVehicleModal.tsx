import React, {useEffect, useMemo, useState} from 'react';
import {
  Box,
  HStack,
  Input,
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
import {browseIndex, getDetail} from '@/data/spotlightIndex';
import useActiveVehicleStore, {
  buildVehicleSpecFromSpotlight,
} from '@/state/activeVehicleStore';
import type {Participant} from '@/state/participantsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The character whose sheet opened this modal — they become the pilot
   * of the picked vehicle. Minion-group participants are passed straight
   * through to `addVehicle`'s `minions` option so the squadron's ship
   * count matches the pilot's group size from the start. */
  participant: Participant;
}

/** Quick-setup picker: from a character's sheet, pick a vehicle from the
 * spotlight library and instantiate it with this character pre-bound as
 * the pilot. Skips the longer "make participant → add vehicle → attach
 * crew" detour that the GM would otherwise have to walk for a TIE-pilot
 * dogfight setup. */
const AttachVehicleModal: React.FC<Props> = ({isOpen, onClose, participant}) => {
  const addVehicle = useActiveVehicleStore((s) => s.add);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  // Browse all vehicles up-front, then narrow with the local query — the
  // index is small (~50 entries) so client-side filter is fine.
  const allVehicles = useMemo(() => browseIndex(500, ['vehicle' as any]), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allVehicles;
    return allVehicles.filter((v) =>
      v.name.toLowerCase().includes(q)
      || (v.subtitle ?? '').toLowerCase().includes(q)
      || (v.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [allVehicles, query]);

  const handlePick = (id: string) => {
    const detail = getDetail('vehicle' as any, id);
    if (!detail) return;
    const spec = buildVehicleSpecFromSpotlight(detail);
    addVehicle(
      spec,
      [{participantId: participant.id, role: 'pilot'}],
      {minions: participant.stats?.minions ?? 1},
    );
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700"/>
      <ModalContent bg="gray.900" color="gray.100" maxH="80vh">
        <ModalHeader>
          <HStack spacing={2}>
            <Text>Attach vehicle to</Text>
            <Text color="gray.400">{participant.name}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton/>
        <ModalBody>
          <Input
            size="sm"
            placeholder="Filter by name, group, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg="gray.800"
            borderColor="gray.700"
            mb={3}
            autoFocus
          />
          <VStack align="stretch" spacing={1} maxH="55vh" overflowY="auto">
            {filtered.length === 0 ? (
              <Text fontSize="sm" color="gray.500" fontStyle="italic" py={4} textAlign="center">
                No vehicles match.
              </Text>
            ) : (
              filtered.map((v) => (
                <Box
                  key={v.id}
                  as="button"
                  type="button"
                  onClick={() => handlePick(v.id)}
                  textAlign="left"
                  px={2}
                  py={2}
                  borderRadius="sm"
                  bg="transparent"
                  _hover={{bg: 'whiteAlpha.100'}}
                  transition="background 0.1s ease"
                >
                  <HStack justify="space-between" spacing={2} align="baseline">
                    <Text fontSize="sm" color="white" noOfLines={1} flex="1" minW={0}>
                      {v.name}
                    </Text>
                    {v.subtitle && (
                      <Text fontSize="xs" color="whiteAlpha.500" noOfLines={1} flexShrink={0}>
                        {v.subtitle}
                      </Text>
                    )}
                  </HStack>
                  {v.tags && v.tags.length > 0 && (
                    <HStack spacing={1} mt={1} flexWrap="wrap">
                      {v.tags.slice(0, 3).map((t) => (
                        <Tag key={t} size="sm" colorScheme="gray" variant="subtle">{t}</Tag>
                      ))}
                    </HStack>
                  )}
                </Box>
              ))
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AttachVehicleModal;
