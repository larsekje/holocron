import React from 'react';
import {
  Box,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  SPEND_CONTEXT_ORDER,
  SPEND_TABLES,
  type SpendCurrency,
  type SpendEntry,
  type SpendTable,
} from '@/data/symbolSpends';
import { useSymbolSpendsStore, type ReferenceTab } from '@/state/symbolSpendsStore';
import {
  MANEUVER_RULES,
  MANEUVERS,
  RANGE_EXAMPLES,
  RANGE_MOVES,
  SKILLS,
  type SkillGroup,
} from '@/data/rulesReference';

// Map currency → the same CSS sprite class SpendPanel/Spotlight already use,
// so the symbol glyphs render with the project's existing dice font.
const CURRENCY_ICON: Record<SpendCurrency, string> = {
  advantage: 'icon advantage',
  triumph: 'icon triumph',
  threat: 'icon threat',
  despair: 'icon despair',
};

const CURRENCY_LABEL: Record<SpendCurrency, string> = {
  advantage: 'Advantage',
  triumph: 'Triumph',
  threat: 'Threat',
  despair: 'Despair',
};

// Sub-section ordering inside each column. Cheap symbols first, the dramatic
// trigger (Triumph/Despair) second.
const POSITIVE_ORDER: SpendCurrency[] = ['advantage', 'triumph'];
const NEGATIVE_ORDER: SpendCurrency[] = ['threat', 'despair'];

const SpendRow: React.FC<{ entry: SpendEntry }> = ({ entry }) => (
  <HStack
    spacing={3}
    px={2}
    py={1}
    borderRadius="sm"
    align="flex-start"
    _hover={{ bg: 'whiteAlpha.50' }}
  >
    {/* Cost column. Triumph/Despair are single-symbol triggers — the cost is
        implicit, so render an em-dash where the number would go to keep the
        rows visually aligned without falsely suggesting "1 Triumph". */}
    <Box
      minW="18px"
      textAlign="right"
      flexShrink={0}
      pt="1px"
    >
      <Text
        fontSize="sm"
        color={
          entry.currency === 'triumph' || entry.currency === 'despair'
            ? 'whiteAlpha.300'
            : 'gray.200'
        }
        fontWeight="semibold"
        lineHeight="1.4"
      >
        {entry.currency === 'triumph' || entry.currency === 'despair'
          ? '—'
          : entry.cost}
      </Text>
    </Box>
    <VStack align="stretch" spacing={0} flex="1" minW={0}>
      <Text fontSize="sm" color="gray.100" lineHeight="1.4">
        {entry.label}
      </Text>
      {entry.note && (
        <Text fontSize="xs" color="gray.500" lineHeight="1.35" mt={0.5}>
          {entry.note}
        </Text>
      )}
    </VStack>
  </HStack>
);

const CurrencyBlock: React.FC<{
  currency: SpendCurrency;
  entries: SpendEntry[];
}> = ({ currency, entries }) => {
  const filtered = entries
    .filter((e) => e.currency === currency)
    .sort((a, b) => a.cost - b.cost);

  if (filtered.length === 0) return null;

  return (
    <Box>
      <HStack spacing={2} mb={1.5} px={2}>
        <Box className={CURRENCY_ICON[currency]} fontSize="16px" />
        <Text
          fontSize="xs"
          color="whiteAlpha.700"
          letterSpacing="0.12em"
          textTransform="uppercase"
          fontWeight="semibold"
        >
          {CURRENCY_LABEL[currency]}
        </Text>
      </HStack>
      <VStack align="stretch" spacing={0}>
        {filtered.map((entry, i) => (
          <SpendRow key={`${entry.currency}-${entry.cost}-${i}`} entry={entry} />
        ))}
      </VStack>
    </Box>
  );
};

const TablePanel: React.FC<{ table: SpendTable }> = ({ table }) => (
  <VStack align="stretch" spacing={4}>
    <Text fontSize="sm" color="whiteAlpha.500" lineHeight="1.4">
      {table.blurb}
    </Text>
    <Box
      display="grid"
      gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
      columnGap={6}
      rowGap={5}
    >
      {/* Positive column: Advantage then Triumph */}
      <VStack align="stretch" spacing={5}>
        {POSITIVE_ORDER.map((c) => (
          <CurrencyBlock key={c} currency={c} entries={table.positive} />
        ))}
      </VStack>
      {/* Negative column: Threat then Despair */}
      <VStack align="stretch" spacing={5}>
        {NEGATIVE_ORDER.map((c) => (
          <CurrencyBlock key={c} currency={c} entries={table.negative} />
        ))}
      </VStack>
    </Box>
  </VStack>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text
    fontSize="xs"
    color="whiteAlpha.700"
    letterSpacing="0.12em"
    textTransform="uppercase"
    fontWeight="semibold"
    px={2}
    mb={1.5}
  >
    {children}
  </Text>
);

const SKILL_GROUPS: SkillGroup[] = ['General', 'Combat', 'Knowledge'];

