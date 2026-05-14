import React, {useEffect, useRef, useState} from 'react';
import {Box, Text, Tooltip, VStack} from "@chakra-ui/react";
import useGameplayStore from "@/state/newGameplayStore";

const ROWS: Array<{key: string; label: string; tooltip: string}> = [
  {key: "incidental", label: "Incidental", tooltip: "Free action — talking, dropping an item, glancing. No limit."},
  {key: "maneuver1", label: "Maneuver", tooltip: "First maneuver this turn — free."},
  {key: "maneuver2", label: "Maneuver", tooltip: "Second maneuver costs 2 strain (or via talents/Advantages). Hard cap 2/turn."},
  {key: "action", label: "Action", tooltip: "One action per turn. Usually a skill check."},
];

const TurnActionsHint = () => {
  const activeParticipantId = useGameplayStore((s) => s.context.activeParticipantId);
  const round = useGameplayStore((s) => s.context.round);

  const [lastActive, setLastActive] = useState<string | null>(null);
  const lastActiveRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeParticipantId && activeParticipantId !== lastActiveRef.current) {
      lastActiveRef.current = activeParticipantId;
      setLastActive(activeParticipantId);
    }
  }, [activeParticipantId]);

  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDone({});
  }, [lastActive, round]);

  const displayedId = activeParticipantId ?? lastActive;
  const isSelecting = !activeParticipantId && !!lastActive;

  return (
    <Box w="86px" flexShrink={0} px={2}>
      {displayedId && (
        <VStack spacing="0" align="stretch">
          {ROWS.map((row) => {
            const isDone = !!done[row.key];
            return (
              <Tooltip
                key={row.key}
                hasArrow
                placement="right"
                openDelay={250}
                bg="#1f2125"
                color="gray.100"
                borderColor="whiteAlpha.200"
                borderWidth="1px"
                borderRadius="md"
                label={<Text fontSize="xs" px={1} py={0.5}>{row.tooltip}</Text>}
              >
                <Box
                  role="button"
                  cursor="pointer"
                  userSelect="none"
                  onClick={() => setDone((d) => ({...d, [row.key]: !d[row.key]}))}
                  fontSize="10px"
                  letterSpacing="0.06em"
                  color={isDone ? "whiteAlpha.500" : "whiteAlpha.600"}
                  textDecoration={isDone ? "line-through" : "none"}
                  _hover={{color: isDone ? "whiteAlpha.600" : "whiteAlpha.900"}}
                  transition="color 0.1s ease"
                  lineHeight="1.1"
                  opacity={isSelecting ? 0.7 : 1}
                >
                  {row.label}
                </Box>
              </Tooltip>
            );
          })}
        </VStack>
      )}
    </Box>
  );
};

export default TurnActionsHint;
