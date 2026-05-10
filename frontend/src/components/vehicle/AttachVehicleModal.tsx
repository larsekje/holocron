import React, {useEffect, useMemo, useState} from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {ChevronDownIcon, ChevronRightIcon} from '@chakra-ui/icons';
import {browseIndex, getDetail} from '@/data/spotlightIndex';
import useActiveVehicleStore, {
  buildVehicleSpecFromSpotlight,
} from '@/state/activeVehicleStore';
import type {Participant} from '@/state/participantsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** The character whose sheet opened this modal — they become the pilot
   * of the picked vehicle. Minion-group participants are passed straight
   * through to `addVehicle`'s `minions` option so the squadron's ship
   * count matches the pilot's group size from the start. */
  participant: Participant;
}

/** Short-list of the iconic SWRPG vehicles the GM most often reaches for
 * — OT starfighters, the YT freighters, walkers, the speeder bike. The
 * full 50+ catalogue is one click away via "Show all", and the search
 * box always queries the full set so anything off the curated list is
 * still findable by typing its name. Same hand-curated pattern stoogoff
 * uses on its picker. */
const CURATED_VEHICLE_IDS = new Set<string>([
  'vehicle_tie-ln-starfighter',
  'vehicle_tie-in-interceptor',
  'vehicle_tie-sa-tactical-bomber',
  'vehicle_tie-d-defender-multi-role-starfighter',
  'vehicle_t-65b-x-wing-starfighter',
  'vehicle_btl-a4-btl-s3-y-wing-attack-starfighter',
  'vehicle_rz-1-a-wing-light-interceptor',
  'vehicle_a-sf-01-b-wing-heavy-fast-attack-starfighter',
  'vehicle_z-95-af4-headhunter',
  'vehicle_yt-1300-light-freighter',
  'vehicle_yt-2400-light-freighter',
  'vehicle_hwk-290-light-freighter',
  'vehicle_lambda-class-t-4a-long-range-shuttle',
  'vehicle_alliance-t-47-airspeeder',
  'vehicle_all-terrain-armoured-transport',
  'vehicle_all-terrain-scout-transport',
  'vehicle_74-z-speeder-bike',
  'vehicle_cr90-corvette',
]);

/** Stat / weapon summary shown when a row's chevron is expanded. Pulled
 * directly from the spotlight detail — same numbers `buildVehicleSpec…`
 * would copy onto the ActiveVehicle. Compact strip of stat chips on
 * top, named weapons (with damage / crit / range / qualities) below.
 * No mutation; this is read-only preview content. */