const SkillsPanel: React.FC = () => (
  <VStack align="stretch" spacing={5}>
    {SKILL_GROUPS.map((group) => (
      <Box key={group}>
        <SectionLabel>{group}</SectionLabel>
        <VStack align="stretch" spacing={0}>
          {SKILLS.filter((sk) => sk.group === group).map((sk) => (
            <HStack
              key={sk.name}
              spacing={3}
              px={2}
              py={1}
              borderRadius="sm"
              align="baseline"
              _hover={{ bg: 'whiteAlpha.50' }}
            >
              <Text fontSize="sm" color="gray.100" fontWeight="semibold" minW="150px" flexShrink={0}>
                {sk.name}
              </Text>
              <Text fontSize="xs" color="orange.200" minW="72px" flexShrink={0}>
                {sk.characteristic}
              </Text>
              <Text fontSize="sm" color="gray.300" flex="1" lineHeight="1.4">
                {sk.use}
              </Text>
              <Text fontSize="xs" color="gray.500" minW="170px" textAlign="right" flexShrink={0}>
                {sk.opposedBy ? `vs ${sk.opposedBy}` : sk.resists ? `resists ${sk.resists}` : ''}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    ))}
  </VStack>
);

const ManeuversPanel: React.FC = () => (
  <Box
    display="grid"
    gridTemplateColumns={{ base: '1fr', md: '3fr 2fr' }}
    columnGap={6}
    rowGap={5}
  >
    <Box>
      <SectionLabel>A maneuver can be spent on</SectionLabel>
      <VStack align="stretch" spacing={0}>
        {MANEUVERS.map((m) => (
          <Box key={m.name} px={2} py={1} borderRadius="sm" _hover={{ bg: 'whiteAlpha.50' }}>
            <Text fontSize="sm" color="gray.100" fontWeight="semibold" lineHeight="1.4">
              {m.name}
            </Text>
            <Text fontSize="xs" color="gray.400" lineHeight="1.4">
              {m.effect}
            </Text>
          </Box>
        ))}
      </VStack>
    </Box>
    <VStack align="stretch" spacing={5}>
      <Box>
        <SectionLabel>Moving between range bands</SectionLabel>
        <VStack align="stretch" spacing={0}>
          {RANGE_MOVES.map((r) => (
            <HStack key={`${r.from}-${r.to}`} px={2} py={1} spacing={3} align="baseline">
              <Text fontSize="sm" color="gray.100" flex="1">
                {r.from === r.to ? `Within ${r.from}` : `${r.from} ↔ ${r.to}`}
                {r.note && (
                  <Text as="span" fontSize="xs" color="gray.500">{`  ${r.note}`}</Text>
                )}
              </Text>
              <Text fontSize="sm" color="orange.200" fontWeight="semibold" flexShrink={0}>
                {r.maneuvers} {r.maneuvers === 1 ? 'maneuver' : 'maneuvers'}
              </Text>
            </HStack>
          ))}
        </VStack>
        <VStack align="stretch" spacing={0.5} mt={2} px={2}>
          {RANGE_EXAMPLES.map((e) => (
            <Text key={e} fontSize="xs" color="gray.500" lineHeight="1.4">{e}</Text>
          ))}
        </VStack>
      </Box>
      <Box>
        <SectionLabel>Limits</SectionLabel>
        <VStack align="stretch" spacing={1} px={2}>
          {MANEUVER_RULES.map((r) => (
            <Text key={r} fontSize="sm" color="gray.300" lineHeight="1.4">{r}</Text>
          ))}
        </VStack>
      </Box>
    </VStack>
  </Box>
);

const TAB_ORDER: ReferenceTab[] = [...SPEND_CONTEXT_ORDER, 'skills', 'maneuvers'];
const TAB_TITLE: Record<ReferenceTab, string> = {
  combat: SPEND_TABLES.combat.title,
  social: SPEND_TABLES.social.title,
  general: SPEND_TABLES.general.title,
  skills: 'Skills',
  maneuvers: 'Maneuvers & range',
};

const SymbolSpendsModal: React.FC = () => {
  const visible = useSymbolSpendsStore((s) => s.visible);
  const close = useSymbolSpendsStore((s) => s.close);
  const context = useSymbolSpendsStore((s) => s.context);
  const setContext = useSymbolSpendsStore((s) => s.setContext);

  const tabIndex = Math.max(0, TAB_ORDER.indexOf(context));

  return (
    <Modal isOpen={visible} onClose={close} size="4xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent
        bg="#2F3136"
        color="whiteAlpha.900"
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        <ModalHeader pb={2} fontSize="md" fontWeight="semibold">
          Rules reference
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={5}>
          <Tabs
            index={tabIndex}
            onChange={(i) => setContext(TAB_ORDER[i])}
            colorScheme="orange"
            variant="line"
            isLazy
          >
            <TabList borderColor="whiteAlpha.200">
              {TAB_ORDER.map((c) => (
                <Tab
                  key={c}
                  fontSize="sm"
                  color="whiteAlpha.700"
                  _selected={{ color: 'orange.200', borderColor: 'orange.300' }}
                >
                  {TAB_TITLE[c]}
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {SPEND_CONTEXT_ORDER.map((c) => (
                <TabPanel key={c} px={0} pt={4}>
                  <TablePanel table={SPEND_TABLES[c]} />
                </TabPanel>
              ))}
              <TabPanel px={0} pt={4}>
                <SkillsPanel />
              </TabPanel>
              <TabPanel px={0} pt={4}>
                <ManeuversPanel />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SymbolSpendsModal;
