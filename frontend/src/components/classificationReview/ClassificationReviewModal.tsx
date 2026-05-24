import React from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useClassificationReviewStore } from '@/state/classificationReviewStore';
import { getAllAdversaries } from '@/data/spotlightIndex';
import ClassificationReviewFilters, {
  DEFAULT_FILTERS,
  type GroupBy,
  type ReviewFilters,
} from './ClassificationReviewFilters';
import ClassificationReviewList from './ClassificationReviewList';
import ClassificationReviewDetail from './ClassificationReviewDetail';
import { exportFlags, parseFlagImport } from './exportClassificationFlags';
import { pickTextFile } from '@/utils/exportJson';

// Orchestrator for the Classification Review tool. Owns local UI state
// (filters, grouping, selection); reads the flag data from the persisted
// store. Adversaries come from the Spotlight index (built once at app start).

const cardBg = '#26292d';
const headerBg = '#1f2226';
const borderCol = 'gray.700';

const ClassificationReviewModal: React.FC = () => {
  const isOpen = useClassificationReviewStore((s) => s.isOpen);
  const close = useClassificationReviewStore((s) => s.close);
  const flags = useClassificationReviewStore((s) => s.flags);
  const setFlag = useClassificationReviewStore((s) => s.setFlag);
  const clearFlag = useClassificationReviewStore((s) => s.clearFlag);
  const clearAllFlags = useClassificationReviewStore((s) => s.clearAllFlags);
  const importFlags = useClassificationReviewStore((s) => s.importFlags);
  const toast = useToast();

  const adversaries = React.useMemo(() => getAllAdversaries(), []);

  const [filters, setFilters] = React.useState<ReviewFilters>(DEFAULT_FILTERS);
  const [groupBy, setGroupBy] = React.useState<GroupBy>('none');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const options = React.useMemo(() => {
    const core = new Set<string>();
    const fac = new Set<string>();
    const role = new Set<string>();
    for (const a of adversaries) {
      const d = a as any;
      if (d.coreArchetype) core.add(String(d.coreArchetype));
      for (const f of d.factions ?? []) if (f) fac.add(String(f));
      if (d.archetype) role.add(String(d.archetype));
    }
    return {
      coreArchetypes: [...core].sort(),
      factions: [...fac].sort(),
      roles: [...role].sort(),
    };
  }, [adversaries]);

  const filtered = React.useMemo(() => {
    const text = filters.text.trim().toLowerCase();
    return adversaries.filter((a) => {
      const d = a as any;
      if (text && !a.name.toLowerCase().includes(text)) return false;
      if (filters.hideNamed && d.named) return false;
      if (filters.hideAdventure && d.fromAdventure) return false;
      if (filters.coreArchetype && d.coreArchetype !== filters.coreArchetype) return false;
      if (filters.faction && !(d.factions ?? []).includes(filters.faction)) return false;
      if (filters.role && d.archetype !== filters.role) return false;
      if (filters.flaggedOnly && !flags[a.id]) return false;
      if (filters.noRationale && d.classificationReason) return false;
      return true;
    });
  }, [adversaries, filters, flags]);

  // Keep the selection valid as filters change.
  React.useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((prev) => (prev && filtered.some((a) => a.id === prev) ? prev : filtered[0].id));
  }, [filtered]);

  const selected = React.useMemo(
    () => filtered.find((a) => a.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  const flagCount = Object.keys(flags).length;

  const handleExport = () => {
    if (flagCount === 0) return;
    exportFlags(flags, adversaries);
  };

  const handleImport = async () => {
    try {
      const text = await pickTextFile();
      const imported = parseFlagImport(text);
      const n = Object.keys(imported).length;
      importFlags(imported);
      toast({
        title: `Imported ${n} flag${n === 1 ? '' : 's'}`,
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (e: any) {
      if (e?.message === 'No file selected') return;
      toast({
        title: 'Import failed',
        description: String(e?.message ?? e),
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleClearAll = () => {
    if (flagCount === 0) return;
    if (window.confirm(`Remove all ${flagCount} classification flags? This can't be undone.`)) {
      clearAllFlags();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} size="6xl" isCentered>
      <ModalOverlay backdropFilter="blur(6px)" bg="rgba(0,0,0,0.6)" />
      <ModalContent
        bg={cardBg}
        overflow="hidden"
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderCol}
        boxShadow="xl"
      >
        <ModalBody p={0}>
          <VStack align="stretch" spacing={0}>
            {/* Header */}
            <HStack px={4} height="44px" justify="space-between" bg={headerBg} borderBottom="1px solid" borderColor={borderCol}>
              <HStack spacing={2}>
                <Text fontSize="sm" fontWeight="bold" color="gray.100" letterSpacing="0.02em">
                  Classification Review
                </Text>
                <Text fontSize="xs" color="gray.500">
                  · {filtered.length} / {adversaries.length}
                </Text>
              </HStack>
              <ModalCloseButton position="static" />
            </HStack>

            <ClassificationReviewFilters
              filters={filters}
              onChange={setFilters}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
              options={options}
            />

            <Flex h="68vh">
              <Box w="42%" overflowY="auto" borderRight="1px solid" borderColor={borderCol}>
                <ClassificationReviewList
                  items={filtered}
                  groupBy={groupBy}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  flags={flags}
                />
              </Box>
              <Box w="58%" overflowY="auto">
                <ClassificationReviewDetail
                  adversary={selected}
                  flag={selected ? flags[selected.id] : undefined}
                  onSetFlag={setFlag}
                  onClearFlag={clearFlag}
                />
              </Box>
            </Flex>

            {/* Footer */}
            <HStack
              px={4}
              py={2}
              bg={headerBg}
              borderTop="1px solid"
              borderColor={borderCol}
              justify="space-between"
            >
              <Text fontSize="xs" color="gray.400">
                {flagCount} flagged
              </Text>
              <HStack spacing={2}>
                <Button
                  size="xs"
                  variant="outline"
                  color="gray.200"
                  borderColor="gray.600"
                  _hover={{ bg: 'whiteAlpha.100' }}
                  onClick={handleImport}
                >
                  Import
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  color="gray.200"
                  borderColor="gray.600"
                  _hover={{ bg: 'whiteAlpha.100' }}
                  onClick={handleExport}
                  isDisabled={flagCount === 0}
                >
                  Export
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  onClick={handleClearAll}
                  isDisabled={flagCount === 0}
                >
                  Clear all
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ClassificationReviewModal;
