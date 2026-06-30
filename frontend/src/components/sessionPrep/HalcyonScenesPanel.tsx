import React from 'react';
import { Box, Tab, TabList, TabPanel, TabPanels, Tabs, VStack } from '@chakra-ui/react';
import EncounterTemplateCard from './EncounterTemplateCard';
import { HALCYON_SCENE_GROUPS } from '@/data/halcyonHeist';

/**
 * HalcyonScenesPanel — the bundled Halcyon Heist rooms-as-scenes, tabbed by ship
 * access zone (Guest / Crew / Officer / Engineering / Covert / Ship). Each tab's
 * colour dot matches the card accent for that zone, so the tabs double as the
 * colour legend. Mirrors the cast panel's tab styling.
 */
const HalcyonScenesPanel: React.FC = () => {
  return (
    <Tabs variant="soft-rounded" size="sm" colorScheme="blue" isLazy>
      <TabList flexWrap="wrap" gap={1} mb={1.5}>
        {HALCYON_SCENE_GROUPS.map((g) => (
          <Tab
            key={g.key}
            fontSize="2xs"
            px={2}
            py={0.5}
            color="whiteAlpha.600"
            _selected={{ color: 'white', bg: 'whiteAlpha.200' }}
          >
            <Box as="span" w="7px" h="7px" borderRadius="full" bg={g.color} mr={1.5} flexShrink={0} />
            {g.label}
            <Box as="span" ml={1} color="whiteAlpha.500">
              {g.scenes.length}
            </Box>
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {HALCYON_SCENE_GROUPS.map((g) => (
          <TabPanel key={g.key} p={0}>
            <VStack align="stretch" spacing={1}>
              {g.scenes.map((t) => (
                <EncounterTemplateCard key={t.id} template={t} />
              ))}
            </VStack>
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

export default HalcyonScenesPanel;
