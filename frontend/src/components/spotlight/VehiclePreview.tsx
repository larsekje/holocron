import React from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useSpotlightStore } from '@/state/spotlightStore';
import { VehicleWeaponsTable } from '@components/participantStatus/VehicleWeaponsTable';
import { AddVehicleModal } from './AddVehicleModal';

interface Props {
  detail: any;
}

const StatChip: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <HStack as="span" spacing={2}>
    <Text
      as="span"
      fontSize="xs"
      color="gray.500"
      textTransform="uppercase"
      letterSpacing="0.06em"
    >
      {label}
    </Text>
    <Text as="span" fontSize="sm" color="gray.200" fontWeight="semibold">
      {value}
    </Text>
  </HStack>
);

function formatHyperdrive(hd: any): string | null {
  if (hd == null) return null;
  if (typeof hd === 'number') return `Class ${hd}`;
  if (typeof hd === 'object') {
    const primary = hd.primary != null ? `Class ${hd.primary}` : null;
    const backup = hd.backup != null ? `backup ${hd.backup}` : null;
    return [primary, backup].filter(Boolean).join(' (') + (backup ? ')' : '');
  }
  return String(hd);
}

/**
 * Vehicle Spotlight detail. Stat strip + sub-blocks (crew, hyperdrive, sensors,
 * manufacturer) + weapons table. The "Add to encounter" button opens
 * AddVehicleModal, which creates a fresh ActiveVehicle and optionally links
 * one or more participants as crew.
 *
 * The detail data is already Genesys-converted at build time
 * (`buildSpotlightIndex.mjs` → `convertVehicleToGenesys`), so all numbers
 * displayed here match what the GM expects at the table.
 */
export const VehiclePreview: React.FC<Props> = ({ detail }) => {
  const closeSpotlight = useSpotlightStore((s) => s.close);
  const toast = useToast();
  const addModal = useDisclosure();

  const characteristics = detail.characteristics ?? {};
  const derived = detail.derived ?? {};
  const info = detail.info ?? {};

  const sil = characteristics.Silhouette;
  const speed = characteristics.Speed;
  const handling = characteristics.Handling;
  const armor = derived.armour;
  const hull = derived.hull;
  const system = derived.system;
  const defense = derived.defense;
  const hardpoints = info.hardpoints;

  const hyperdriveText = formatHyperdrive(info.hyperdrive);

  const handleAdded = (vehicleId: string) => {
    closeSpotlight();
    toast({
      title: 'Added to encounter',
      description: `${detail.fullName ?? detail.name} is now in the encounter.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    void vehicleId; // currently unused, but the store returns the id for future hooks
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Button
        size="sm"
        leftIcon={<AddIcon />}
        bg="#d39939"
        color="#1a1d24"
        fontWeight="bold"
        letterSpacing="0.04em"
        _hover={{ bg: 'yellow.400' }}
        alignSelf="flex-start"
        onClick={addModal.onOpen}
      >
        Add to encounter
      </Button>

      {/* Stat strip — same shape as armor/gear/weapon detail rendering. */}
      <Box overflowX="auto" whiteSpace="nowrap">
        <HStack as="span" spacing={4}>
          {sil != null && <StatChip label="Sil" value={sil} />}
          {speed != null && <StatChip label="Speed" value={speed} />}
          {handling != null && <StatChip label="Handling" value={String(handling)} />}
          {armor != null && <StatChip label="Armor" value={armor} />}
          {hull != null && <StatChip label="Hull" value={hull} />}
          {system != null && <StatChip label="System" value={system} />}
          {defense != null && <StatChip label="Defense" value={defense} />}
          {hardpoints != null && <StatChip label="HP" value={hardpoints} />}
        </HStack>
      </Box>

      {/* Crew & Cargo */}
      {(info.complement || info.passengers != null || info.encumbrance != null || info.consumables) && (
        <Box>
          <Text
            fontSize="xs"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="0.06em"
            mb={1}
          >
            Crew & Cargo
          </Text>
          <Wrap spacing={4} fontSize="sm" color="gray.200">
            {info.complement && (
              <WrapItem>
                <Text>
                  <Text as="span" color="gray.500">Crew: </Text>
                  {info.complement}
                </Text>
              </WrapItem>
            )}
            {info.passengers != null && (
              <WrapItem>
                <Text>
                  <Text as="span" color="gray.500">Passengers: </Text>
                  {String(info.passengers)}
                </Text>
              </WrapItem>
            )}
            {info.encumbrance != null && (
              <WrapItem>
                <Text>
                  <Text as="span" color="gray.500">Encum: </Text>
                  {info.encumbrance}
                </Text>
              </WrapItem>
            )}
            {info.consumables && (
              <WrapItem>
                <Text>
                  <Text as="span" color="gray.500">Consumables: </Text>
                  {info.consumables}
                </Text>
              </WrapItem>
            )}
          </Wrap>
        </Box>
      )}

      {/* Hyperdrive / Sensors / Manufacturer */}
      {(hyperdriveText || info.sensors || info.manufacturer || info.type) && (
        <Box>
          <Wrap spacing={4} fontSize="sm" color="gray.200">
            {hyperdriveText && (
              <WrapItem>
                <Text>
                  <Text as="span" color="gray.500">Hyperdrive: </Text>
                  {hyperdriveText}
                </Text>
              </WrapItem>
            )}
            {info.sensors && (
              <WrapItem>
                <Text>
                  <Text as="span" color="gray.500">Sensors: </Text>
                  {info.sensors}
                </Text>
              </WrapItem>
            )}
            {info.manufacturer && (
              <WrapItem>
                <Text>
                  <Text as="span" color="gray.500">Manufacturer: </Text>
                  {info.manufacturer}
                </Text>
              </WrapItem>
            )}
            {info.type && (
              <WrapItem>
                <Text>
                  <Text as="span" color="gray.500">Class: </Text>
                  {info.type}
                </Text>
              </WrapItem>
            )}
          </Wrap>
        </Box>
      )}

      {/* Weapons */}
      {Array.isArray(detail.weapons) && detail.weapons.length > 0 && (
        <Box>
          <Text
            fontSize="xs"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="0.06em"
            mb={2}
          >
            Weapons
          </Text>
          <VehicleWeaponsTable weapons={detail.weapons} />
        </Box>
      )}

      <AddVehicleModal
        isOpen={addModal.isOpen}
        onClose={addModal.onClose}
        vehicleDetail={detail}
        onAdded={handleAdded}
      />
    </VStack>
  );
};

export default VehiclePreview;
