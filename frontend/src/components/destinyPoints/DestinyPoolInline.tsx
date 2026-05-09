import React, {useState} from 'react';
import {Box, HStack, IconButton, Text, Tooltip, useDisclosure} from "@chakra-ui/react";
import {EditIcon} from "@chakra-ui/icons";
import {useDestinyStore} from "@/state/destinyPoolStore";
import useParticipantStore from "@/state/participantsStore";
import DestinyEditorModal from "@components/destinyPoints/DestinyPoolEditorModal";

// Inline destiny pool — just the pips + an edit pencil. Click any pip to flip its colour.
const DestinyPoolInline: React.FC = () => {
  const {destinyPool, flipDestinyPoint, setDestinyPool} = useDestinyStore();
  const pcs = useParticipantStore((s) => s.participants.filter((p) => p.isPC));
  const {isOpen, onOpen, onClose} = useDisclosure();

  const [pcContributions, setPcContributions] = useState<Record<string, {light: number; dark: number}>>({});
  const [selectedContributions, setSelectedContributions] = useState<Record<string, string>>({});

  const updateContribution = (pcId: string, type: "light" | "dark", value: number) => {
    setPcContributions((prev) => ({
      ...prev,
      [pcId]: {light: type === "light" ? value : 0, dark: type === "dark" ? value : 0},
    }));
  };

  const handleSelection = (pcId: string, value: string) => {
    setSelectedContributions((prev) => ({...prev, [pcId]: value}));
    const type = value.slice(0, -1) as "light" | "dark";
    const v = parseInt(value.slice(-1), 10);
    updateContribution(pcId, type, v);
  };

  const finalize = () => {
    let light = 0, dark = 0;
    Object.values(pcContributions).forEach(({light: l, dark: d}) => {light += l; dark += d;});
    setDestinyPool(light, dark);
    onClose();
  };

  return (
    <>
      <HStack spacing={3} align="center">
        <HStack spacing="3px">
          {destinyPool.length === 0 && (
            <Text fontSize="xs" color="whiteAlpha.500" letterSpacing="0.06em">
              empty
            </Text>
          )}
          {destinyPool.map((isLight, i) => (
            <Tooltip
              key={i}
              hasArrow
              openDelay={300}
              label={`${isLight ? "Light" : "Dark"} side — click to flip`}
              bg="#1f2125"
              color="gray.100"
              borderColor="whiteAlpha.200"
              borderWidth="1px"
            >
              <Box
                as="button"
                type="button"
                onClick={() => flipDestinyPoint(i)}
                w="14px"
                h="14px"
                borderRadius="full"
                bg={isLight ? "#f0f4ff" : "#a32d2d"}
                borderWidth="1px"
                borderColor={isLight ? "#9ab0d8" : "#5a1818"}
                boxShadow={
                  isLight
                    ? "0 0 4px rgba(180, 200, 255, 0.45), inset 0 -2px 0 rgba(0,0,0,0.10)"
                    : "0 0 4px rgba(220, 70, 70, 0.45), inset 0 -2px 0 rgba(0,0,0,0.30)"
                }
                cursor="pointer"
                _hover={{transform: "scale(1.15)"}}
                transition="transform 0.1s ease"
              />
            </Tooltip>
          ))}
        </HStack>

        <IconButton
          icon={<EditIcon/>}
          aria-label="Edit destiny pool"
          size="xs"
          variant="ghost"
          color="whiteAlpha.700"
          _hover={{bg: "whiteAlpha.100", color: "white"}}
          onClick={onOpen}
        />
      </HStack>

      <DestinyEditorModal
        isOpen={isOpen}
        onClose={onClose}
        pcs={pcs}
        selectedContributions={selectedContributions}
        handleSelection={handleSelection}
        onReset={() => {
          setPcContributions({});
          setSelectedContributions({});
        }}
        onConfirm={finalize}
      />
    </>
  );
};

export default DestinyPoolInline;
