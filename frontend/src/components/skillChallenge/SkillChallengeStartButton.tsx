import React from 'react';
import { Button, Tooltip, useDisclosure } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import useSkillChallengeStore from '@/state/skillChallengeStore';
import { StartChallengeModal } from './StartChallengeModal';

/**
 * Start-a-skill-challenge button — sized for the toolbar, intended to sit
 * next to the "Roll Initiative" button in the non-structured ToolBar. Owns
 * its own start-config modal.
 */
const SkillChallengeStartButton: React.FC = () => {
  const start = useSkillChallengeStore((s) => s.start);
  const startModal = useDisclosure();

  return (
    <>
      <Tooltip
        hasArrow
        openDelay={300}
        label="Start a skill challenge — track successes vs failures across multiple rolls (chase, slicing, marathon negotiation)."
        bg="#1f2125"
        color="gray.100"
      >
        <Button
          size="sm"
          variant="outline"
          bg="transparent"
          color="whiteAlpha.700"
          fontWeight="medium"
          borderColor="whiteAlpha.300"
          borderRadius="md"
          leftIcon={<CheckIcon boxSize={3} />}
          transition="all 0.15s ease"
          _hover={{ bg: "whiteAlpha.100", color: "white", borderColor: "whiteAlpha.400" }}
          _active={{ bg: "whiteAlpha.50" }}
          onClick={startModal.onOpen}
        >
          Skill Challenge
        </Button>
      </Tooltip>
      <StartChallengeModal
        isOpen={startModal.isOpen}
        onClose={startModal.onClose}
        onStart={(cfg) => {
          start(cfg);
          startModal.onClose();
        }}
      />
    </>
  );
};

export default SkillChallengeStartButton;