const ExpandedDetail: React.FC<{vehicleId: string}> = ({vehicleId}) => {
  const detail = getDetail('vehicle' as any, vehicleId) as any;
  if (!detail) return null;
  const ch = detail.characteristics ?? {};
  const dr = detail.derived ?? {};
  const info = detail.info ?? {};
  const weapons: any[] = Array.isArray(detail.weapons) ? detail.weapons : [];

  const stat = (label: string, value: React.ReactNode) => (
    <WrapItem>
      <HStack spacing={1.5}>
        <Text fontSize="9px" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="0.06em">
          {label}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.900" fontWeight="semibold">
          {value}
        </Text>
      </HStack>
    </WrapItem>
  );

  return (
    <Box bg="#1f2125" borderTopWidth="1px" borderTopColor="whiteAlpha.100" px={3} py={2.5}>
      <Wrap spacing={3} mb={weapons.length > 0 ? 2.5 : 0}>
        {typeof ch.Speed === 'number' && stat('Speed', ch.Speed)}
        {ch.Handling != null && ch.Handling !== '' && stat('Hndl', String(ch.Handling))}
        {typeof dr.armour === 'number' && stat('Armor', dr.armour)}
        {typeof dr.defense === 'number' && stat('Def', dr.defense)}
        {typeof dr.hull === 'number' && stat('Hull', dr.hull)}
        {typeof dr.system === 'number' && stat('Sys', dr.system)}
        {info.complement && stat('Crew', String(info.complement))}
        {info.passengers != null && stat('Pass', String(info.passengers))}
        {info.encumbrance != null && stat('Encum', String(info.encumbrance))}
        {info.consumables && stat('Consum', String(info.consumables))}
        {info.hyperdrive != null && stat('HD', typeof info.hyperdrive === 'object' ? `Cl ${info.hyperdrive.primary ?? '?'}` : `Cl ${info.hyperdrive}`)}
        {info.sensors && stat('Sensors', String(info.sensors))}
      </Wrap>
      {weapons.length > 0 && (
        <>
          <Text fontSize="9px" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
            Weapons ({weapons.length})
          </Text>
          <VStack align="stretch" spacing={1}>
            {weapons.map((w, i) => (
              <Flex key={`${w.name}-${i}`} fontSize="11px" color="whiteAlpha.900" align="baseline" gap={2}>
                <Text fontWeight="semibold" color="white" noOfLines={1} flex="1" minW={0}>
                  {w.name}
                </Text>
                <HStack spacing={2} flexShrink={0} color="whiteAlpha.700">
                  {w.damage != null && <Text>D{w.damage}</Text>}
                  {w.critical != null && <Text>Cr{w.critical}</Text>}
                  {w.range && <Text>{String(w.range)}</Text>}
                </HStack>
              </Flex>
            ))}
          </VStack>
          {weapons.some((w) => Array.isArray(w.qualities) && w.qualities.length > 0) && (
            <Wrap spacing={1} mt={1.5}>
              {Array.from(new Set(weapons.flatMap((w) => w.qualities ?? []))).map((q) => (
                <WrapItem key={q as string}>
                  <Tag size="sm" colorScheme="gray" variant="subtle" fontSize="9px">
                    {q as string}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
        </>
      )}
    </Box>
  );
};

/** Quick-setup picker: from a character's sheet, pick a vehicle from the
 * spotlight library and instantiate it with this character pre-bound as
 * the pilot. Skips the longer "make participant → add vehicle → attach
 * crew" detour that the GM would otherwise have to walk for a TIE-pilot
 * dogfight setup. */
const AttachVehicleModal: React.FC<Props> = ({isOpen, onClose, participant}) => {
  const addVehicle = useActiveVehicleStore((s) => s.add);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setShowAll(false);
      setExpanded(new Set());
    }
  }, [isOpen]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Browse all vehicles up-front, then narrow with the local query — the
  // index is small (~50 entries) so client-side filter is fine.
  const allVehicles = useMemo(() => browseIndex(500, ['vehicle' as any]), []);
  const q = query.trim().toLowerCase();

  // When searching, always query the full catalogue (curation is for
  // picking, not for hiding). Without a query: show only the curated set
  // unless the GM has clicked Show all.
  const visible = useMemo(() => {
    let pool = allVehicles;
    if (!q && !showAll) {
      pool = allVehicles.filter((v) => CURATED_VEHICLE_IDS.has(v.id));
    }
    if (!q) return pool;
    return pool.filter((v) =>
      v.name.toLowerCase().includes(q)
      || (v.subtitle ?? '').toLowerCase().includes(q)
      || (v.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [allVehicles, q, showAll]);

  const handlePick = (id: string) => {
    const detail = getDetail('vehicle' as any, id);
    if (!detail) return;
    const spec = buildVehicleSpecFromSpotlight(detail);
    addVehicle(
      spec,
      [{participantId: participant.id, role: 'pilot'}],
      {minions: participant.stats?.minions ?? 1},
    );
    onClose();
  };

  // Per-row subtitle: a compact stat line useful for picking — Hull,
  // Speed, Handling. No manufacturer / flavour text; the GM is choosing
  // a stat block, not reading lore.
  const subtitleFor = (id: string): string | null => {
    const detail = getDetail('vehicle' as any, id) as any;
    if (!detail) return null;
    const hull = detail.derived?.hull;
    const speed = detail.characteristics?.Speed;
    const handling = detail.characteristics?.Handling;
    const bits: string[] = [];
    if (typeof hull === 'number') bits.push(`Hull ${hull}`);
    if (typeof speed === 'number') bits.push(`Speed ${speed}`);
    if (handling != null && handling !== '') {
      const h = typeof handling === 'number'
        ? (handling >= 0 ? `+${handling}` : String(handling))
        : String(handling);
      bits.push(`Hndl ${h}`);
    }
    return bits.length > 0 ? bits.join(' · ') : null;
  };

  // Pull a Sil-N tag out of the index entry so the row can show a tier
  // square — same visual signal the targets list uses.
  const silOf = (tags?: string[]): number | null => {
    if (!tags) return null;
    for (const t of tags) {
      const m = t.match(/^Sil\s+(\d+)$/i);
      if (m) return parseInt(m[1], 10);
    }
    return null;
  };

  // Sil-coded tier color, matching VehicleTargetCardOld.silColor so the
  // chip in the picker reads as the same vocabulary.
  const silColor = (sil: number | null): string => {
    if (sil == null) return '#3a3f47';
    if (sil >= 6) return '#3a2455';
    if (sil >= 4) return '#3a3a18';
    if (sil >= 2) return '#1f3a4a';
    return '#3a3f47';
  };

  const totalCurated = useMemo(
    () => allVehicles.filter((v) => CURATED_VEHICLE_IDS.has(v.id)).length,
    [allVehicles],
  );
  const isShortlistMode = !q && !showAll;

  // Group visible rows by class (subtitle = the vehicle's group/type from
  // the OggDude data: "Starfighters", "Freighters", "Walkers", etc.) so
  // the GM scans by category rather than a long flat alphabetical wall.
  // Within a group we still sort by name for stability.
  const grouped = useMemo(() => {
    const map = new Map<string, typeof visible>();
    for (const v of visible) {
      const key = v.subtitle && v.subtitle.length > 0 ? v.subtitle : 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700"/>
      <ModalContent bg="gray.900" color="gray.100" maxH="80vh">
        <ModalHeader>
          <HStack spacing={2}>
            <Text>Attach vehicle to</Text>
            <Text color="gray.400">{participant.name}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton/>
        <ModalBody>
          <Input
            size="sm"
            placeholder="Filter by name, group, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg="gray.800"
            borderColor="gray.700"
            mb={2}
            autoFocus
          />
          <HStack justify="space-between" mb={2} fontSize="xs" color="whiteAlpha.500">
            <Text>
              {isShortlistMode
                ? `Popular (${visible.length})`
                : q
                  ? `${visible.length} match`
                  : `All (${visible.length})`}
            </Text>
            {!q && (
              <Button
                size="xs"
                variant="ghost"
                color="orange.300"
                _hover={{bg: 'whiteAlpha.100'}}
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? `Show curated (${totalCurated})` : `Show all (${allVehicles.length})`}
              </Button>
            )}
          </HStack>
          <VStack align="stretch" spacing={3} maxH="55vh" overflowY="auto" pr={1}>
            {visible.length === 0 ? (
              <Text fontSize="sm" color="gray.500" fontStyle="italic" py={4} textAlign="center">
                No vehicles match.
              </Text>
            ) : (
              grouped.map(([group, items]) => (
                <Box key={group}>
                  <Flex align="center" gap={2} mb={1}>
                    <Text
                      as="b"
                      fontSize="9px"
                      letterSpacing="0.18em"
                      textTransform="uppercase"
                      color="whiteAlpha.500"
                    >
                      {group} ({items.length})
                    </Text>
                    <Box flex="1" h="1px" bg="whiteAlpha.100"/>
                  </Flex>
                  <VStack align="stretch" spacing="6px">
                    {items.map((v) => {
                      const sil = silOf(v.tags);
                      const isExpanded = expanded.has(v.id);
                      return (
                        <Box
                          key={v.id}
                          bg="#26292d"
                          borderRadius="md"
                          overflow="hidden"
                          borderWidth="1px"
                          borderColor={isExpanded ? 'whiteAlpha.300' : 'whiteAlpha.100'}
                          transition="border-color 0.1s ease"
                        >
                          <Flex
                            minH="52px"
                            align="stretch"
                            _hover={{bg: '#2c2f34'}}
                            transition="background 0.1s ease"
                          >
                            <Flex
                              as="button"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(v.id);
                              }}
                              w="28px"
                              flexShrink={0}
                              align="center"
                              justify="center"
                              color="whiteAlpha.500"
                              _hover={{color: 'orange.300', bg: 'whiteAlpha.50'}}
                              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                              title={isExpanded ? 'Collapse details' : 'Expand details'}
                            >
                              {isExpanded ? <ChevronDownIcon boxSize={4}/> : <ChevronRightIcon boxSize={4}/>}
                            </Flex>
                            <Flex
                              w="44px"
                              flexShrink={0}
                              align="center"
                              justify="center"
                              flexDirection="column"
                              bg={silColor(sil)}
                              color="white"
                            >
                              <Text fontSize="9px" fontWeight="bold" lineHeight="1" letterSpacing="0.05em">
                                SIL
                              </Text>
                              <Text fontSize="md" fontWeight="bold" lineHeight="1" mt="2px">
                                {sil ?? '—'}
                              </Text>
                            </Flex>
                            <Flex
                              as="button"
                              type="button"
                              onClick={() => handlePick(v.id)}
                              flex="1"
                              minW={0}
                              px={3}
                              py={2}
                              align="center"
                              textAlign="left"
                              _hover={{bg: '#33363c'}}
                              transition="background 0.1s ease"
                            >
                              <VStack align="flex-start" justify="center" flex="1" minW={0} spacing={0.5}>
                                <Text fontSize="sm" color="white" noOfLines={1} fontWeight="semibold" w="100%">
                                  {v.name}
                                </Text>
                                {(() => {
                                  const sub = subtitleFor(v.id);
                                  return sub ? (
                                    <Text fontSize="11px" color="whiteAlpha.500" noOfLines={1} w="100%">
                                      {sub}
                                    </Text>
                                  ) : null;
                                })()}
                              </VStack>
                            </Flex>
                          </Flex>
                          {isExpanded && <ExpandedDetail vehicleId={v.id}/>}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              ))
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AttachVehicleModal;
