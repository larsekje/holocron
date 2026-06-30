import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Box,
  Text,
  Flex,
  Spinner,
  Select,
  Switch,
  Tooltip,
  IconButton,
  VStack,
  HStack,
  Wrap,
  WrapItem,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FaUsers, FaSpaceShuttle } from 'react-icons/fa';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as DifficultySvg } from '@/assets/dice/difficulty.svg';
import { ReactComponent as ChallengeSvg } from '@/assets/dice/challenge.svg';
import { Adversary } from '@/types/adversaryTypes';
import adversaryService from '@/services/adversaryService';
import useParticipantStore from '@/state/participantsStore';
import useActiveVehicleStore, { buildVehicleSpecFromSpotlight } from '@/state/activeVehicleStore';
import { browseIndex, getDetail } from '@/data/spotlightIndex';

interface AdversarySelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

/** The six derived Archetype buckets, in scan order. */
const ARCHETYPES = ['Combatant', 'Specialist', 'Force', 'Social', 'Creature', 'Civilian'];
const TIERS: Array<Adversary['type']> = ['Minion', 'Rival', 'Nemesis'];

const TIER_COLOR: Record<string, string> = { Minion: 'green', Rival: 'blue', Nemesis: 'red' };

// Reuse the narrative-dice iconography the GM already knows: setback (minion),
// difficulty (rival), challenge (nemesis).
const TIER_ICON: Record<string, React.ComponentType<any>> = {
  Minion: SetbackSvg,
  Rival: DifficultySvg,
  Nemesis: ChallengeSvg,
};

const PANEL_BG = '#202326';
const ROW_BG = '#26292d';

// Vehicle `info.type` is "category/subtype"; the first segment is the category.
// Exclude ground/atmospheric craft so the Starships tab stays starships.
const NON_STARSHIP_CATEGORIES = new Set([
  'speeder',
  'speeder truck',
  'airspeeder',
  'landspeeder',
  'walker',
  'swoop',
]);
function isStarship(detail: any): boolean {
  const t = String(detail?.info?.type ?? '').toLowerCase().trim();
  if (!t) return true;
  const root = t.split('/')[0]?.trim() ?? '';
  return !NON_STARSHIP_CATEGORIES.has(root);
}

interface ShipEntry {
  id: string;
  name: string;
  subtitle?: string;
  detail: any;
}

/** A small toggle chip used for the Tier / Archetype facets. */
const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; activeColor?: string }> = ({
  active,
  onClick,
  children,
  activeColor = 'blue',
}) => (
  <Button
    size="xs"
    h="22px"
    borderRadius="full"
    variant={active ? 'solid' : 'outline'}
    colorScheme={active ? activeColor : 'gray'}
    color={active ? undefined : 'whiteAlpha.700'}
    borderColor={active ? undefined : 'whiteAlpha.300'}
    fontWeight="medium"
    onClick={onClick}
  >
    {children}
  </Button>
);

