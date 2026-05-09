import React from 'react';
import {
  Box,
  Center,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Progress,
  Text,
} from '@chakra-ui/react';
import useActiveVehicleStore, {type ActiveVehicle} from '@/state/activeVehicleStore';
import useParticipantStore from '@/state/participantsStore';

interface Props {
  vehicle: ActiveVehicle;
}

// Sil-coded tier color so capital ships read differently from a speeder.
function silColor(silhouette: number): {bg: string; accent: string} {
  if (silhouette >= 6) return {bg: '#3a2455', accent: '#5a3a85'};   // capital
  if (silhouette >= 4) return {bg: '#3a3a18', accent: '#6a6a28'};   // freighter / corvette
  if (silhouette >= 2) return {bg: '#1f3a4a', accent: '#3a6a85'};   // starfighter
  return {bg: '#3a3f47', accent: '#5b6470'};                          // speeder / small craft
}

/**
 * Vehicle row in the targets list. Mirrors `<TargetCardOld>` visually so the
 * GM's eye reads them in the same vocabulary, but with starship semantics:
 * - Hull bar (current/threshold) on top, system-strain sliver below.
 * - No initiative slot — ships don't act on their own.
 * - Occupant chips show who's aboard.
 * - ⋮ menu currently exposes "Remove from encounter" only; damage/crit
 *   targeting hooks land in a follow-up.
 */
const VehicleTargetCardOld: React.FC<Props> = ({vehicle}) => {
  const remove = useActiveVehicleStore((s) => s.remove);
  const participants = useParticipantStore((s) => s.participants);

  const occupants = participants.filter((p) => p.equippedVehicleId === vehicle.id);

  const hullThreshold = vehicle.hullThreshold;
  const hullRemaining = Math.max(hullThreshold - vehicle.hullCurrent, 0);
  const hullPct = hullThreshold > 0 ? Math.max(0, hullRemaining / hullThreshold) * 100 : 0;

  const sysThreshold = vehicle.systemThreshold;
  const sysRatio =
    sysThreshold > 0 ? Math.max(0, (sysThreshold - vehicle.systemCurrent) / sysThreshold) * 100 : 0;

  const tier = silColor(vehicle.silhouette);
  const isDisabled = hullRemaining <= 0;

  return (
    <Flex
      h="40px"
      bg="#26292d"
      borderRadius="md"
      overflow="hidden"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      transition="background 0.1s ease"
      position="relative"
    >
      {/* Tier square (Sil-coded) */}
      <Center
        w="40px"
        h="100%"
        bg={tier.bg}
        flexShrink={0}
        _hover={{bg: tier.accent}}
        title={`Silhouette ${vehicle.silhouette}`}
      >
        <Text fontSize="xs" fontWeight="bold" color="white">
          Sil
        </Text>
        <Text fontSize="sm" fontWeight="bold" color="white" ml="2px">
          {vehicle.silhouette}
        </Text>
      </Center>

      {/* No initiative slot — placeholder kept the same width to align with
          the participant rows visually. */}
      <Center
        w="32px"
        h="100%"
        bg="#1c1e21"
        flexShrink={0}
        flexDirection="column"
      >
        <Text fontSize="9px" color="whiteAlpha.500" lineHeight="1" letterSpacing="0.05em">
          SHIP
        </Text>
        <Text fontSize="9px" color="whiteAlpha.400" lineHeight="1.1">
          —
        </Text>
      </Center>

      {/* Hull bar + system-strain sliver + name overlay */}
      <Box flex="1" position="relative" h="100%" overflow="hidden">
        {/* Hull bar */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h={sysThreshold > 0 ? 'calc(100% - 8px)' : '100%'}
          bg="#1a1d21"
        >
          <Progress
            value={hullPct}
            colorScheme={isDisabled ? 'red' : 'orange'}
            bg="#1a1d21"
            h="100%"
          />
        </Box>
        {/* System strain sliver */}
        {sysThreshold > 0 && (
          <Box position="absolute" bottom={0} left={0} right={0} h="8px" bg="#0e1622">
            <Progress
              value={sysRatio}
              colorScheme="purple"
              bg="#0e1622"
              h="100%"
              size="sm"
            />
          </Box>
        )}

        <HStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          h={sysThreshold > 0 ? 'calc(100% - 8px)' : '100%'}
          px={3}
          justify="space-between"
          color="white"
          spacing={2}
        >
          <HStack spacing={2} minW={0} flex="1">
            <Text
              userSelect="none"
              noOfLines={1}
              fontWeight="semibold"
              textDecoration={isDisabled ? 'line-through' : 'none'}
              textShadow="0 1px 2px rgba(0,0,0,0.7)"
            >
              {vehicle.name}
            </Text>
            {occupants.length > 0 && (
              <HStack spacing={1} flexShrink={0}>
                {occupants.slice(0, 3).map((p) => (
                  <Box
                    key={p.id}
                    px="6px"
                    py="1px"
                    bg="#1f3a4a"
                    color="#9ec8e0"
                    fontSize="9px"
                    fontWeight="bold"
                    letterSpacing="0.06em"
                    textTransform="uppercase"
                    borderRadius="sm"
                    title={p.vehicleRole ? `${p.name} (${p.vehicleRole})` : p.name}
                  >
                    {p.vehicleRole ?? 'aboard'}: {p.name}
                  </Box>
                ))}
                {occupants.length > 3 && (
                  <Box
                    px="6px"
                    py="1px"
                    bg="#1f3a4a"
                    color="#9ec8e0"
                    fontSize="9px"
                    fontWeight="bold"
                    borderRadius="sm"
                  >
                    +{occupants.length - 3}
                  </Box>
                )}
              </HStack>
            )}
          </HStack>
          <HStack spacing={0} flexShrink={0} textShadow="0 1px 2px rgba(0,0,0,0.7)">
            <Text fontWeight="bold" fontSize="md" lineHeight="1">{hullRemaining}</Text>
            <Text fontSize="xs" color="whiteAlpha.700" lineHeight="1">/{hullThreshold}</Text>
          </HStack>
        </HStack>
      </Box>

      {/* Context menu */}
      <Menu placement="bottom-end" isLazy>
        <MenuButton
          as={Center}
          role="button"
          aria-label="Vehicle actions"
          w="36px"
          h="100%"
          bg="#1c1e21"
          color="whiteAlpha.700"
          cursor="pointer"
          flexShrink={0}
          _hover={{bg: 'orange.500', color: 'gray.900'}}
          transition="background 0.1s ease, color 0.1s ease"
        >
          <Text fontSize="lg" fontWeight="bold" lineHeight="1" letterSpacing="-0.05em">⋮</Text>
        </MenuButton>
        <Portal>
          <MenuList
            bg="#1f2125"
            borderColor="whiteAlpha.200"
            color="gray.100"
            minW="220px"
            boxShadow="0 14px 32px rgba(0,0,0,0.6)"
            zIndex={9999}
          >
            <MenuItem isDisabled bg="transparent" _hover={{bg: 'whiteAlpha.100'}}>
              {vehicle.name}
            </MenuItem>
            <MenuDivider borderColor="whiteAlpha.200"/>
            <MenuItem
              bg="transparent"
              _hover={{bg: 'whiteAlpha.100'}}
              color="red.400"
              onClick={() => remove(vehicle.id)}
            >
              Remove from encounter
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    </Flex>
  );
};

export default VehicleTargetCardOld;
