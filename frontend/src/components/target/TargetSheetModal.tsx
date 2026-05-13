import React from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import useParticipantStore from '@/state/participantsStore';
import { useQuickActionsStore } from '@/state/quickActionsStore';
import StatSheetOld from '@components/StatSheetOld';

/**
 * Detailed view of the selected target, summoned on demand (`F` hotkey or
 * the "Full sheet" button on the mini stat card). Shows the same content
 * the Targeted column renders — skills, weapons, talents w/ tooltips, etc.
 * — but as a modal so the targets list doesn't have to share column space.
 */
const TargetSheetModal: React.FC = () => {
  const isOpen = useQuickActionsStore((s) => s.fullSheetOpen);
  const onClose = useQuickActionsStore((s) => s.closeFullSheet);
  const participants = useParticipantStore((s) => s.participants);
  const selectedId = useParticipantStore((s) => s.selectedParticipantId);
  const participant = participants.find((p) => p.id === selectedId) ?? null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      autoFocus={false}
    >
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent bg="#2A2C30" color="whiteAlpha.900" maxH="85vh">
        {/* Backdrop click + Esc close the modal — Chakra defaults. No header
            or close button: the stat sheet already shows the name. */}
        <ModalBody p={4}>
          {participant && <StatSheetOld participant={participant} />}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TargetSheetModal;
