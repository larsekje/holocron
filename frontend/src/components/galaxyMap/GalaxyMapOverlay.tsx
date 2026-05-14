import React from 'react';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import { useGalaxyMapStore } from '@/state/galaxyMapStore';
import GalaxyMap from './GalaxyMap';

/**
 * Full-screen overlay host for the interactive galaxy map.
 *
 * `isLazy` so Leaflet only mounts — and measures its container — once the
 * panel is actually open. `motionPreset="none"` so the content is full-size
 * synchronously on open rather than mid-transition; otherwise Leaflet can
 * measure a 0×0 box and render blank.
 */
const GalaxyMapOverlay: React.FC = () => {
  const visible = useGalaxyMapStore((s) => s.visible);
  const close = useGalaxyMapStore((s) => s.close);

  return (
    <Modal isOpen={visible} onClose={close} size="full" isLazy motionPreset="none">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent
        bg="#05070d"
        m={0}
        h="100vh"
        display="flex"
        flexDirection="column"
      >
        <ModalCloseButton
          color="whiteAlpha.800"
          bg="#1f2530"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          zIndex={1001}
          _hover={{ bg: 'whiteAlpha.300' }}
        />
        <ModalBody p={0} flex="1" minH={0}>
          <GalaxyMap />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GalaxyMapOverlay;
