import React from "react";
import {Box, HStack, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Portal, Text, Tooltip} from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantStore from "@/state/participantsStore";
import {disabledSlotIndices} from "@/utils/initiativeSlots";

const InitiativeOrder: React.FC = () => {
  const initiativeOrder = useGameplayStore((state) => state.context.initiativeOrder);
  const currentTurnIndex = useGameplayStore((state) => state.context.currentTurnIndex);
  const participants = useParticipantStore((state) => state.participants);
  const removeSlot = useGameplayStore((state) => state.removeSlot);
  const insertSlot = useGameplayStore((state) => state.insertSlot);
  // Two-step remove: the first click arms it for that slot index.
  const [armedRemove, setArmedRemove] = React.useState<number | null>(null);

  // Which slots are disabled (a team's trailing slots go dark as it loses
  // members — see disabledSlotIndices). Same helper drives the FSM's
  // turn-advance skip, so what's greyed here is exactly what gets skipped.
  const disabledSlots = React.useMemo(
    () => disabledSlotIndices(initiativeOrder, participants),
    [initiativeOrder, participants],
  );

  if (initiativeOrder.length === 0) return null;

  return (
    <HStack spacing="3px" align="stretch" px={1} maxW="min(70vw, 1100px)" overflowX="auto">
      {initiativeOrder.map((slot, index) => {
        const isActive = currentTurnIndex === index;
        const isPast = index < currentTurnIndex;
        const isPC = slot.team === "PC";
        const teamColor = isPC ? "#3a7e57" : "#b03030";
        const slotDead = disabledSlots.has(index);
        // A dead slot just reads as a downed team slot — it's no longer tied
        // to one participant. Past (used) slots still chronicle who took them.
        const tooltipText = slotDead
          ? `${slot.team} slot — down`
          : isPast && slot.name
          ? `${slot.team} slot — ${slot.name}`
          : `${slot.team} slot ${index + 1}`;

        return (
          <Menu key={index} placement="bottom" isLazy onClose={() => setArmedRemove(null)}>
          <Tooltip
            hasArrow
            placement="top"
            openDelay={200}
            bg="#1f2125"
            color="gray.100"
            borderColor="whiteAlpha.200"
            borderWidth="1px"
            borderRadius="md"
            label={<Text fontSize="xs">{tooltipText} · click to edit slots</Text>}
          >
            <MenuButton
              as={Box}
              role="button"
              cursor="pointer"
              position="relative"
              w="50px"
              h="34px"
              bg="#221c1d"
              borderWidth="1px"
              borderColor={isActive ? "#d39939" : "whiteAlpha.150"}
              borderRadius="sm"
              boxShadow={isActive ? "0 0 0 1px #d39939, 0 4px 10px rgba(211,153,57,0.35)" : "none"}
              opacity={slotDead ? 0.35 : isPast ? 0.55 : 1}
              transition="all 0.15s ease"
              flexShrink={0}
              overflow="hidden"
            >
              {/* Team-coloured cap */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="5px"
                bg={teamColor}
                opacity={slotDead ? 0.5 : 1}
              />
              {/* Team label */}
              <Text
                position="absolute"
                top="9px"
                left={0}
                right={0}
                textAlign="center"
                fontSize="11px"
                fontWeight="bold"
                letterSpacing="0.14em"
                color={isActive ? "#d39939" : "whiteAlpha.800"}
                lineHeight="1"
                textDecoration={slotDead ? "line-through" : "none"}
              >
                {slot.team}
              </Text>
              {/* Active arrow / down marker */}
              {isActive && !slotDead && (
                <Text
                  position="absolute"
                  bottom="3px"
                  left="50%"
                  transform="translateX(-50%)"
                  fontSize="9px"
                  color="#d39939"
                  lineHeight="1"
                >
                  ▲
                </Text>
              )}
              {slotDead && (
                <Text
                  position="absolute"
                  bottom="2px"
                  left="50%"
                  transform="translateX(-50%)"
                  fontSize="8px"
                  color="whiteAlpha.500"
                  letterSpacing="0.10em"
                  lineHeight="1"
                >
                  DOWN
                </Text>
              )}
            </MenuButton>
          </Tooltip>
          <Portal>
            <MenuList
              bg="#1f2125"
              borderColor="whiteAlpha.200"
              color="gray.100"
              minW="170px"
              py={1}
              zIndex={9999}
              sx={{ "& button": { fontSize: "sm", paddingTop: "5px", paddingBottom: "5px" } }}
            >
              <MenuItem bg="transparent" _hover={{bg: "whiteAlpha.100"}} onClick={() => insertSlot(index, "PC")}>
                Add PC slot after
              </MenuItem>
              <MenuItem bg="transparent" _hover={{bg: "whiteAlpha.100"}} onClick={() => insertSlot(index, "NPC")}>
                Add NPC slot after
              </MenuItem>
              <MenuDivider borderColor="whiteAlpha.200"/>
              <MenuItem
                bg="transparent"
                _hover={{bg: "whiteAlpha.100"}}
                color="red.300"
                closeOnSelect={armedRemove === index}
                isDisabled={isActive}
                onClick={() => {
                  if (armedRemove === index) {
                    removeSlot(index);
                    setArmedRemove(null);
                  } else {
                    setArmedRemove(index);
                  }
                }}
              >
                {isActive
                  ? "Current slot can't be removed"
                  : armedRemove === index ? "Click again to remove" : "Remove this slot"}
              </MenuItem>
            </MenuList>
          </Portal>
          </Menu>
        );
      })}
    </HStack>
  );
};

export default InitiativeOrder;