const AdversarySelector: React.FC<AdversarySelectorProps> = ({ isOpen, onClose }) => {
  // ── shared ──────────────────────────────────────────────────────────────
  const addParticipant = useParticipantStore((s) => s.addParticipant);
  const addVehicle = useActiveVehicleStore((s) => s.add);
  const toast = useToast();

  // ── adversaries ─────────────────────────────────────────────────────────
  const [adversaries, setAdversaries] = useState<Adversary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tiers, setTiers] = useState<Set<string>>(new Set());
  const [archetypes, setArchetypes] = useState<Set<string>>(new Set());
  const [faction, setFaction] = useState('all');
  const [role, setRole] = useState('all');
  const [includeNamed, setIncludeNamed] = useState(false);
  const [selected, setSelected] = useState<Adversary | null>(null);
  const [minionCount, setMinionCount] = useState(4);

  // ── starships (lazy-built on first open) ─────────────────────────────────
  const [ships, setShips] = useState<ShipEntry[] | null>(null);
  const [shipSearch, setShipSearch] = useState('');
  const [selectedShip, setSelectedShip] = useState<ShipEntry | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await adversaryService.getAdversaries();
        if (!cancelled) setAdversaries(data);
      } catch (error) {
        console.error('Failed to load adversaries:', error);
        toast({ title: 'Error loading adversaries', status: 'error', duration: 3000, isClosable: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // Faction / Role dropdown options, derived from the data actually present.
  const factionOptions = useMemo(() => {
    const s = new Set<string>();
    adversaries.forEach((a) => (a.factions ?? []).forEach((f) => f && s.add(f)));
    return [...s].sort();
  }, [adversaries]);
  const roleOptions = useMemo(() => {
    const s = new Set<string>();
    adversaries.forEach((a) => a.coreArchetype && s.add(a.coreArchetype));
    return [...s].sort();
  }, [adversaries]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return adversaries.filter((a) => {
      if (!includeNamed && a.named) return false;
      if (tiers.size && !tiers.has(a.type)) return false;
      if (archetypes.size && !(a.archetype && archetypes.has(a.archetype))) return false;
      if (faction !== 'all' && !(a.factions ?? []).includes(faction)) return false;
      if (role !== 'all' && a.coreArchetype !== role) return false;
      if (term && !(a.name.toLowerCase().includes(term) || (a.description ?? '').toLowerCase().includes(term)))
        return false;
      return true;
    });
  }, [adversaries, search, tiers, archetypes, faction, role, includeNamed]);

  const RENDER_CAP = 250;
  const shown = filtered.slice(0, RENDER_CAP);

  const toggle = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const buildShips = () => {
    if (ships) return;
    const out: ShipEntry[] = [];
    for (const e of browseIndex(5000, ['vehicle'])) {
      const detail = getDetail('vehicle', e.id);
      if (detail && isStarship(detail)) out.push({ id: e.id, name: e.name, subtitle: e.subtitle, detail });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    setShips(out);
  };

  const filteredShips = useMemo(() => {
    if (!ships) return [];
    const term = shipSearch.trim().toLowerCase();
    if (!term) return ships;
    return ships.filter((s) => s.name.toLowerCase().includes(term) || (s.subtitle ?? '').toLowerCase().includes(term));
  }, [ships, shipSearch]);

  const handleAddAdversary = () => {
    if (!selected) return;
    try {
      const p = adversaryService.convertToParticipant(selected);
      if (selected.type === 'Minion') p.stats!.minions = minionCount;
      addParticipant(p);
      toast({ title: 'Adversary added', description: selected.name, status: 'success', duration: 2000, isClosable: true });
      onClose();
    } catch (error) {
      console.error('Error converting adversary to participant:', error);
      toast({ title: 'Error adding adversary', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleAddShip = () => {
    if (!selectedShip) return;
    addVehicle(buildVehicleSpecFromSpotlight(selectedShip.detail));
    toast({
      title: 'Starship added',
      description: selectedShip.detail.fullName ?? selectedShip.name,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={PANEL_BG} color="whiteAlpha.900" borderWidth="1px" borderColor="whiteAlpha.200">
        <ModalHeader fontSize="md">Add to encounter</ModalHeader>
        <ModalCloseButton />

        <Tabs
          variant="line"
          colorScheme="blue"
          isLazy
          index={tabIndex}
          onChange={(i) => {
            setTabIndex(i);
            if (i === 1) buildShips();
          }}
        >
          <TabList px={4} borderColor="whiteAlpha.200">
            <Tab fontSize="sm" gap={2}>
              <FaUsers /> Adversaries
            </Tab>
            <Tab fontSize="sm" gap={2}>
              <FaSpaceShuttle /> Starships
            </Tab>
          </TabList>

          <TabPanels>
            {/* ── Adversaries ─────────────────────────────────────────────── */}
            <TabPanel px={4} pb={2}>
              <VStack spacing={3} align="stretch">
                {/* Search + tier (dice) + include-named, all on one row */}
                <HStack spacing={2}>
                  <Input
                    placeholder="Search by name or description…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    bg={ROW_BG}
                    borderColor="whiteAlpha.200"
                    flex={1}
                    minW={0}
                  />
                  <HStack spacing={1} flexShrink={0}>
                    {TIERS.map((t) => {
                      const Icon = TIER_ICON[t];
                      const active = tiers.has(t);
                      return (
                        <Tooltip key={t} label={t}>
                          <IconButton
                            aria-label={`Filter ${t}`}
                            icon={<Icon width={18} />}
                            size="sm"
                            variant="ghost"
                            bg={active ? 'whiteAlpha.200' : 'transparent'}
                            borderWidth="1px"
                            borderColor={active ? 'whiteAlpha.400' : 'whiteAlpha.200'}
                            opacity={active ? 1 : 0.5}
                            _hover={{ bg: 'whiteAlpha.100', opacity: 1 }}
                            onClick={() => toggle(tiers, t, setTiers)}
                          />
                        </Tooltip>
                      );
                    })}
                  </HStack>
                  <Box w="1px" h="22px" bg="whiteAlpha.200" flexShrink={0} />
                  <FormControl display="flex" alignItems="center" w="auto" flexShrink={0}>
                    <FormLabel htmlFor="include-named" fontSize="xs" color="whiteAlpha.600" mb={0} mr={2} whiteSpace="nowrap">
                      Named
                    </FormLabel>
                    <Switch id="include-named" size="sm" colorScheme="blue" isChecked={includeNamed} onChange={(e) => setIncludeNamed(e.target.checked)} />
                  </FormControl>
                </HStack>

                {/* Archetype chips */}
                <Wrap spacing={1.5}>
                  {ARCHETYPES.map((a) => (
                    <WrapItem key={a}>
                      <Chip active={archetypes.has(a)} onClick={() => toggle(archetypes, a, setArchetypes)}>
                        {a}
                      </Chip>
                    </WrapItem>
                  ))}
                </Wrap>

                {/* Faction + Role dropdowns */}
                <HStack>
                  <Select value={faction} onChange={(e) => setFaction(e.target.value)} bg={ROW_BG} borderColor="whiteAlpha.200" size="sm">
                    <option value="all">All factions</option>
                    {factionOptions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Select>
                  <Select value={role} onChange={(e) => setRole(e.target.value)} bg={ROW_BG} borderColor="whiteAlpha.200" size="sm">
                    <option value="all">All roles</option>
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </HStack>

                <Text fontSize="xs" color="whiteAlpha.500">
                  {filtered.length} match{filtered.length === 1 ? '' : 'es'}
                  {filtered.length > RENDER_CAP ? ` (showing first ${RENDER_CAP} — refine to narrow)` : ''}
                </Text>

                {loading ? (
                  <Flex justify="center" py={8}>
                    <Spinner />
                  </Flex>
                ) : (
                  <Box maxH="340px" overflowY="auto" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="md">
                    {shown.length === 0 ? (
                      <Text p={4} textAlign="center" color="whiteAlpha.500" fontSize="sm">
                        No adversaries match these filters
                      </Text>
                    ) : (
                      <VStack spacing={0} align="stretch">
                        {shown.map((a) => {
                          const isSel = selected?.name === a.name;
                          return (
                            <Box
                              key={a.name}
                              px={3}
                              py={2}
                              cursor="pointer"
                              borderLeftWidth="2px"
                              borderLeftColor={isSel ? `${TIER_COLOR[a.type]}.400` : 'transparent'}
                              bg={isSel ? 'whiteAlpha.100' : 'transparent'}
                              _hover={{ bg: 'whiteAlpha.50' }}
                              onClick={() => setSelected(a)}
                            >
                              <Flex justify="space-between" align="center" gap={2}>
                                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                  {a.name}
                                </Text>
                                <HStack spacing={1} flexShrink={0}>
                                  {a.coreArchetype && (
                                    <Badge bg="whiteAlpha.150" color="whiteAlpha.700" fontSize="9px" textTransform="none">
                                      {a.coreArchetype}
                                    </Badge>
                                  )}
                                  <Badge colorScheme={TIER_COLOR[a.type]} fontSize="9px">
                                    {a.type}
                                  </Badge>
                                </HStack>
                              </Flex>
                              <Text fontSize="2xs" color="whiteAlpha.500" noOfLines={1}>
                                {[a.archetype, (a.factions ?? []).join(' · ')].filter(Boolean).join('  ·  ')}
                              </Text>
                              {isSel && a.description && (
                                <Text fontSize="xs" mt={1} color="whiteAlpha.700" noOfLines={3}>
                                  {a.description}
                                </Text>
                              )}
                            </Box>
                          );
                        })}
                      </VStack>
                    )}
                  </Box>
                )}

                {selected?.type === 'Minion' && (
                  <FormControl>
                    <FormLabel fontSize="sm" mb={1}>
                      Number of minions
                    </FormLabel>
                    <NumberInput min={1} max={10} value={minionCount} onChange={(_, v) => setMinionCount(v || 1)} size="sm" maxW="120px">
                      <NumberInputField bg={ROW_BG} borderColor="whiteAlpha.200" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                )}
              </VStack>
            </TabPanel>

            {/* ── Starships ───────────────────────────────────────────────── */}
            <TabPanel px={4} pb={2}>
              <VStack spacing={3} align="stretch">
                <Input
                  placeholder="Search starships…"
                  value={shipSearch}
                  onChange={(e) => setShipSearch(e.target.value)}
                  bg={ROW_BG}
                  borderColor="whiteAlpha.200"
                />
                <Text fontSize="xs" color="whiteAlpha.500">
                  {filteredShips.length} starship{filteredShips.length === 1 ? '' : 's'}
                </Text>
                {ships === null ? (
                  <Flex justify="center" py={8}>
                    <Spinner />
                  </Flex>
                ) : (
                  <Box maxH="380px" overflowY="auto" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="md">
                    {filteredShips.length === 0 ? (
                      <Text p={4} textAlign="center" color="whiteAlpha.500" fontSize="sm">
                        No starships match your search
                      </Text>
                    ) : (
                      <VStack spacing={0} align="stretch">
                        {filteredShips.slice(0, 300).map((s) => {
                          const isSel = selectedShip?.id === s.id;
                          return (
                            <Box
                              key={s.id}
                              px={3}
                              py={2}
                              cursor="pointer"
                              borderLeftWidth="2px"
                              borderLeftColor={isSel ? 'blue.400' : 'transparent'}
                              bg={isSel ? 'whiteAlpha.100' : 'transparent'}
                              _hover={{ bg: 'whiteAlpha.50' }}
                              onClick={() => setSelectedShip(s)}
                            >
                              <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                {s.name}
                              </Text>
                              {s.subtitle && (
                                <Text fontSize="2xs" color="whiteAlpha.500" noOfLines={1}>
                                  {s.subtitle}
                                </Text>
                              )}
                            </Box>
                          );
                        })}
                      </VStack>
                    )}
                  </Box>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {tabIndex === 1 ? (
            <Button colorScheme="blue" onClick={handleAddShip} isDisabled={!selectedShip}>
              Add starship
            </Button>
          ) : (
            <Button colorScheme="blue" onClick={handleAddAdversary} isDisabled={!selected}>
              Add adversary
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AdversarySelector;
