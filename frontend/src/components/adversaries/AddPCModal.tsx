import React, {useState} from 'react';
import {nanoid} from 'nanoid';
import {
  Box,
  Button,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import useParticipantStore, {Participant} from '@/state/participantsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CHARS = ["brawn", "agility", "intellect", "cunning", "willpower", "presence"] as const;

const AddPCModal: React.FC<Props> = ({isOpen, onClose}) => {
  const addParticipant = useParticipantStore((s) => s.addParticipant);

  const [name, setName] = useState("");
  const [chars, setChars] = useState<Record<string, number>>({
    brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2,
  });
  const [woundThreshold, setWoundThreshold] = useState(12);
  const [strainThreshold, setStrainThreshold] = useState(14);
  const [soak, setSoak] = useState(3);

  const reset = () => {
    setName("");
    setChars({brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2});
    setWoundThreshold(12);
    setStrainThreshold(14);
    setSoak(3);
  };

  const submit = () => {
    if (!name.trim()) return;
    const participant: Participant = {
      id: nanoid(),
      name: name.trim(),
      isPC: true,
      stats: {
        type: "PC",
        woundThreshold,
        strainThreshold,
        wounds: 0,
        strain: 0,
        soak,
        meleeDefense: 0,
        rangedDefense: 0,
        ...chars,
        skills: {},
        talents: [],
        weapons: [],
        gear: [],
      },
    };
    addParticipant(participant);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay backdropFilter="blur(4px)" bg="rgba(0,0,0,0.6)"/>
      <ModalContent
        bg="#16181c"
        color="gray.100"
        borderColor="#0a0b0d"
        borderWidth="1px"
        overflow="hidden"
      >
        <Box h="3px" w="100%" bgGradient="linear(to-r, #7c3a2c, #d39939)"/>
        <ModalHeader
          bg="#0f1114"
          borderBottomWidth="1px"
          borderColor="#0a0b0d"
          fontSize="xs"
          letterSpacing="0.16em"
          textTransform="uppercase"
          color="#d39939"
          py={2}
        >
          Add Player Character
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.700" _hover={{color: "white"}}/>

        <ModalBody bg="#1d2025" pb={4} pt={4}>
          <VStack spacing={3} align="stretch">
            <Box>
              <Text fontSize="9px" letterSpacing="0.14em" textTransform="uppercase" color="#d39939" mb={1}>
                Name
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Character name"
                size="sm"
                bg="#26292f"
                borderColor="whiteAlpha.300"
                _focus={{borderColor: "#d39939"}}
                autoFocus
              />
            </Box>

            <Box>
              <Text fontSize="9px" letterSpacing="0.14em" textTransform="uppercase" color="#d39939" mb={1}>
                Characteristics
              </Text>
              <HStack spacing={2} justify="space-between">
                {CHARS.map((c) => (
                  <VStack key={c} spacing={1} flex="1" minW={0}>
                    <Input
                      type="number"
                      value={chars[c]}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (!Number.isNaN(n)) setChars((prev) => ({...prev, [c]: Math.max(1, Math.min(6, n))}));
                      }}
                      size="sm"
                      bg="#26292f"
                      borderColor="whiteAlpha.300"
                      _focus={{borderColor: "#d39939"}}
                      textAlign="center"
                      fontWeight="bold"
                      px={1}
                    />
                    <Text fontSize="9px" letterSpacing="0.10em" textTransform="uppercase" color="whiteAlpha.600">
                      {c.slice(0, 3)}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            </Box>

            <HStack spacing={3}>
              <DerivedInput label="W. Threshold" value={woundThreshold} onChange={setWoundThreshold}/>
              <DerivedInput label="S. Threshold" value={strainThreshold} onChange={setStrainThreshold}/>
              <DerivedInput label="Soak" value={soak} onChange={setSoak}/>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter bg="#0f1114" borderTopWidth="1px" borderColor="#0a0b0d" py={2}>
          <Button
            size="xs"
            variant="ghost"
            color="whiteAlpha.700"
            _hover={{bg: "whiteAlpha.100", color: "white"}}
            onClick={() => {reset(); onClose();}}
          >
            Cancel
          </Button>
          <Button
            size="xs"
            ml={2}
            bg="#d39939"
            color="#1a1d24"
            fontWeight="bold"
            letterSpacing="0.04em"
            _hover={{bg: "yellow.400"}}
            onClick={submit}
            isDisabled={!name.trim()}
          >
            Add
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const DerivedInput: React.FC<{label: string; value: number; onChange: (v: number) => void}> = ({label, value, onChange}) => (
  <VStack spacing={1} flex="1">
    <Input
      type="number"
      value={value}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        if (!Number.isNaN(n)) onChange(Math.max(0, n));
      }}
      size="sm"
      bg="#26292f"
      borderColor="whiteAlpha.300"
      _focus={{borderColor: "#d39939"}}
      textAlign="center"
      fontWeight="bold"
    />
    <Text fontSize="9px" letterSpacing="0.10em" textTransform="uppercase" color="whiteAlpha.600">
      {label}
    </Text>
  </VStack>
);

export default AddPCModal;
