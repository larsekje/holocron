import React, {useState} from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  List,
  ListItem,
  SimpleGrid,
  Tag,
  Text,
  Tooltip,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {AddIcon, InfoOutlineIcon, MinusIcon} from '@chakra-ui/icons';
import {ReactComponent as DifficultySvg} from '@/assets/dice/difficulty.svg';
import useActiveVehicleStore, {
  type ActiveVehicle,
  type VehicleWeapon,
} from '@/state/activeVehicleStore';
import useParticipantStore from '@/state/participantsStore';
import useDiceRollerStore from '@/state/diceRollerStore';
import useSessionLogStore from '@/state/sessionLogStore';
import {
  buildAttackSnapshot,
  buildFreestandingSnapshot,
  buildSkillCheckSnapshot,
  type WeaponLike,
} from '@/utils/diceSnapshots';
import type {ModalSnapshot} from '@components/dice/mockSnapshots';
import VehicleWeaponCardOld from '@components/statblock/VehicleWeaponCardOld';
import EnterVehicleModal from '@components/vehicle/EnterVehicleModal';
import StatSheetOld from '@components/StatSheetOld';
import {
  MOVE_CATEGORIES,
  MOVE_EFFECT_SPECS,
  VEHICLE_ACTIONS,
  VEHICLE_INCIDENTALS,
  VEHICLE_MANEUVERS,
  moveRequirementLabels,
  moveUnavailableReason,
  speedBandFor,
  type CrewRole,
  type MoveCategory,
  type VehicleMove,
} from '@/data/vehicleActions';

interface Props {
  vehicle: ActiveVehicle;
}

function formatHyperdrive(hd: any): string | null {
  if (hd == null) return null;
  if (typeof hd === 'number') return `Class ${hd}`;
  if (typeof hd === 'object') {
    const primary = hd.primary != null ? `Class ${hd.primary}` : null;
    const backup = hd.backup != null ? `backup ${hd.backup}` : null;
    if (primary && backup) return `${primary} (${backup})`;
    return primary ?? backup;
  }
  return String(hd);
}

/**
 * Right-pane vehicle detail. Visual style mirrors `<StatSheetOld>` for
 * characters: bare layout (parent ContentCardOld provides the dark wrapper),
 * orange section headings, and weapon CARDS rather than a table — same card
 * vocabulary the player rows use.
 */
