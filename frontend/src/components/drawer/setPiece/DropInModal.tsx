import React, { useMemo } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { SetPiece } from "@/setPiece";
import { useSetPieceStore } from "@/setPieceStore";
import { useTargetStore } from "@/targetStore";
import { Target } from "@/target";
import { useFetchCharacters } from "@/useFetchCharacters";
import { Character } from "@/character";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  piece: SetPiece | null;
}

interface ResolvedRow {
  ref: string;
  count: number;
  character: Character | null;
}

const DropInModal = ({ isOpen, onClose, piece }: Props) => {
  const characters = useFetchCharacters();
  const setTargets = useTargetStore(state => state.setTargets);
  const addTarget = useTargetStore(state => state.addTarget);
  const targets = useTargetStore(state => state.targets);
  const setActive = useSetPieceStore(state => state.setActive);
  const toast = useToast();

  const resolved: ResolvedRow[] = useMemo(() => {
    if (!piece) return [];
    return piece.quick_add.map(entry => {
      const char = characters.find(c => c.name.toLowerCase() === entry.ref.toLowerCase()) || null;
      return { ref: entry.ref, count: entry.count, character: char };
    });
  }, [piece, characters]);

  const knownRows = resolved.filter(r => r.character);
  const unknownRows = resolved.filter(r => !r.character);

  if (!piece) return null;

  const buildNewTargets = (): Target[] => {
    const newTargets: Target[] = [];
    for (const row of knownRows) {
      for (let i = 0; i < row.count; i++) {
        newTargets.push(new Target(row.character!));
      }
    }
    return newTargets;
  };

  const handleReplace = () => {
    const newTargets = buildNewTargets();
    setTargets(newTargets);
    setActive(piece);
    toast({ status: "success", title: `${piece.name} loaded`, description: `${newTargets.length} adversaries dropped in; initiative re-rolled.` });
    onClose();
  };

  const handleAppend = () => {
    const newTargets = buildNewTargets();
    for (const target of newTargets) addTarget(target);
    setActive(piece);
    toast({
      status: "info",
      title: `${piece.name} loaded`,
      description: `${newTargets.length} adversaries added. Initiative NOT re-rolled — click Roll Initiative if you want to redeal.`,
    });
    onClose();
  };

  const handleJustScene = () => {
    setActive(piece);
    toast({ status: "success", title: `${piece.name} scene loaded`, description: "No adversaries changed." });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay/>
      <ModalContent>
        <ModalHeader>Drop in: {piece.name}</ModalHeader>
        <ModalCloseButton/>
        <ModalBody>
          <Stack spacing={3}>
            <Text fontSize="sm" color="gray.600">
              {targets.length > 0
                ? `There are ${targets.length} adversaries in the current fight.`
                : "No current combat."}
            </Text>

            {resolved.length > 0 && (
              <Box>
                <Text fontWeight="semibold" marginBottom={2}>Quick-add roster</Text>
                <Stack spacing={1}>
                  {knownRows.map((row, i) => (
                    <HStack key={`k${i}`} fontSize="sm">
                      <Badge colorScheme="green">OK</Badge>
                      <Text>{row.count} × {row.ref}</Text>
                    </HStack>
                  ))}
                  {unknownRows.map((row, i) => (
                    <HStack key={`u${i}`} fontSize="sm" color="red.600">
                      <Badge colorScheme="red">unknown</Badge>
                      <Text>{row.count} × {row.ref} (not in library — skipped)</Text>
                    </HStack>
                  ))}
                </Stack>
              </Box>
            )}

            {unknownRows.length > 0 && (
              <Alert status="warning" fontSize="sm">
                <AlertIcon/>
                Some adversaries aren't in the current library. They'll be skipped on Replace/Append.
              </Alert>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <HStack width="100%" justifyContent="flex-end" flexWrap="wrap" spacing={2}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="outline" onClick={handleJustScene}>Just load the scene</Button>
            <Button colorScheme="blue" onClick={handleAppend} isDisabled={knownRows.length === 0}>
              Append to combat
            </Button>
            <Button colorScheme="red" onClick={handleReplace} isDisabled={knownRows.length === 0}>
              Replace combat
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DropInModal;
