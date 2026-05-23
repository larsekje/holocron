import React, { useState } from 'react';
import { Box, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { GiBookmarklet } from 'react-icons/gi';
import ContentCardOld from '@/ContentCardOld';
import ActiveSceneCard from './ActiveSceneCard';
import OngoingEffectsCard from './OngoingEffectsCard';
import RosterEditor from './RosterEditor';
import EncounterTemplateCard from './EncounterTemplateCard';
import EncounterEditorModal from './EncounterEditorModal';
import { ENCOUNTER_TEMPLATES, type EncounterTemplate } from '@/data/encounterTemplates';
import useUserContentStore from '@/state/userContentStore';

const SectionHeader: React.FC<{
  label: string;
  count?: number;
  action?: React.ReactNode;
}> = ({ label, count, action }) => (
  <HStack justify="space-between" align="center" mb={1}>
    <Text
      fontSize="2xs"
      color="whiteAlpha.500"
      letterSpacing="0.16em"
      textTransform="uppercase"
      fontWeight="bold"
    >
      {label}
      {count !== undefined && ` (${count})`}
    </Text>
    {action}
  </HStack>
);

/**
 * SessionPrepPanel — the GM's prep binder (right column).
 *
 * Top-down: ongoing effects (what's in play) → active scene → tonight's
 * roster (GM-authored) → the GM's own encounters → bundled samples. The
 * roster and "My encounters" are author-your-own, persisted via
 * userContentStore; the samples are the bundled Gundark Gambit seed kept as
 * starting points.
 */
const SessionPrepPanel: React.FC = () => {
  const userEncounters = useUserContentStore((s) => s.userEncounters);
  const roster = useUserContentStore((s) => s.roster);
  const removeEncounter = useUserContentStore((s) => s.removeEncounter);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EncounterTemplate | null>(null);

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (t: EncounterTemplate) => {
    setEditing(t);
    setEditorOpen(true);
  };

  return (
    <ContentCardOld heading="Session Prep" icon={<GiBookmarklet />}>
      <VStack align="stretch" spacing={3}>
        {/* Ongoing effects — at-a-glance "what's in play". */}
        <OngoingEffectsCard />

        <Box>
          <SectionHeader label="Active scene" />
          <ActiveSceneCard />
        </Box>

        <Box>
          <SectionHeader label="Tonight's roster" count={roster.length} />
          <RosterEditor />
        </Box>

        <Box>
          <SectionHeader
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
                onClick={openNew}
              >
                New
              </Button>
            }
          />
          {userEncounters.length === 0 ? (
            <Box
              bg="#26292d"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="whiteAlpha.200"
              borderRadius="md"
              px={2}
              py={1.5}
            >
              <Text color="whiteAlpha.500" fontSize="2xs" fontStyle="italic">
                Build your own encounters with the New button — or copy a sample
                below by opening it and saving.
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" spacing={1}>
              {userEncounters.map((t) => (
                <EncounterTemplateCard
                  key={t.id}
                  template={t}
                  onEdit={openEdit}
                  onDelete={removeEncounter}
                />
              ))}
            </VStack>
          )}
        </Box>

        <Box>
          <SectionHeader label="Samples" count={ENCOUNTER_TEMPLATES.length} />
          <VStack align="stretch" spacing={1}>
            {ENCOUNTER_TEMPLATES.map((t) => (
              <EncounterTemplateCard key={t.id} template={t} />
            ))}
          </VStack>
        </Box>
      </VStack>

      <EncounterEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        initial={editing}
      />
    </ContentCardOld>
  );
};

export default SessionPrepPanel;
