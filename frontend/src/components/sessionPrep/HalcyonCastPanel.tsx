import React, { useState } from 'react';
import {
  Badge,
  Box,
  Collapse,
  HStack,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  HALCYON_CAMPS,
  HALCYON_NPCS,
  type HalcyonNpc,
} from '@/data/halcyonHeist';

/**
 * HalcyonCastPanel — the bundled Halcyon Heist roster, as a read-only browser.
 *
 * Tabs split the 34 NPCs by camp (Undertow / Crew / Mark / Guests); each tab is
 * a compact, muted grid of one collapsible card per NPC. Deliberately quiet —
 * this is reference that sits under the roster, not a focal point: no per-card
 * icons or coloured accents (the tab already says which camp), just name, cover
 * role, and a one-line glimpse of the read-aloud `seen`. Expanding reveals the
 * GM detail (truth / want / lever / found / ties). Distinct from the *Scenes*
 * samples — these are people, not encounters, so there's no "Start scene".
 */

/** One labelled GM field in the expanded part of an NPC card. */
const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <Box>
      <Text
        fontSize="2xs"
        color="whiteAlpha.500"
        letterSpacing="0.16em"
        textTransform="uppercase"
        mb={0.5}
      >
        {label}
      </Text>
      <Text fontSize="xs" lineHeight="1.4" color="whiteAlpha.800" whiteSpace="pre-wrap">
        {value}
      </Text>
    </Box>
  );
};

const NpcCard: React.FC<{ npc: HalcyonNpc }> = ({ npc }) => {
  const [open, setOpen] = useState(false);
  // "What they are": cover role first, species trailing.
  const role = [npc.face, npc.species].filter(Boolean).join(' · ');

  const toggle = () => setOpen((v) => !v);

  return (
    <Box
      bg="#22252a"
      borderWidth="1px"
      borderColor={open ? 'whiteAlpha.300' : 'whiteAlpha.100'}
      borderRadius="md"
      transition="border-color 120ms"
      alignSelf="start"
      // Expanded card breaks out of the grid to span the full row so the GM
      // detail has room to breathe; collapsed tiles stay compact.
      gridColumn={open ? '1 / -1' : undefined}
    >
      <Box
        as="button"
        type="button"
        w="100%"
        textAlign="left"
        px={2}
        py={1.5}
        borderRadius="md"
        onClick={toggle}
        _hover={{ bg: 'whiteAlpha.50' }}
      >
        <HStack spacing={1.5} align="baseline">
          <Text color="whiteAlpha.900" fontSize="xs" fontWeight="medium" lineHeight="1.25" noOfLines={1} flex="1" minW={0}>
            {npc.name}
          </Text>
          {npc.trail && (
            <Badge
              bg="whiteAlpha.100"
              color="whiteAlpha.500"
              fontSize="9px"
              px={1}
              py={0}
              borderRadius="sm"
              lineHeight="1.3"
              flexShrink={0}
              title={`Feeds investigation trail ${npc.trail}`}
            >
              {npc.trail}
            </Badge>
          )}
        </HStack>
        {role && (
          <Text color="whiteAlpha.500" fontSize="2xs" lineHeight="1.3" noOfLines={1} mt={0.5}>
            {role}
          </Text>
        )}
        {/* How they look — the read-aloud, kept quiet: muted, one line until the
            card is expanded. */}
        {npc.seen && (
          <Text
            color="whiteAlpha.600"
            fontSize="2xs"
            lineHeight="1.35"
            whiteSpace="pre-wrap"
            noOfLines={open ? undefined : 1}
            mt={0.5}
          >
            {npc.seen}
          </Text>
        )}
      </Box>

      <Collapse in={open} animateOpacity>
        <VStack align="stretch" spacing={1.5} px={2} pb={2} pt={0.5}>
          <Field label="Truth" value={npc.truth} />
          <Field label="Want" value={npc.want} />
          <Field label="Lever" value={npc.lever} />
          <Field label="Found" value={npc.found} />
          {npc.ties.length > 0 && <Field label="Ties" value={npc.ties.join(' · ')} />}
        </VStack>
      </Collapse>
    </Box>
  );
};

const HalcyonCastPanel: React.FC = () => {
  return (
    <Tabs variant="soft-rounded" size="sm" colorScheme="blue" isLazy>
      <TabList flexWrap="wrap" gap={1} mb={1.5}>
        {HALCYON_CAMPS.map((c) => {
          const count = HALCYON_NPCS.filter((n) => n.camp === c.camp).length;
          return (
            <Tab
              key={c.camp}
              fontSize="2xs"
              px={2}
              py={0.5}
              color="whiteAlpha.600"
              _selected={{ color: 'white', bg: 'whiteAlpha.200' }}
            >
              {c.label}
              <Box as="span" ml={1} color="whiteAlpha.500">
                {count}
              </Box>
            </Tab>
          );
        })}
      </TabList>
      <TabPanels>
        {HALCYON_CAMPS.map((c) => (
          <TabPanel key={c.camp} p={0}>
            <Text fontSize="2xs" color="whiteAlpha.500" fontStyle="italic" mb={1.5} px={0.5}>
              {c.blurb}
            </Text>
            <SimpleGrid minChildWidth="148px" spacing={1} alignItems="start">
              {HALCYON_NPCS.filter((n) => n.camp === c.camp).map((npc) => (
                <NpcCard key={npc.id} npc={npc} />
              ))}
            </SimpleGrid>
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

export default HalcyonCastPanel;
