import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { GiBookmarklet } from 'react-icons/gi';
import ContentCardOld from '@/ContentCardOld';
import ActiveSceneCard from './ActiveSceneCard';
import OngoingEffectsCard from './OngoingEffectsCard';
import TonightsRosterCard from './TonightsRosterCard';
import EncounterTemplateCard from './EncounterTemplateCard';
import { ENCOUNTER_TEMPLATES } from '@/data/encounterTemplates';
import { TONIGHTS_ROSTER_SAMPLES } from '@/data/tonightsRosterSamples';

const SectionHeader: React.FC<{ label: string; count?: number }> = ({
  label,
  count,
}) => (
  <Text
    fontSize="2xs"
    color="whiteAlpha.500"
    letterSpacing="0.16em"
    textTransform="uppercase"
    fontWeight="bold"
    mb={1}
  >
    {label}
    {count !== undefined && ` (${count})`}
  </Text>
);

/**
 * SessionPrepPanel — replaces the old "Targeted" column.
 *
 * Top-down: ongoing effects (what's in play) → active scene → tonight's
 * roster → encounter templates pool. Eventually a reorderable stack of
 * typed cards; for now it's fixed sections so we can iterate on what each
 * one wants to do.
 */
const SessionPrepPanel: React.FC = () => {
  return (
    <ContentCardOld heading="Session Prep" icon={<GiBookmarklet/>}>
      <VStack align="stretch" spacing={3}>
        {/* Ongoing effects — self-contained card, pinned to the top as the
            at-a-glance "what's in play" readout. */}
        <OngoingEffectsCard />

        <Box>
          <SectionHeader label="Active scene" />
          <ActiveSceneCard />
        </Box>

        <Box>
          <SectionHeader label="Tonight's roster" count={TONIGHTS_ROSTER_SAMPLES.length} />
          <TonightsRosterCard />
        </Box>

        <Box>
          <SectionHeader label="Encounter templates" count={ENCOUNTER_TEMPLATES.length} />
          <VStack align="stretch" spacing={1}>
            {ENCOUNTER_TEMPLATES.map((t) => (
              <EncounterTemplateCard key={t.id} template={t} />
            ))}
          </VStack>
        </Box>
      </VStack>
    </ContentCardOld>
  );
};

export default SessionPrepPanel;
