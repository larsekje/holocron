import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
} from '@chakra-ui/react';
import { Participant } from '@/state/participantsStore';
import StatSheet from './StatSheet';

interface StatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: Participant | null;
}

/**
 * Modal component to display a character's stat sheet
 */
const StatSheetModal: React.FC<StatSheetModalProps> = ({ isOpen, onClose, participant }) => {
  if (!participant) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{participant.name} - Character Sheet</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <StatSheet participant={participant} />
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default StatSheetModal;
