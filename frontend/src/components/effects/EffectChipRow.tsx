import React from "react";
import { Box, HStack, IconButton, Text, Tooltip } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useEffectStore } from "@/state/effectStore";
import { EffectDuration } from "@/types/effectTypes";

interface Props {
  participantId: string;
}

function formatDuration(d: EffectDuration): string {
  if (d === undefined) return "∞";
  if (d === "encounter") return "enc";
  return `${d}r`;
}

function durationLabel(d: EffectDuration): string {
  if (d === undefined) return "Until healed";
  if (d === "encounter") return "Until end of encounter";
  return `${d} round${d === 1 ? "" : "s"} remaining`;
}

const EffectChipRow: React.FC<Props> = ({ participantId }) => {
  const allEffects = useEffectStore((s) => s.effects);
  const removeEffect = useEffectStore((s) => s.removeEffect);

  const mine = allEffects.filter(
    (e) => e.target?.type === "character" && e.target.participantId === participantId,
  );

  if (mine.length === 0) return null;

  return (
    <HStack spacing={1} wrap="wrap" mt={1}>
      {mine.map((ae) => (
        <Tooltip
          key={ae.id}
          hasArrow
          placement="top"
          openDelay={200}
          bg="#1f2125"
          color="gray.100"
          borderColor="whiteAlpha.200"
          borderWidth="1px"
          borderRadius="md"
          label={
            <Box fontSize="xs" maxW="320px">
              <Text fontWeight="bold" mb={1}>
                {ae.effect.name}
              </Text>
              {ae.effect.description && <Text>{ae.effect.description}</Text>}
              <Text color="whiteAlpha.600" mt={1}>
                {durationLabel(ae.remainingDuration)}
              </Text>
            </Box>
          }
        >
          <HStack
            spacing={1}
            px={1.5}
            py="2px"
            bg="#5a2f8a"
            color="white"
            fontSize="10px"
            fontWeight="bold"
            letterSpacing="0.06em"
            textTransform="uppercase"
            borderRadius="sm"
            cursor="help"
          >
            <Text as="span">{ae.effect.name}</Text>
            <Text as="span" color="whiteAlpha.700" fontWeight="normal">
              {formatDuration(ae.remainingDuration)}
            </Text>
            <IconButton
              aria-label={`Remove ${ae.effect.name}`}
              icon={<CloseIcon boxSize="6px" />}
              size="xs"
              minW="14px"
              h="14px"
              variant="ghost"
              color="whiteAlpha.700"
              _hover={{ bg: "whiteAlpha.300", color: "white" }}
              onClick={(e) => {
                e.stopPropagation();
                removeEffect(ae.id);
              }}
            />
          </HStack>
        </Tooltip>
      ))}
    </HStack>
  );
};

export default EffectChipRow;
