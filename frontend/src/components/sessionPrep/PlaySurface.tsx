import React from 'react';
import { VStack } from '@chakra-ui/react';
import useSessionPrepStore from '@/state/sessionPrepStore';
import useUserContentStore from '@/state/userContentStore';
import { ENCOUNTER_TEMPLATES } from '@/data/encounterTemplates';
import { HALCYON_SCENES } from '@/data/halcyonHeist';
import type { SpendContext } from '@/data/symbolSpends';
import ThreadsStrip from './ThreadsStrip';
import ActiveScenePlay from './ActiveScenePlay';
import BenchPanel from './BenchPanel';
import SparksPanel from './SparksPanel';
import ScenesMenu from './ScenesMenu';
import PrepSection from './PrepSection';

/**
 * PlaySurface — what the Session Prep panel becomes while a scene is live.
 * The prep binder inverts: the active scene owns the panel, with the improv
 * supports around it (threads above; bench, sparks, and the scene menu below,
 * each foldable). Ordered top-to-bottom by glance frequency at the table.
 */
const PlaySurface: React.FC = () => {
  const fromTemplateId = useSessionPrepStore((s) => s.activeScene?.fromTemplateId);
  const userEncounters = useUserContentStore((s) => s.userEncounters);

  // Spend suggestions follow the scene's primary tag; anything that isn't
  // straight combat or social reads best from the general table.
  const source =
    userEncounters.find((t) => t.id === fromTemplateId) ??
    ENCOUNTER_TEMPLATES.find((t) => t.id === fromTemplateId) ??
    HALCYON_SCENES.find((t) => t.id === fromTemplateId);
  const primary = source?.tags?.[0];
  const spendContext: SpendContext =
    primary === 'combat' ? 'combat' : primary === 'social' ? 'social' : 'general';

  return (
    <VStack align="stretch" spacing={3}>
      <ThreadsStrip />
      <ActiveScenePlay />
      <PrepSection sectionKey="play-bench" label="Bench">
        <BenchPanel />
      </PrepSection>
      <PrepSection sectionKey="play-sparks" label="Sparks">
        <SparksPanel context={spendContext} />
      </PrepSection>
      <PrepSection sectionKey="play-scenes" label="Scenes" defaultOpen={false}>
        <ScenesMenu />
      </PrepSection>
    </VStack>
  );
};

export default PlaySurface;
