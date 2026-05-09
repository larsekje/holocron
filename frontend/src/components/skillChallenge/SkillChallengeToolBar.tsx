import React from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, ArrowForwardIcon, MinusIcon } from '@chakra-ui/icons';
import useSkillChallengeStore from '@/state/skillChallengeStore';

const Divider: React.FC = () => (
  <Box w="1px" h="24px" bg="whiteAlpha.200" />
);

interface TallyProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

const Tally: React.FC<TallyProps> = ({ label, value, total, color }) => (
  <VStack spacing={0} align="start" lineHeight="1">
    <Text
      fontSize="9px"
      color="whiteAlpha.500"
      textTransform="uppercase"
      letterSpacing="0.1em"
    >
      {label}
    </Text>
    <Text fontSize="md" color={color} fontWeight="bold">
      {value}
      <Text as="span" color="whiteAlpha.500" fontSize="sm" fontWeight="normal">
        {' / '}
        {total}
      </Text>
    </Text>
  </VStack>
);

/**
 * Toolbar variant of the skill challenge controls. Replaces the encounter
 * toolbar entirely while a challenge is active — the two are mutually
 * exclusive in play. Single-row layout, left to right: End / Undo / name |
 * tally cluster + buttons. Avoids fixed centring since the toolbar is
 * already narrower than the viewport and the centre would overlap the right
 * edge.
 */
const SkillChallengeToolBar: React.FC = () => {
  const active = useSkillChallengeStore((s) => s.active);
  const addSuccess = useSkillChallengeStore((s) => s.addSuccess);
  const addFailure = useSkillChallengeStore((s) => s.addFailure);
  const nextTurn = useSkillChallengeStore((s) => s.nextTurn);
  const undoLast = useSkillChallengeStore((s) => s.undoLast);
  const end = useSkillChallengeStore((s) => s.end);

  if (!active) return null;

  const isWon = active.status === 'won';
  const isLost = active.status === 'lost';
  const isResolved = isWon || isLost;

  return (
    <Flex align="center" h="100%" w="100%" px={4} gap={3}>
      {/* End / Undo */}
      <Button
        size="sm"
        bg="#3a1c1c"
        color="#ffd2d2"
        borderWidth="1px"
        borderColor="#7a3535"
        _hover={{ bg: '#5a2a2a', color: 'white' }}
        onClick={end}
        flexShrink={0}
      >
        {isResolved ? 'Clear' : 'End Challenge'}
      </Button>
      <Tooltip
        hasArrow
        openDelay={300}
        label={
          active.history.length === 0
            ? 'Nothing to undo'
            : isResolved
              ? 'Undo last (will reopen the challenge)'
              : 'Undo last'
        }
      >
        <Button
          size="sm"
          variant="ghost"
          color="whiteAlpha.700"
          onClick={undoLast}
          isDisabled={active.history.length === 0}
          _hover={{ bg: 'whiteAlpha.100' }}
          flexShrink={0}
        >
          Undo
        </Button>
      </Tooltip>

      <Divider />

      {/* Name */}
      <VStack spacing={0} align="start" lineHeight="1" flexShrink={1} minW={0}>
        <Text
          fontSize="9px"
          color="whiteAlpha.500"
          textTransform="uppercase"
          letterSpacing="0.1em"
        >
          Skill Challenge
        </Text>
        <Text
          fontSize="sm"
          color="whiteAlpha.900"
          fontWeight="bold"
          noOfLines={1}
          maxW="240px"
        >
          {active.name}
        </Text>
      </VStack>

      {/* Spacer pushes the tally + actions cluster to the right edge */}
      <Box flex="1" />

      {/* Tally + actions */}
      <HStack spacing={3} flexShrink={0}>
        <Tally
          label="Successes"
          value={active.successes}
          total={active.targetSuccesses}
          color="#85e0a3"
        />
        <Tally
          label="Failures"
          value={active.failures}
          total={active.allowedFailures}
          color="#e08585"
        />
        {active.turnLimit != null && (
          <Tally
            label="Turn"
            value={active.currentTurn}
            total={active.turnLimit}
            color="#d3b366"
          />
        )}

        <Divider />

        {/* Action area — fixed width so resolved Won/Lost text doesn't shift
          * the rest of the toolbar. Width depends on whether the challenge
          * has a turn limit (extra Next Turn button widens the active
          * cluster). Set at start, never changes mid-play. */}
        <HStack
          spacing={1}
          justify="center"
          flexShrink={0}
          minW={active.turnLimit != null ? '200px' : '80px'}
        >
          {!isResolved ? (
            <>
              <Tooltip hasArrow openDelay={300} label="+1 Success">
                <IconButton
                  aria-label="Add success"
                  size="sm"
                  bg="#1d3527"
                  color="#85e0a3"
                  borderWidth="1px"
                  borderColor="#3a7e57"
                  icon={<AddIcon boxSize={3} />}
                  onClick={() => addSuccess()}
                  _hover={{ bg: '#274a37', color: 'white' }}
                />
              </Tooltip>
              <Tooltip hasArrow openDelay={300} label="+1 Failure">
                <IconButton
                  aria-label="Add failure"
                  size="sm"
                  bg="#3a1f1f"
                  color="#e08585"
                  borderWidth="1px"
                  borderColor="#7a3535"
                  icon={<MinusIcon boxSize={3} />}
                  onClick={() => addFailure()}
                  _hover={{ bg: '#4f2a2a', color: 'white' }}
                />
              </Tooltip>
              {active.turnLimit != null && (
                <Tooltip hasArrow openDelay={300} label="Advance to next turn">
                  <Button
                    size="sm"
                    bg="#d39939"
                    color="#1a1d24"
                    fontWeight="bold"
                    letterSpacing="0.04em"
                    rightIcon={<ArrowForwardIcon boxSize={3} />}
                    onClick={() => nextTurn()}
                    _hover={{ bg: 'yellow.400' }}
                  >
                    Next Turn
                  </Button>
                </Tooltip>
              )}
            </>
          ) : (
            <Text
              fontSize="sm"
              fontWeight="bold"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color={isWon ? '#85e0a3' : '#e08585'}
            >
              {isWon ? 'Challenge Won' : 'Challenge Lost'}
            </Text>
          )}
        </HStack>
      </HStack>
    </Flex>
  );
};

export default SkillChallengeToolBar;
