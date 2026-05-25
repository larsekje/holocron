import React, { useState } from 'react';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { GiBookmarklet } from 'react-icons/gi';
import { FiUsers } from 'react-icons/fi';
import ContentCardOld from '@/ContentCardOld';
import ActiveSceneCard from './ActiveSceneCard';
import OngoingEffectsCard from './OngoingEffectsCard';
import RosterEditor from './RosterEditor';
import EncounterCardInline from './EncounterCardInline';
import EncounterTemplateCard from './EncounterTemplateCard';
import PrepSection from './PrepSection';
import { ENCOUNTER_TEMPLATES } from '@/data/encounterTemplates';
import useUserContentStore, { newEncounterId, newRosterGroupId } from '@/state/userContentStore';
import usePrepUiStore from '@/state/prepUiStore';

/**
 * SessionPrepPanel — the GM's prep binder (right column).
 *
 * The live "Ongoing effects" readout is pinned at the top (glanceable play
 * status). Below it sit the foldable prep sections — active scene, tonight's
 * roster, the GM's own (inline-editable) encounters, and the bundled samples —
 * each collapsible via PrepSection so the GM can hide what they're not using.
 * Roster and "My encounters" are author-your-own, persisted via
 * userContentStore; samples are the bundled Gundark Gambit seed (collapsed by
 * default) kept as starting points.
 */
const SessionPrepPanel: React.FC = () => {
  const userEncounters = useUserContentStore((s) => s.userEncounters);
  const roster = useUserContentStore((s) => s.roster);
  const saveEncounter = useUserContentStore((s) => s.saveEncounter);
  const setSection = usePrepUiStore((s) => s.setSection);
  const setRosterAddOpen = usePrepUiStore((s) => s.setRosterAddOpen);
  const setRosterFocusGroupId = usePrepUiStore((s) => s.setRosterFocusGroupId);
  const addRosterGroup = useUserContentStore((s) => s.addRosterGroup);
  const [newId, setNewId] = useState<string | null>(null);

  const handleNew = () => {
    const id = newEncounterId();
    saveEncounter({ id, title: '' });
    setNewId(id);
    setSection('encounters', true); // ensure the section is open so the new card shows
  };

  const handleAddNpc = () => {
    setSection('roster', true);
    setRosterAddOpen(true);
  };
  const handleNewSquad = () => {
    const id = newRosterGroupId();
    addRosterGroup({ id, name: '' });
    setSection('roster', true);
    setRosterFocusGroupId(id);
  };

  // Newest first so a freshly added card lands at the top.
  const encountersNewestFirst = [...userEncounters].reverse();

  return (
    <ContentCardOld heading="Session Prep" icon={<GiBookmarklet />}>
      <VStack align="stretch" spacing={3}>
        <OngoingEffectsCard />

        <PrepSection sectionKey="active-scene" label="Active scene">
          <ActiveSceneCard />
        </PrepSection>

        <PrepSection
          sectionKey="roster"
          label="Roster"
          count={roster.length}
          action={
            <HStack spacing={0}>
              <Button leftIcon={<AddIcon boxSize="8px" />} size="xs" h="20px" px={1.5} variant="ghost" color="whiteAlpha.600" fontSize="2xs" fontWeight="medium" _hover={{ color: 'white', bg: 'whiteAlpha.100' }} onClick={handleAddNpc}>
                Add NPC
              </Button>
              <Button leftIcon={<FiUsers size={11} />} size="xs" h="20px" px={1.5} variant="ghost" color="whiteAlpha.600" fontSize="2xs" fontWeight="medium" _hover={{ color: 'white', bg: 'whiteAlpha.100' }} onClick={handleNewSquad}>
                Squad
              </Button>
            </HStack>
          }
        >
          <RosterEditor />
        </PrepSection>

        <PrepSection
          sectionKey="encounters"
          label="My encounters"
          count={userEncounters.length}
          action={
            <Button
              size="xs"
              h="20px"
              fontSize="2xs"
              leftIcon={<AddIcon boxSize="8px" />}
              colorScheme="blue"
              variant="outline"
              onClick={handleNew}
            >
              New
            </Button>
          }
        >
          {userEncounters.length === 0 ? (
            <Box bg="#26292d" borderWidth="1px" borderStyle="dashed" borderColor="whiteAlpha.200" borderRadius="md" px={2} py={1.5}>
              <Text color="whiteAlpha.500" fontSize="2xs" fontStyle="italic">
                Hit New and start typing. The first line of the body becomes the hook.
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" spacing={1}>
              {encountersNewestFirst.map((e) => (
                <EncounterCardInline key={e.id} encounter={e} autoFocus={e.id === newId} />
              ))}
            </VStack>
          )}
        </PrepSection>

        <PrepSection sectionKey="samples" label="Samples" count={ENCOUNTER_TEMPLATES.length} defaultOpen={false}>
          <VStack align="stretch" spacing={1}>
            {ENCOUNTER_TEMPLATES.map((t) => (
              <EncounterTemplateCard key={t.id} template={t} />
            ))}
          </VStack>
        </PrepSection>
      </VStack>
    </ContentCardOld>
  );
};

export default SessionPrepPanel;
