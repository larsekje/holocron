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
  type SpendContext,
  type SpendCurrency,
  type SpendEntry,
  type SpendTable,
} from '@/data/symbolSpends';
import { useSymbolSpendsStore } from '@/state/symbolSpendsStore';

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

const SymbolSpendsModal: React.FC = () => {
  const visible = useSymbolSpendsStore((s) => s.visible);
  const close = useSymbolSpendsStore((s) => s.close);
  const context = useSymbolSpendsStore((s) => s.context);
  const setContext = useSymbolSpendsStore((s) => s.setContext);

  const tabIndex = Math.max(0, SPEND_CONTEXT_ORDER.indexOf(context));

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
          Symbol Spends
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={5}>
          <Tabs
            index={tabIndex}
            onChange={(i) => setContext(SPEND_CONTEXT_ORDER[i] as SpendContext)}
            colorScheme="orange"
            variant="line"
            isLazy
          >
            <TabList borderColor="whiteAlpha.200">
              {SPEND_CONTEXT_ORDER.map((c) => (
                <Tab
                  key={c}
                  fontSize="sm"
                  color="whiteAlpha.700"
                  _selected={{ color: 'orange.200', borderColor: 'orange.300' }}
                >
                  {SPEND_TABLES[c].title}
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {SPEND_CONTEXT_ORDER.map((c) => (
                <TabPanel key={c} px={0} pt={4}>
                  <TablePanel table={SPEND_TABLES[c]} />
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SymbolSpendsModal;
