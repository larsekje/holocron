import React, { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';
import type { EncounterTag, EncounterTemplate, NpcRef } from '@/data/encounterTemplates';
import useUserContentStore, { newEncounterId } from '@/state/userContentStore';
import AdversaryPicker from './AdversaryPicker';

const ALL_TAGS: EncounterTag[] = [
  'combat',
  'social',
  'chase',
  'skill-challenge',
  'transit',
  'investigation',
];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text
    as="b"
    fontSize="10px"
    letterSpacing="0.16em"
    textTransform="uppercase"
    color="#d39939"
  >
    {children}
  </Text>
);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** When set, the modal edits this encounter; otherwise it creates a new one. */
  initial?: EncounterTemplate | null;
}

/**
 * Create / edit a GM-authored encounter. Saves into userContentStore, which
 * the Session Prep panel renders alongside the bundled samples. NPC rows can
 * be linked to a Spotlight adversary (so they're one-click addable to the live
 * encounter) or left freeform for narrative-only NPCs.
 */
const EncounterEditorModal: React.FC<Props> = ({ isOpen, onClose, initial }) => {
  const saveEncounter = useUserContentStore((s) => s.saveEncounter);

  const [title, setTitle] = useState('');
  const [blurb, setBlurb] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<EncounterTag[]>([]);
  const [npcs, setNpcs] = useState<NpcRef[]>([]);
  const [beats, setBeats] = useState<string[]>([]);

  // Re-seed local state each time the modal opens (new or editing an existing).
  useEffect(() => {
    if (!isOpen) return;
    setTitle(initial?.title ?? '');
    setBlurb(initial?.blurb ?? '');
    setDescription(initial?.description ?? '');
    setTags(initial?.tags ?? []);
    setNpcs((initial?.npcs ?? []).map((n) => (typeof n === 'string' ? { name: n } : { ...n })));
    setBeats(initial?.beats ?? []);
  }, [isOpen, initial]);

  const toggleTag = (t: EncounterTag) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const updateNpc = (i: number, patch: Partial<NpcRef>) =>
    setNpcs((cur) => cur.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));
  const removeNpc = (i: number) => setNpcs((cur) => cur.filter((_, idx) => idx !== i));

  const updateBeat = (i: number, v: string) =>
    setBeats((cur) => cur.map((b, idx) => (idx === i ? v : b)));
  const removeBeat = (i: number) => setBeats((cur) => cur.filter((_, idx) => idx !== i));

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const encounter: EncounterTemplate = {
      id: initial?.id ?? newEncounterId(),
      title: title.trim(),
      blurb: blurb.trim(),
      description: description.trim(),
      tags: tags.length ? tags : undefined,
      npcs: (() => {
        const cleaned = npcs.filter((n) => n.name.trim().length > 0);
        return cleaned.length ? cleaned : undefined;
      })(),
      beats: (() => {
        const cleaned = beats.filter((b) => b.trim().length > 0);
        return cleaned.length ? cleaned : undefined;
      })(),
    };
    saveEncounter(encounter);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" bg="rgba(0,0,0,0.6)" />
      <ModalContent bg="#16181c" color="gray.100" borderColor="#0a0b0d" borderWidth="1px">
        <Box h="3px" w="100%" bgGradient="linear(to-r, #7c3a2c, #d39939)" />
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
          {initial ? 'Edit encounter' : 'New encounter'}
        </ModalHeader>
        <ModalCloseButton color="whiteAlpha.700" _hover={{ color: 'white' }} />

        <ModalBody bg="#1d2025" py={4}>
          <VStack spacing={4} align="stretch">
            <Box>
              <SectionLabel>Title</SectionLabel>
              <Input
                mt={1}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Cantina shakedown"
                size="sm"
                bg="#16181c"
                borderColor="whiteAlpha.200"
                fontSize="sm"
              />
            </Box>

            <Box>
              <SectionLabel>One-line hook</SectionLabel>
              <Input
                mt={1}
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                placeholder="Shown on the collapsed card."
                size="sm"
                bg="#16181c"
                borderColor="whiteAlpha.200"
                fontSize="sm"
              />
            </Box>

            <Box>
              <SectionLabel>Description</SectionLabel>
              <Textarea
                mt={1}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Long-form body shown when the card is expanded."
                size="sm"
                minH="90px"
                bg="#16181c"
                borderColor="whiteAlpha.200"
                fontSize="sm"
                resize="vertical"
              />
            </Box>

            <Box>
              <SectionLabel>Tags</SectionLabel>
              <HStack mt={1} flexWrap="wrap" spacing={1.5}>
                {ALL_TAGS.map((t) => {
                  const on = tags.includes(t);
                  return (
                    <Badge
                      key={t}
                      as="button"
                      onClick={() => toggleTag(t)}
                      bg={on ? '#d39939' : 'whiteAlpha.150'}
                      color={on ? '#1a1d24' : 'whiteAlpha.700'}
                      fontSize="9px"
                      textTransform="uppercase"
                      letterSpacing="0.06em"
                      px={2}
                      py={0.5}
                      borderRadius="sm"
                      cursor="pointer"
                    >
                      {t}
                    </Badge>
                  );
                })}
              </HStack>
            </Box>

            <Box>
              <SectionLabel>NPCs</SectionLabel>
              <Box mt={1}>
                <AdversaryPicker
                  placeholder="Add from Spotlight — search adversaries…"
                  onPick={(pick) =>
                    setNpcs((cur) => [
                      ...cur,
                      { name: pick.name, descriptor: pick.subtitle, adversaryId: pick.id, count: 1 },
                    ])
                  }
                />
              </Box>
              <VStack mt={2} spacing={1.5} align="stretch">
                {npcs.map((npc, i) => (
                  <HStack key={i} spacing={1.5} align="center">
                    {npc.adversaryId ? (
                      <Badge bg="rgba(127,202,161,0.18)" color="#7fcaa1" fontSize="9px" px={1.5} py={0.5} borderRadius="sm">
                        Linked
                      </Badge>
                    ) : (
                      <Badge bg="whiteAlpha.150" color="whiteAlpha.600" fontSize="9px" px={1.5} py={0.5} borderRadius="sm">
                        Free
                      </Badge>
                    )}
                    <Input
                      value={npc.name}
                      onChange={(e) => updateNpc(i, { name: e.target.value })}
                      placeholder="NPC name"
                      size="xs"
                      bg="#16181c"
                      borderColor="whiteAlpha.200"
                      flex="1"
                    />
                    <Input
                      value={npc.descriptor ?? ''}
                      onChange={(e) => updateNpc(i, { descriptor: e.target.value })}
                      placeholder="descriptor"
                      size="xs"
                      bg="#16181c"
                      borderColor="whiteAlpha.200"
                      flex="1"
                    />
                    <NumberInput
                      size="xs"
                      min={1}
                      max={20}
                      value={npc.count ?? 1}
                      onChange={(_, v) => updateNpc(i, { count: Number.isNaN(v) ? 1 : v })}
                      w="56px"
                    >
                      <NumberInputField bg="#16181c" borderColor="whiteAlpha.200" px={2} />
                    </NumberInput>
                    <IconButton
                      aria-label="Remove NPC"
                      icon={<CloseIcon boxSize="8px" />}
                      size="xs"
                      variant="ghost"
                      color="whiteAlpha.500"
                      _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
                      onClick={() => removeNpc(i)}
                    />
                  </HStack>
                ))}
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="whiteAlpha.200"
                  color="whiteAlpha.700"
                  leftIcon={<AddIcon boxSize="8px" />}
                  alignSelf="flex-start"
                  onClick={() => setNpcs((cur) => [...cur, { name: '' }])}
                >
                  Freeform NPC
                </Button>
              </VStack>
            </Box>

            <Box>
              <SectionLabel>Beats</SectionLabel>
              <VStack mt={1} spacing={1.5} align="stretch">
                {beats.map((b, i) => (
                  <HStack key={i} spacing={1.5} align="center">
                    <Text color="whiteAlpha.500" fontSize="2xs" minW="14px">
                      {i + 1}.
                    </Text>
                    <Input
                      value={b}
                      onChange={(e) => updateBeat(i, e.target.value)}
                      placeholder="What happens in this beat…"
                      size="xs"
                      bg="#16181c"
                      borderColor="whiteAlpha.200"
                      flex="1"
                    />
                    <IconButton
                      aria-label="Remove beat"
                      icon={<CloseIcon boxSize="8px" />}
                      size="xs"
                      variant="ghost"
                      color="whiteAlpha.500"
                      _hover={{ bg: 'rgba(176,48,48,0.18)', color: '#e08080' }}
                      onClick={() => removeBeat(i)}
                    />
                  </HStack>
                ))}
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="whiteAlpha.200"
                  color="whiteAlpha.700"
                  leftIcon={<AddIcon boxSize="8px" />}
                  alignSelf="flex-start"
                  onClick={() => setBeats((cur) => [...cur, ''])}
                >
                  Add beat
                </Button>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter bg="#0f1114" borderTopWidth="1px" borderColor="#0a0b0d" py={2}>
          <Button size="xs" variant="ghost" color="whiteAlpha.700" _hover={{ bg: 'whiteAlpha.100', color: 'white' }} onClick={onClose}>
            Cancel
          </Button>
          <Flex flex="1" />
          <Button
            size="xs"
            bg="#d39939"
            color="#1a1d24"
            fontWeight="bold"
            letterSpacing="0.04em"
            _hover={{ bg: 'yellow.400' }}
            isDisabled={!canSave}
            onClick={handleSave}
          >
            {initial ? 'Save changes' : 'Save to my encounters'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EncounterEditorModal;