const VehicleStatSheetOld: React.FC<Props> = ({vehicle}) => {
  const addHull = useActiveVehicleStore((s) => s.addHull);
  const removeHull = useActiveVehicleStore((s) => s.removeHull);
  const addSystem = useActiveVehicleStore((s) => s.addSystemStrain);
  const removeSystem = useActiveVehicleStore((s) => s.removeSystemStrain);
  const addSpeed = useActiveVehicleStore((s) => s.addSpeed);
  const removeSpeed = useActiveVehicleStore((s) => s.removeSpeed);
  const removeOccupant = useActiveVehicleStore((s) => s.removeOccupant);
  const applyVehicleEffect = useActiveVehicleStore((s) => s.applyVehicleEffect);
  const removeVehicleEffect = useActiveVehicleStore((s) => s.removeVehicleEffect);
  const participants = useParticipantStore((s) => s.participants);
  const openDiceRoller = useDiceRollerStore((s) => s.open);

  const [enterOpen, setEnterOpen] = useState(false);
  // Active-occupant context: which crew member the GM is currently
  // role-playing through. Drives the cheat-sheet filter (only show what they
  // can do) and the per-card click → dice roller wiring (rolls the active
  // occupant's pool). Auto-resets to the pilot (else the first occupant)
  // whenever the occupant set changes.
  const [activeOccupantId, setActiveOccupantId] = useState<string | null>(null);
  // View mode: starship sheet vs the active occupant's personal sheet. Same
  // pane, just swapping what's rendered below the toggle. Defaults to
  // 'starship'; resets to 'starship' if the active occupant disappears.
  const [viewMode, setViewMode] = useState<'starship' | 'personal'>('starship');
  const everyoneAboard =
    participants.length > 0 &&
    participants.every((p) => p.equippedVehicleId === vehicle.id);

  const occupants = participants.filter((p) => p.equippedVehicleId === vehicle.id);

  // Auto-pin the active occupant to the pilot when one exists, else the
  // first occupant; clear when there's no one aboard. Runs whenever the
  // occupant set or the stored id changes — keeps activeOccupantId pointing
  // at someone real after a Leave / new Add.
  React.useEffect(() => {
    if (occupants.length === 0) {
      if (activeOccupantId !== null) setActiveOccupantId(null);
      return;
    }
    const current = occupants.find((p) => p.id === activeOccupantId);
    if (current) return;
    const pilot = occupants.find((p) => p.vehicleRole === 'pilot');
    setActiveOccupantId((pilot ?? occupants[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occupants.map((p) => p.id).join('|'), activeOccupantId]);
  const activeOccupant = occupants.find((p) => p.id === activeOccupantId) ?? null;

  // Force back to the starship view if the active occupant goes away — the
  // 'personal' mode has no participant to render.
  React.useEffect(() => {
    if (!activeOccupant && viewMode === 'personal') setViewMode('starship');
  }, [activeOccupant, viewMode]);

  // Cheat-sheet filtering. By default, hide moves that **structurally** can't
  // apply to this ship — wrong silhouette, or astromech-only when this ship
  // is unlikely to have one. Speed-based dimming for transient restrictions
  // (which can change turn-to-turn) stays on regardless. The "Show all"
  // toggle reveals everything for cases where the GM wants to see the full
  // catalogue (e.g., an astromech actually does board).
  const [showAllMoves, setShowAllMoves] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'All' | CrewRole>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | MoveCategory>('All');
  const hasAstromechAboard = occupants.some((p) => p.vehicleRole === 'astromech');
  const isStructurallyApplicable = (m: VehicleMove): boolean => {
    if (m.minSilhouette != null && vehicle.silhouette < m.minSilhouette) return false;
    if (m.maxSilhouette != null && vehicle.silhouette > m.maxSilhouette) return false;
    // Astromech-only moves stay hidden until an astromech is on the ship.
    if (m.role === 'Astromech' && !hasAstromechAboard) return false;
    return true;
  };
  // Filter pipeline: structural → role → category. Counts shown in each
  // chip reflect the *post-structural* set, so "Pilot (5)" matches what you
  // see when you click it. (The two refinement filters compose freely.)
  const structurallyVisibleManeuvers = showAllMoves
    ? VEHICLE_MANEUVERS
    : VEHICLE_MANEUVERS.filter(isStructurallyApplicable);
  const structurallyVisibleActions = showAllMoves
    ? VEHICLE_ACTIONS
    : VEHICLE_ACTIONS.filter(isStructurallyApplicable);
  const structurallyVisibleIncidentals = showAllMoves
    ? VEHICLE_INCIDENTALS
    : VEHICLE_INCIDENTALS.filter(isStructurallyApplicable);
  const allStructurallyVisible = [
    ...structurallyVisibleManeuvers,
    ...structurallyVisibleActions,
    ...structurallyVisibleIncidentals,
  ];
  // Active-occupant gating. When someone is "in the seat", hide moves they
  // can't perform — Pilot moves to a non-pilot crew, Astromech moves to a
  // non-astromech crew, etc.
  const isAvailableToActiveOccupant = (m: VehicleMove): boolean => {
    if (!activeOccupant) return true;
    if (m.role === 'Anyone') return true;
    if (m.role === 'Pilot') return activeOccupant.vehicleRole === 'pilot';
    if (m.role === 'Astromech') return activeOccupant.vehicleRole === 'astromech';
    return true;
  };
  const matchesFilters = (m: VehicleMove) =>
    isAvailableToActiveOccupant(m) &&
    (roleFilter === 'All' || m.role === roleFilter) &&
    (categoryFilter === 'All' || m.category === categoryFilter);
  // Sort cards by category so the grid groups same-colored cards together
  // (Movement→Combat→Defense→Repair→Sensors→Support). Within a category,
  // keep the original data order. Stable via the explicit index tiebreak.
  const sortByCategory = (arr: VehicleMove[]): VehicleMove[] =>
    arr
      .map((m, i) => ({m, i}))
      .sort((a, b) => {
        const ra = MOVE_CATEGORIES.indexOf(a.m.category);
        const rb = MOVE_CATEGORIES.indexOf(b.m.category);
        if (ra !== rb) return ra - rb;
        return a.i - b.i;
      })
      .map((x) => x.m);
  // Maneuvers + incidentals share a section. Snap Roll (Defense) sorts in
  // next to Brace for Impact / Evasive Maneuvers naturally; the tooltip on
  // its card clarifies that it's out-of-turn.
  const visibleManeuvers = sortByCategory([
    ...structurallyVisibleManeuvers.filter(matchesFilters),
    ...structurallyVisibleIncidentals.filter(matchesFilters),
  ]);
  const visibleActions = sortByCategory(structurallyVisibleActions.filter(matchesFilters));

  // Card click → open the dice roller pre-loaded with a skill-check snapshot
  // for the active occupant. Returns null when there's no roll to make
  // (free maneuvers like Accelerate, or no active occupant) — caller renders
  // the card non-interactive in that case.
  // Card click → open the dice roller. Any move with a skill mapping is
  // clickable regardless of whether someone's aboard:
  //   - With an active occupant: pre-load that participant's pool.
  //   - Without: open a freestanding roll labelled with the move name, so
  //     the GM can set up the pool manually.
  // Free maneuvers (Accelerate, Brace, etc.) without a skill stay
  // non-interactive.
  // Effect application goes through a session-log reminder rather than
  // landing the chip immediately. Rationale: the GM should confirm after
  // resolving the dice (and skip if the roll fails). Free maneuvers like
  // Evasive get the same treatment for consistency — one tap brings up a
  // confirm card, one more applies. The Sidebar handles resolveReminder().
  const maybeApplyEffect = (move: VehicleMove) => {
    const spec = MOVE_EFFECT_SPECS[move.id];
    if (!spec) return;
    useSessionLogStore.getState().addReminder({
      effectName: spec.name,
      description: spec.note,
      participantId: vehicle.id,
      participantName: vehicle.name,
      hasApplyAction: true,
      onApply: () => {
        applyVehicleEffect(vehicle.id, {
          moveId: move.id,
          name: spec.name,
          note: spec.note,
        });
      },
      onSkip: undefined,
    });
  };

  const buildClickHandler = (move: VehicleMove): (() => void) | undefined => {
    // Speed maneuvers — direct vehicle-state mutation, no dice roll. Store
    // actions clamp 0..max so clicking past the bounds is a safe no-op.
    if (move.id === 'accelerate') {
      return () => addSpeed(vehicle.id, 1);
    }
    if (move.id === 'decelerate') {
      return () => removeSpeed(vehicle.id, 1);
    }
    // Defensive maneuvers without a check (Evasive, Brace) — apply the
    // tracker chip directly. No dice roller needed.
    if (!move.skill || !move.characteristic) {
      if (MOVE_EFFECT_SPECS[move.id]) {
        return () => maybeApplyEffect(move);
      }
      return undefined;
    }
    return () => {
      maybeApplyEffect(move);
      const diffCount = resolveMoveDifficulty(move, vehicle);
      const isPilotingCheck = move.skill!.toLowerCase().startsWith('piloting');
      if (activeOccupant) {
        const stats = (activeOccupant.stats ?? {}) as Record<string, any>;
        const skills = (stats.skills as Record<string, number>) ?? {};
        // Case-insensitive skill match — adversary data sometimes uses
        // different casing than the rule data ("Gunnery" vs "gunnery").
        const wanted = move.skill!.toLowerCase();
        let rank = 0;
        for (const [k, v] of Object.entries(skills)) {
          if (k.toLowerCase() === wanted) {
            rank = v ?? 0;
            break;
          }
        }
        // Characteristics are flat keys on `stats` (stats.agility,
        // stats.brawn, ...) — mirror StatSheetOld's read.
        const charValue = (stats[move.characteristic!] as number) ?? 0;
        const snap = buildSkillCheckSnapshot(
          activeOccupant,
          move.skill!,
          move.characteristic!,
          rank,
          charValue,
        );
        applyDifficulty(snap, diffCount);
        if (isPilotingCheck) applyShipStateToPilotingCheck(snap, vehicle);
        snap.label = `${activeOccupant.name} — ${move.name}`;
        openDiceRoller(snap);
      } else {
        const snap = buildFreestandingSnapshot();
        snap.label = `${vehicle.name} — ${move.name} (${move.skill})`;
        applyDifficulty(snap, diffCount);
        if (isPilotingCheck) applyShipStateToPilotingCheck(snap, vehicle);
        openDiceRoller(snap);
      }
    };
  };

  // Vehicle weapon click → Gunnery attack snapshot. Active occupant rolls;
  // if no one's aboard, fall back to a freestanding-labelled roll.
  const buildWeaponClickHandler = (weapon: VehicleWeapon): (() => void) => {
    return () => {
      const weaponLike: WeaponLike = {
        name: weapon.name,
        skill: 'Gunnery',
        damage: weapon.damage ?? 0,
        critical: weapon.critical ?? undefined,
        range: weapon.range ?? '',
        qualities: weapon.qualities ?? [],
      };
      if (activeOccupant) {
        const stats = (activeOccupant.stats ?? {}) as Record<string, any>;
        const skills = (stats.skills as Record<string, number>) ?? {};
        let rank = 0;
        for (const [k, v] of Object.entries(skills)) {
          if (k.toLowerCase() === 'gunnery') {
            rank = v ?? 0;
            break;
          }
        }
        const charValue = (stats.agility as number) ?? 0;
        const snap = buildAttackSnapshot(activeOccupant, weaponLike, rank, 'agility', charValue);
        snap.label = `${activeOccupant.name} — ${weapon.name}`;
        openDiceRoller(snap);
      } else {
        const snap = buildFreestandingSnapshot();
        snap.label = `${vehicle.name} — ${weapon.name} (Gunnery)`;
        openDiceRoller(snap);
      }
    };
  };
  const totalMoves =
    VEHICLE_MANEUVERS.length + VEHICLE_ACTIONS.length + VEHICLE_INCIDENTALS.length;
  const structurallyVisibleCount = allStructurallyVisible.length;
  // Dynamic "hiding X and Y" label for the cheat-sheet info row. Only list
  // a category if at least one move was actually filtered for that reason
  // — drops "astromech-only" when an astromech is aboard, etc.
  const allMoves = [...VEHICLE_MANEUVERS, ...VEHICLE_ACTIONS, ...VEHICLE_INCIDENTALS];
  const hidingReasons: string[] = [];
  if (
    allMoves.some(
      (m) =>
        (m.minSilhouette != null && vehicle.silhouette < m.minSilhouette) ||
        (m.maxSilhouette != null && vehicle.silhouette > m.maxSilhouette),
    )
  ) {
    hidingReasons.push('wrong-silhouette');
  }
  if (!hasAstromechAboard && allMoves.some((m) => m.role === 'Astromech')) {
    hidingReasons.push('astromech-only');
  }
  const hidingLabel = hidingReasons.join(' and ');
  const visibleMovesCount = visibleManeuvers.length + visibleActions.length;
  const hiddenCount = totalMoves - structurallyVisibleCount;
  const roleCount = (role: 'All' | CrewRole) =>
    role === 'All'
      ? structurallyVisibleCount
      : allStructurallyVisible.filter((m) => m.role === role).length;
  const categoryCount = (cat: 'All' | MoveCategory) =>
    cat === 'All'
      ? structurallyVisibleCount
      : allStructurallyVisible.filter((m) => m.category === cat).length;

  const hullRemaining = Math.max(vehicle.hullThreshold - vehicle.hullCurrent, 0);
  const systemRemaining = Math.max(vehicle.systemThreshold - vehicle.systemCurrent, 0);

  const info = vehicle.vehicleInfo ?? {};
  const hyperdriveText = formatHyperdrive(info.hyperdrive);

  return (
    <div>
      {/* Header — Sil square + name + class chip, matching the visual weight
          of the participant header (badge + name + archetype line). */}
      <HStack alignItems="center" spacing={3}>
        <Flex
          w="32px"
          h="32px"
          flexShrink={0}
          align="center"
          justify="center"
          bg="#3a2455"
          borderRadius="md"
          color="white"
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="0.05em"
        >
          Sil {vehicle.silhouette}
        </Flex>
        <VStack alignItems="flex-start" spacing={0} flex="1" minW={0}>
          <HStack spacing={2} align="center">
            <Heading size="md" color="white">{vehicle.name}</Heading>
          </HStack>
          {info.type && (
            <Text color="whiteAlpha.800" as="i" fontSize="sm" noOfLines={1}>
              {String(info.type)}
            </Text>
          )}
          {info.manufacturer && (
            <Text color="whiteAlpha.600" fontSize="xs" noOfLines={1}>
              {info.manufacturer}
            </Text>
          )}
        </VStack>
      </HStack>

      {/* Personal/Starship toggle — when an occupant is active, the GM can
          flip the lower half of this pane between the ship's surface and
          the occupant's personal sheet without reselecting a target. */}
      {activeOccupant && (
        <HStack mt={3} mb={1} spacing={2} align="center">
          <Text fontSize="xs" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="0.06em">
            View
          </Text>
          <ToggleButton
            active={viewMode === 'starship'}
            onClick={() => setViewMode('starship')}
          >
            Starship
          </ToggleButton>
          <ToggleButton
            active={viewMode === 'personal'}
            onClick={() => setViewMode('personal')}
          >
            {activeOccupant.name}
          </ToggleButton>
        </HStack>
      )}

      {/* When toggled to Personal, render the active occupant's character
          sheet inline; the vehicle header above stays visible so the GM
          knows they're still anchored to the ship. */}
      {activeOccupant && viewMode === 'personal' ? (
        <Box mt={2}>
          <StatSheetOld participant={activeOccupant}/>
        </Box>
      ) : <>

      {(vehicle.activeEffects ?? []).length > 0 && (
        <Wrap spacing={1.5} mt={3}>
          {(vehicle.activeEffects ?? []).map((eff) => (
            <WrapItem key={eff.id}>
              <Tooltip
                hasArrow
                placement="top"
                openDelay={250}
                bg="#1f2125"
                color="gray.100"
                borderColor="whiteAlpha.200"
                borderWidth="1px"
                borderRadius="md"
                maxW="320px"
                px={3}
                py={2}
                label={<Text fontSize="xs" lineHeight="1.5">{eff.note}</Text>}
                isDisabled={!eff.note}
              >
                <HStack
                  spacing={1.5}
                  px={2}
                  py="2px"
                  bg="rgba(211,153,57,0.12)"
                  borderWidth="1px"
                  borderColor="#d39939"
                  borderRadius="sm"
                  fontSize="xs"
                >
                  <Text color="#d39939" fontWeight="bold" letterSpacing="0.04em">
                    {eff.name}
                  </Text>
                  <Box
                    as="button"
                    type="button"
                    onClick={() => removeVehicleEffect(vehicle.id, eff.id)}
                    color="whiteAlpha.500"
                    _hover={{color: 'red.300'}}
                    aria-label={`Remove ${eff.name}`}
                    px={1}
                  >
                    ×
                  </Box>
                </HStack>
              </Tooltip>
            </WrapItem>
          ))}
        </Wrap>
      )}

      {/* In-play tracks. Hull/System fill = damage taken; Speed fill = throttle
          (full speed isn't a bad state). All adjusted by the GM during play. */}
      <SectionHeading>Status</SectionHeading>
      <HStack spacing={3} align="stretch">
        <MetricTrack
          label="Hull"
          current={vehicle.hullCurrent}
          max={vehicle.hullThreshold}
          remaining={hullRemaining}
          onAdd={() => addHull(vehicle.id, 1)}
          onRemove={() => removeHull(vehicle.id, 1)}
          colorScheme="orange"
          tone="damage"
        />
        <MetricTrack
          label="System Strain"
          current={vehicle.systemCurrent}
          max={vehicle.systemThreshold}
          remaining={systemRemaining}
          onAdd={() => addSystem(vehicle.id, 1)}
          onRemove={() => removeSystem(vehicle.id, 1)}
          colorScheme="purple"
          tone="damage"
        />
        <MetricTrack
          label="Speed"
          current={vehicle.currentSpeed}
          max={vehicle.speed}
          onAdd={() => addSpeed(vehicle.id, 1)}
          onRemove={() => removeSpeed(vehicle.id, 1)}
          colorScheme="cyan"
          tone="level"
          footer={<SpeedBandFooter currentSpeed={vehicle.currentSpeed}/>}
        />
      </HStack>

      {/* Specs — derived stats + crew/cargo + systems condensed into one
          inline strip. Each entry is a label/value pair rendered the same
          way regardless of category, so the GM can scan them at a glance. */}
      <SectionHeading>Specs</SectionHeading>
      <Wrap spacing={3} fontSize="sm" color="whiteAlpha.900">
        <StatChip label="Sil" value={vehicle.silhouette}/>
        <StatChip label="Handling" value={vehicle.handling}/>
        <StatChip label="Armor" value={vehicle.armor}/>
        <StatChip label="Defense" value={vehicle.defense}/>
        {info.hardpoints != null && <StatChip label="HP" value={info.hardpoints}/>}
        {info.complement && <StatChip label="Crew" value={info.complement}/>}
        {info.passengers != null && <StatChip label="Passengers" value={String(info.passengers)}/>}
        {info.encumbrance != null && <StatChip label="Encum" value={info.encumbrance}/>}
        {info.consumables && <StatChip label="Consumables" value={info.consumables}/>}
        {hyperdriveText && <StatChip label="Hyperdrive" value={hyperdriveText}/>}
        {info.sensors && <StatChip label="Sensors" value={info.sensors}/>}
      </Wrap>

      <SectionHeading
        trailing={
          <Button
            size="xs"
            variant="ghost"
            color="#d39939"
            leftIcon={<AddIcon boxSize={2.5}/>}
            onClick={() => setEnterOpen(true)}
            isDisabled={everyoneAboard}
            _hover={{bg: 'whiteAlpha.100'}}
            title={everyoneAboard ? 'Everyone in the encounter is already aboard' : 'Bring participants aboard'}
          >
            Add crew
          </Button>
        }
      >
        Aboard ({occupants.length})
      </SectionHeading>
      {occupants.length === 0 ? (
        <Text fontSize="sm" color="whiteAlpha.600">Unmanned. Use “Add crew” to bring a PC or NPC aboard.</Text>
      ) : (
        <VStack align="stretch" spacing={1}>
          {occupants.map((p) => {
            const isActive = p.id === activeOccupantId;
            return (
              <Flex
                key={p.id}
                role="button"
                px={2}
                py={1}
                borderRadius="sm"
                bg={isActive ? 'rgba(211,153,57,0.15)' : 'whiteAlpha.50'}
                borderLeftWidth="3px"
                borderLeftColor={isActive ? '#d39939' : 'transparent'}
                align="center"
                justify="space-between"
                cursor="pointer"
                onClick={() => setActiveOccupantId(p.id)}
                _hover={isActive ? undefined : {bg: 'whiteAlpha.100'}}
                transition="background 0.1s ease"
              >
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="semibold" color="white">{p.name}</Text>
                  {p.vehicleRole && (
                    <Tag size="sm" colorScheme="blue" variant="subtle">{p.vehicleRole}</Tag>
                  )}
                  {p.isPC && <Tag size="sm" colorScheme="green" variant="subtle">PC</Tag>}
                  {isActive && (
                    <Tag size="sm" colorScheme="orange" variant="solid" fontSize="9px">
                      ACTIVE
                    </Tag>
                  )}
                </HStack>
                <Tooltip label={`Remove ${p.name} from ${vehicle.name}`} hasArrow openDelay={300}>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="whiteAlpha.700"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOccupant(vehicle.id, p.id);
                    }}
                    _hover={{bg: 'whiteAlpha.100', color: 'white'}}
                  >
                    Leave
                  </Button>
                </Tooltip>
              </Flex>
            );
          })}
        </VStack>
      )}


      {/* Cheat-sheet filters. Two refinement axes (role + category) layered
          on top of the structural "applicable to this ship" filter. Counts
          on each chip reflect the post-structural set so the GM sees what
          actually changes when they tap. */}
      <SectionHeading
        trailing={
          <Button
            size="xs"
            variant="ghost"
            color="#d39939"
            onClick={() => setShowAllMoves((v) => !v)}
            _hover={{bg: 'whiteAlpha.100'}}
          >
            {showAllMoves ? 'Filter to ship' : 'Show all'}
          </Button>
        }
      >
        Cheat sheet
      </SectionHeading>
      <Text fontSize="xs" color="whiteAlpha.500" fontStyle="italic" mb={2}>
        {showAllMoves
          ? `Showing all ${totalMoves} moves`
          : hiddenCount > 0
            ? `Showing ${visibleMovesCount} of ${totalMoves} — hiding ${hidingLabel}`
            : `Showing all ${visibleMovesCount} moves applicable to this ship`}
      </Text>
      {!activeOccupant && (
        <Text fontSize="xs" color="orange.200" mb={2}>
          No crew aboard — clicks open a freestanding roll. Use “Add crew” to auto-load an
          occupant’s pool.
        </Text>
      )}
      <Wrap spacing={1} mb={1}>
        {(['All', 'Pilot', 'Astromech', 'Anyone'] as const).map((r) => (
          <WrapItem key={r}>
            <FilterChip
              active={roleFilter === r}
              count={roleCount(r)}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </FilterChip>
          </WrapItem>
        ))}
      </Wrap>
      <Wrap spacing={1} mb={1}>
        <WrapItem>
          <FilterChip
            active={categoryFilter === 'All'}
            count={categoryCount('All')}
            onClick={() => setCategoryFilter('All')}
          >
            All
          </FilterChip>
        </WrapItem>
        {MOVE_CATEGORIES.map((cat) => (
          <WrapItem key={cat}>
            <FilterChip
              active={categoryFilter === cat}
              count={categoryCount(cat)}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </FilterChip>
          </WrapItem>
        ))}
      </Wrap>

      {visibleManeuvers.length > 0 && (
        <>
          <SectionHeading>Maneuvers</SectionHeading>
          <SimpleGrid columns={2} spacing={1.5}>
            {visibleManeuvers.map((m) => (
              <VehicleMoveCard
                key={m.id}
                move={m}
                currentSpeed={vehicle.currentSpeed}
                silhouette={vehicle.silhouette}
                onClick={buildClickHandler(m)}
              />
            ))}
          </SimpleGrid>
        </>
      )}

      {visibleActions.length > 0 && (
        <>
          <SectionHeading>Actions</SectionHeading>
          <SimpleGrid columns={2} spacing={1.5}>
            {visibleActions.map((a) => (
              <VehicleMoveCard
                key={a.id}
                move={a}
                currentSpeed={vehicle.currentSpeed}
                silhouette={vehicle.silhouette}
                onClick={buildClickHandler(a)}
              />
            ))}
          </SimpleGrid>
        </>
      )}


      <SectionHeading>Weapons</SectionHeading>
      <VStack align="stretch" spacing={2}>
        {vehicle.weapons.length > 0 ? (
          vehicle.weapons.map((w, i) => (
            <VehicleWeaponCardOld
              key={`${w.name}-${i}`}
              weapon={w}
              onClick={buildWeaponClickHandler(w)}
            />
          ))
        ) : (
          <Text fontSize="sm" color="whiteAlpha.700">None</Text>
        )}
      </VStack>

      {vehicle.criticalInjuries.length > 0 && (
        <>
          <SectionHeading>Critical Hits ({vehicle.criticalInjuries.length})</SectionHeading>
          <List spacing={1}>
            {vehicle.criticalInjuries.map((c) => (
              <ListItem key={c.id} fontSize="sm" color="whiteAlpha.900">
                <Text as="span" fontWeight="semibold">{c.title}</Text>
                {c.summary && (
                  <Text as="span" color="whiteAlpha.600">
                    {' — '}{c.summary}
                  </Text>
                )}
              </ListItem>
            ))}
          </List>
        </>
      )}

      <EnterVehicleModal
        isOpen={enterOpen}
        onClose={() => setEnterOpen(false)}
        vehicleId={vehicle.id}
      />
      </>}
    </div>
  );
};

interface MetricTrackProps {
  label: string;
  current: number;
  max: number;
  /** Optional secondary line (e.g. "X remaining" for damage tracks). */
  remaining?: number;
  onAdd: () => void;
  onRemove: () => void;
  colorScheme: string;
  /** `damage` turns the number red when current >= max (Hull/System);
   * `level` keeps it neutral (Speed — full throttle is fine). */
  tone?: 'damage' | 'level';
  /** Optional content rendered below the bar (e.g. context-aware
   * speed-band effects under the Speed track). */
  footer?: React.ReactNode;
}

const MetricTrack: React.FC<MetricTrackProps> = ({
  label,
  current,
  max,
  remaining,
  onAdd,
  onRemove,
  colorScheme,
  tone = 'damage',
  footer,
}) => {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const exceeded = tone === 'damage' && current >= max && max > 0;
  const atMax = current >= max && max > 0;
  return (
    <Box flex="1" p={3} borderRadius="md" bg="#1f2125" borderWidth="1px" borderColor="whiteAlpha.100">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="0.06em">
          {label}
        </Text>
        <HStack spacing={1}>
          <IconButton
            aria-label={`Remove ${label}`}
            icon={<MinusIcon/>}
            size="xs"
            variant="ghost"
            onClick={onRemove}
            isDisabled={current <= 0}
          />
          <IconButton
            aria-label={`Add ${label}`}
            icon={<AddIcon/>}
            size="xs"
            variant="ghost"
            onClick={onAdd}
            isDisabled={tone === 'level' && atMax}
          />
        </HStack>
      </HStack>
      <HStack spacing={1} align="baseline">
        <Heading size="lg" color={exceeded ? 'red.300' : 'white'}>
          {current}
        </Heading>
        <Text color="whiteAlpha.500">/ {max}</Text>
      </HStack>
      <Box mt={2} h="6px" bg="#0e1014" borderRadius="sm" overflow="hidden">
        <Box h="100%" w={`${pct}%`} bg={`var(--chakra-colors-${colorScheme}-400)`}/>
      </Box>
      {remaining !== undefined && (
        <Text fontSize="xs" color="whiteAlpha.500" mt={1}>
          {remaining} remaining
        </Text>
      )}
      {footer && <Box mt={1}>{footer}</Box>}
    </Box>
  );
};

// Compact context-aware footer for the Speed track. Shows the active
// speed-band's forced-move and effect summary so the GM gets the band info
// without a separate Movement section.
const SpeedBandFooter: React.FC<{currentSpeed: number}> = ({currentSpeed}) => {
  const band = speedBandFor(currentSpeed);
  return (
    <Text fontSize="xs" color="whiteAlpha.500" lineHeight="1.35">
      <Text as="span" color="whiteAlpha.700" fontWeight="semibold">
        {band.rangeBands === 0 ? 'No move' : `${band.rangeBands} bands`}
      </Text>
      {band.effects.length > 0 && (
        <>
          {' · '}
          {band.effects.join(' · ')}
        </>
      )}
    </Text>
  );
};

const StatChip: React.FC<{label: string; value: React.ReactNode}> = ({label, value}) => (
  <WrapItem>
    <HStack spacing={2}>
      <Text
        fontSize="xs"
        color="whiteAlpha.500"
        textTransform="uppercase"
        letterSpacing="0.06em"
      >
        {label}
      </Text>
      <Text fontSize="sm" color="whiteAlpha.900" fontWeight="semibold">
        {value}
      </Text>
    </HStack>
  </WrapItem>
);

// SWRPG difficulty preset table — index = number of purple dice. Used to
// translate a raw difficulty count to the dice-roller snapshot fields
// (label + preset id).
const DIFFICULTY_PRESETS: Array<{label: string; presetId: string}> = [
  {label: 'Simple', presetId: 'difficulty-simple'},
  {label: 'Easy', presetId: 'difficulty-easy'},
  {label: 'Average', presetId: 'difficulty-average'},
  {label: 'Hard', presetId: 'difficulty-hard'},
  {label: 'Daunting', presetId: 'difficulty-daunting'},
  {label: 'Formidable', presetId: 'difficulty-formidable'},
];

// Resolve the difficulty (purple-dice count) to prefill for a vehicle move.
// Fixed-difficulty moves carry their value in `move.difficulty`; the few
// variable moves we can derive from current ship state (Dangerous Driving =
// silhouette, Damage Control = system-strain band) get a context-aware
// prefill. Everything else falls back to Average (♦♦) — the GM adjusts.
function resolveMoveDifficulty(move: VehicleMove, vehicle: ActiveVehicle): number {
  if (move.difficulty != null) return move.difficulty;
  if (move.id === 'dangerous-driving') {
    return Math.max(1, Math.min(5, vehicle.silhouette));
  }
  if (move.id === 'damage-control') {
    const t = vehicle.systemThreshold;
    const s = vehicle.systemCurrent;
    if (t <= 0) return 2;
    if (s >= t) return 3;       // ≥ threshold → Hard
    if (s >= t / 2) return 2;   // ≥ ½ threshold → Average
    return 1;                   // < ½ threshold → Easy
  }
  return 2;
}

// Apply N upgrades to a snapshot. Per SWRPG rules, an upgrade converts a
// Difficulty (purple) die into a Challenge (red) die; if there's no purple
// to upgrade, the upgrade adds a fresh Challenge instead. Used to wire
// speed-band penalties (Piloting checks at speed 3+) into the dice pool.
function applyDifficultyUpgrades(snap: ModalSnapshot, upgrades: number, source: string): void {
  if (upgrades <= 0) return;
  const pool = {...snap.pool};
  let diff = pool.difficulty ?? 0;
  let chal = pool.challenge ?? 0;
  let remaining = upgrades;
  let added = 0;
  while (remaining > 0) {
    if (diff > 0) {
      diff -= 1;
    }
    chal += 1;
    added += 1;
    remaining -= 1;
  }
  pool.difficulty = diff;
  pool.challenge = chal;
  snap.pool = pool;
  const sources = (snap.poolSources ?? {}) as Record<string, string[]>;
  sources.difficulty = Array(diff).fill('Difficulty');
  sources.challenge = [...(sources.challenge ?? []), ...Array(added).fill(source)];
  snap.poolSources = sources as ModalSnapshot['poolSources'];
}

// Add N boost (light-blue) dice to a snapshot, tagging the source so the
// dice roller's tooltip says e.g. "1 Boost (from Handling)".
function addBoostDice(snap: ModalSnapshot, n: number, source: string): void {
  if (n <= 0) return;
  const pool = {...snap.pool};
  pool.boost = (pool.boost ?? 0) + n;
  snap.pool = pool;
  const sources = (snap.poolSources ?? {}) as Record<string, string[]>;
  sources.boost = [...(sources.boost ?? []), ...Array(n).fill(source)];
  snap.poolSources = sources as ModalSnapshot['poolSources'];
}

// Add N setback (black) dice to a snapshot, tagging the source.
function addSetbackDice(snap: ModalSnapshot, n: number, source: string): void {
  if (n <= 0) return;
  const pool = {...snap.pool};
  pool.setback = (pool.setback ?? 0) + n;
  snap.pool = pool;
  const sources = (snap.poolSources ?? {}) as Record<string, string[]>;
  sources.setback = [...(sources.setback ?? []), ...Array(n).fill(source)];
  snap.poolSources = sources as ModalSnapshot['poolSources'];
}

// Parse the ship's Handling field — strings like "+1", "-2", "0". Returns
// the signed integer; non-numeric input returns 0. Handling > 0 adds boost
// dice to Piloting checks; < 0 adds setback.
function parseHandling(s: string): number {
  if (typeof s !== 'string') return 0;
  const m = s.trim().match(/^([+-]?)(\d+)$/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * parseInt(m[2], 10);
}

// Wire ship-state modifiers into a Piloting-check snapshot:
//   - Speed-band Challenge upgrades (PDF p.50)
//   - Handling boost / setback
// No-op for non-Piloting checks. Sources are labelled so the dice roller
// shows "1 Boost (Handling)" and "1 Challenge (Speed)" in the breakdown.
function applyShipStateToPilotingCheck(snap: ModalSnapshot, vehicle: ActiveVehicle): void {
  applyDifficultyUpgrades(snap, speedBandFor(vehicle.currentSpeed).pilotUpgrades, 'Speed');
  const h = parseHandling(vehicle.handling);
  if (h > 0) addBoostDice(snap, h, 'Handling');
  else if (h < 0) addSetbackDice(snap, -h, 'Handling');
}

// Patch a snapshot's difficulty in place so the dice roller opens with the
// right number of purple dice + matching label/preset.
function applyDifficulty(snap: ModalSnapshot, count: number): void {
  const clamped = Math.max(0, Math.min(5, count));
  const preset = DIFFICULTY_PRESETS[clamped];
  snap.pool = {...snap.pool, difficulty: clamped};
  snap.difficultyLabel = preset.label;
  // Replace any prior difficulty preset; preserve other applied presets.
  snap.appliedPresets = (snap.appliedPresets ?? []).filter(
    (p) => !p.startsWith('difficulty-'),
  );
  snap.appliedPresets.push(preset.presetId);
  // Ensure poolSources has matching difficulty entries for tooltip clarity.
  const sources = (snap.poolSources ?? {}) as Record<string, string[]>;
  sources.difficulty = Array(clamped).fill('Difficulty');
  snap.poolSources = sources as ModalSnapshot['poolSources'];
}

// Per-category visual accent. Edge color anchors the left border so the GM
// can scan a column of cards and find "the green ones for defense" or "red
// for combat" at a glance. Tints are kept low-saturation so the cards still
// read as part of the dark sheet rather than candy-colored.
const CATEGORY_ACCENT: Record<MoveCategory, {edge: string; tint: string}> = {
  Movement: {edge: '#3b9bd1', tint: 'rgba(59,155,209,0.06)'},
  Combat: {edge: '#c75a30', tint: 'rgba(199,90,48,0.07)'},
  Defense: {edge: '#3a7e57', tint: 'rgba(58,126,87,0.06)'},
  Repair: {edge: '#d39939', tint: 'rgba(211,153,57,0.06)'},
  Sensors: {edge: '#8a5fc4', tint: 'rgba(138,95,196,0.06)'},
  Support: {edge: '#5b85b3', tint: 'rgba(91,133,179,0.06)'},
};

// Compact card for a vehicle maneuver/action. Top line: name + difficulty
// pips + ⓘ tooltip trigger. Bottom line: role/category/requirement chips.
// All prose (summary, description, unavailability reason) lives in the
// tooltip — the card surface stays scannable. When `onClick` is supplied
// the card is hover-highlighted and click-actionable; otherwise it's a
// non-interactive read-only block.
const VehicleMoveCard: React.FC<{
  move: VehicleMove;
  currentSpeed: number;
  silhouette: number;
  onClick?: () => void;
}> = ({move, currentSpeed, silhouette, onClick}) => {
  const reason = moveUnavailableReason(move, currentSpeed, silhouette);
  const requirements = moveRequirementLabels(move);
  const dimmed = reason !== null;
  const accent = CATEGORY_ACCENT[move.category];

  const tooltipBody = (
    <Box fontSize="xs" lineHeight="1.5">
      {reason && (
        <Text color="orange.200" mb={2}>
          {reason}
        </Text>
      )}
      <Text mb={move.description ? 2 : 0}>{move.summary}</Text>
      {move.description && <Text color="whiteAlpha.700">{move.description}</Text>}
    </Box>
  );

  const interactive = !!onClick && !dimmed;
  return (
    <Box
      role={interactive ? 'button' : undefined}
      bg={accent.tint}
      borderLeftWidth="3px"
      borderLeftColor={accent.edge}
      borderTopWidth="1px"
      borderRightWidth="1px"
      borderBottomWidth="1px"
      borderTopColor="whiteAlpha.100"
      borderRightColor="whiteAlpha.100"
      borderBottomColor="whiteAlpha.100"
      borderRadius="sm"
      px={2}
      py={1.5}
      opacity={dimmed ? 0.45 : 1}
      transition="background 0.1s ease, opacity 0.1s ease"
      cursor={interactive ? 'pointer' : 'default'}
      onClick={interactive ? onClick : undefined}
      _hover={interactive ? {bg: `${accent.edge}22`} : undefined}
    >
      {/* Top: name + difficulty + ⓘ */}
      <HStack spacing={2} align="center">
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="whiteAlpha.900"
          flex="1"
          minW={0}
          noOfLines={2}
        >
          {move.name}
        </Text>
        {move.difficulty != null && move.difficulty > 0 && (
          <DifficultyPips count={move.difficulty}/>
        )}
        <Tooltip
          hasArrow
          placement="left"
          openDelay={150}
          bg="#1f2125"
          color="gray.100"
          borderColor="whiteAlpha.200"
          borderWidth="1px"
          borderRadius="md"
          maxW="360px"
          px={3}
          py={2}
          label={tooltipBody}
        >
          <Box
            as="span"
            display="inline-flex"
            alignItems="center"
            color="whiteAlpha.500"
            cursor="help"
            flexShrink={0}
            _hover={{color: 'whiteAlpha.900'}}
          >
            <InfoOutlineIcon boxSize={3.5}/>
          </Box>
        </Tooltip>
      </HStack>
      {/* Bottom: chips */}
      <Wrap spacing={1} mt={1} shouldWrapChildren>
        <CategoryTag category={move.category} edge={accent.edge}/>
        <RoleChip role={move.role}/>
        {requirements.map((r) => (
          <RequirementChip key={r} label={r} dimmed={dimmed}/>
        ))}
      </Wrap>
    </Box>
  );
};

// Inline difficulty dice — one purple ♦ svg per fixed point of difficulty.
const DifficultyPips: React.FC<{count: number}> = ({count}) => (
  <HStack spacing="2px" flexShrink={0} aria-label={`Difficulty ${count}`}>
    {Array.from({length: count}).map((_, i) => (
      <DifficultySvg key={i} width={11} height={11}/>
    ))}
  </HStack>
);

// Category tag: its own pill so the category color shows up alongside role
// even when the user is filtering by something else.
const CategoryTag: React.FC<{category: MoveCategory; edge: string}> = ({category, edge}) => (
  <Box
    px={1.5}
    py="1px"
    borderRadius="sm"
    fontSize="9px"
    fontWeight="bold"
    letterSpacing="0.04em"
    bg={`${edge}22`}
    color={edge}
    borderWidth="1px"
    borderColor={`${edge}55`}
    textTransform="uppercase"
    flexShrink={0}
  >
    {category}
  </Box>
);

// Two-state toggle button (Starship vs Personal). Visually parallels the
// FilterChip style — orange accent when active, neutral when not.
const ToggleButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({active, onClick, children}) => (
  <Box
    as="button"
    type="button"
    onClick={onClick}
    px={3}
    py={1}
    borderWidth="1px"
    borderColor={active ? '#d39939' : 'whiteAlpha.200'}
    bg={active ? 'rgba(211,153,57,0.15)' : 'transparent'}
    borderRadius="sm"
    fontSize="xs"
    color={active ? '#d39939' : 'whiteAlpha.800'}
    fontWeight={active ? 'bold' : 'normal'}
    cursor="pointer"
    transition="all 0.1s ease"
    _hover={{bg: active ? 'rgba(211,153,57,0.22)' : 'whiteAlpha.100'}}
  >
    {children}
  </Box>
);

// Filter pill used by the role and category cheat-sheet filters. Active state
// uses the same orange accent as the section headings so the active filter
// reads as part of the section it controls.
const FilterChip: React.FC<{
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
}> = ({active, count, onClick, children}) => {
  const disabled = count === 0 && !active;
  return (
    <Box
      as="button"
      type="button"
      onClick={disabled ? undefined : onClick}
      px={2}
      py="2px"
      borderWidth="1px"
      borderColor={active ? '#d39939' : 'whiteAlpha.200'}
      bg={active ? 'rgba(211,153,57,0.15)' : 'transparent'}
      borderRadius="sm"
      fontSize="10px"
      letterSpacing="0.04em"
      color={active ? '#d39939' : disabled ? 'whiteAlpha.300' : 'whiteAlpha.800'}
      fontWeight={active ? 'bold' : 'normal'}
      cursor={disabled ? 'default' : 'pointer'}
      opacity={disabled ? 0.5 : 1}
      transition="all 0.1s ease"
      _hover={disabled ? undefined : {bg: active ? 'rgba(211,153,57,0.22)' : 'whiteAlpha.100'}}
    >
      {children}
      <Text as="span" ml={1.5} color={active ? '#d39939' : 'whiteAlpha.500'}>
        {count}
      </Text>
    </Box>
  );
};

const RequirementChip: React.FC<{label: string; dimmed: boolean}> = ({label, dimmed}) => (
  <Tag
    size="sm"
    variant="outline"
    colorScheme={dimmed ? 'orange' : 'gray'}
    fontSize="9px"
    minH="0"
    h="16px"
    px={1.5}
    verticalAlign="middle"
    flexShrink={0}
  >
    {label}
  </Tag>
);

// Role colour-coding so the GM can pick out who can do what at a glance.
// Matches the homebrew's hard role gates: Pilot Only, Astromech Only, or
// anyone with the right skill.
const ROLE_SCHEME: Record<CrewRole, string> = {
  Pilot: 'cyan',
  Astromech: 'teal',
  Anyone: 'gray',
};

const RoleChip: React.FC<{role: CrewRole}> = ({role}) => (
  <Tag
    size="sm"
    variant="subtle"
    colorScheme={ROLE_SCHEME[role]}
    fontSize="9px"
    minH="0"
    h="16px"
    px={1.5}
    verticalAlign="middle"
    flexShrink={0}
  >
    {role}
  </Tag>
);

// Section heading — duplicated from StatSheetOld for visual parity. Orange
// uppercase divider used between every section. `trailing` slots in a button
// or chip on the right (e.g. "+ Add crew").
const SectionHeading: React.FC<{children: React.ReactNode; trailing?: React.ReactNode}> = ({
  children,
  trailing,
}) => (
  <Flex align="center" justify="space-between" mt={4} mb={1}>
    <Text
      as="b"
      fontSize="10px"
      letterSpacing="0.16em"
      textTransform="uppercase"
      color="#d39939"
    >
      {children}
    </Text>
    {trailing}
  </Flex>
);

export default VehicleStatSheetOld;
