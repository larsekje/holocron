import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { CircleMarker, ImageOverlay, MapContainer, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Text,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import fuzzysort from 'fuzzysort';
import galaxyMapData from '@/data/galaxyMap.generated.json';
import planetCompendium from '@/data/planetCompendium.generated.json';

interface GalaxySystem {
  name: string;
  x: number; // 0..1 from the left edge of the map
  y: number; // 0..1 from the top edge
  grid: string;
}

const DATA = galaxyMapData as {
  image: string;
  width: number;
  height: number;
  source: string;
  generatedAt: string;
  systems: GalaxySystem[];
};

// CRS.Simple bounds are [[0,0],[H,W]]. The basemap's top-left pixel sits at
// the NW corner [H,0], so a normalized (x,y)-from-top maps to [H*(1-y), W*x].
const BOUNDS: L.LatLngBoundsLiteral = [
  [0, 0],
  [DATA.height, DATA.width],
];
const toLatLng = (s: { x: number; y: number }): L.LatLngTuple => [
  DATA.height * (1 - s.y),
  DATA.width * s.x,
];

// Rich per-planet reference, extracted from the Planetary Compendium PDF by
// buildPlanetCompendium.mjs. It names a subset of the map's systems.
interface Planet {
  name: string;
  astronav?: string;
  orbitalMetrics?: string;
  government?: string;
  population?: string;
  languages?: string;
  terrain?: string;
  majorCities?: string;
  areasOfInterest?: string;
  majorExports?: string;
  majorImports?: string;
  tradeRoutes?: string;
  specialConditions?: string;
  background?: string;
}

const COMPENDIUM = (planetCompendium as { planets: Planet[] }).planets;

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Look up a system's compendium entry. Most match under the exact same
// name; a few differ only by a trailing qualifier ("Yavin" vs "Yavin IV",
// "Empress Teta" vs "Empress Teta Systems"), so fall back to a whole-word
// prefix match before giving up.
const COMPENDIUM_BY_NAME = new Map(COMPENDIUM.map((p) => [normalize(p.name), p]));
function planetFor(systemName: string): Planet | undefined {
  const n = normalize(systemName);
  const exact = COMPENDIUM_BY_NAME.get(n);
  if (exact) return exact;
  for (const p of COMPENDIUM) {
    const pn = normalize(p.name);
    if (pn.startsWith(n + ' ') || n.startsWith(pn + ' ')) return p;
  }
  return undefined;
}

// The compendium's astrography line ends "…, <Region> region" — pull the
// region out for the popup's one-line summary.
const regionOf = (planet?: Planet): string | undefined =>
  planet?.astronav?.match(/,\s*([^,]+?)\s+region\b/i)?.[1];

// Flies the map to the focused system whenever it changes. Lives inside
// MapContainer so it can reach the Leaflet map instance via useMap().
const FlyToFocus: React.FC<{ focus: GalaxySystem | null }> = ({ focus }) => {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo(toLatLng(focus), 1, { duration: 0.6 });
  }, [focus, map]);
  return null;
};

// Pin the zoom-out limit to "the whole map fits the viewport" — zooming out
// past that just shrinks the map into empty space. Set once on mount.
const ZoomFloor: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    map.setMinZoom(map.getBoundsZoom(BOUNDS, false));
  }, [map]);
  return null;
};

// One labelled fact in a system popup.
const Fact: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box display="flex" gap={1.5} lineHeight="1.4">
    <Text as="span" color="gray.500" flexShrink={0} minW="44px">
      {label}
    </Text>
    <Text as="span" color="gray.800">
      {value}
    </Text>
  </Box>
);

// Popup body for a system: name + grid always, plus the Planetary Compendium
// entry (region, government, population, terrain, trade routes, and a
// scrollable background) when one matches.
const SystemPopup: React.FC<{ system: GalaxySystem }> = ({ system }) => {
  const planet = planetFor(system.name);
  const region = regionOf(planet);
  return (
    <Box fontSize="xs" maxW="300px">
      <Text fontWeight="bold" fontSize="sm" lineHeight="1.2" color="gray.900">
        {system.name}
      </Text>
      <Text color="gray.500">
        grid {system.grid}
        {region ? ` · ${region}` : ''}
      </Text>
      {planet && (
        <>
          <Box mt={1.5} display="flex" flexDirection="column" gap={0.5}>
            {planet.government && <Fact label="Govt" value={planet.government} />}
            {planet.population && <Fact label="Pop" value={planet.population} />}
            {planet.terrain && <Fact label="Terrain" value={planet.terrain} />}
            {planet.tradeRoutes &&
              planet.tradeRoutes.toLowerCase() !== 'none' && (
                <Fact label="Routes" value={planet.tradeRoutes} />
              )}
          </Box>
          {planet.background && (
            <Box
              mt={2}
              maxH="150px"
              overflowY="auto"
              color="gray.700"
              lineHeight="1.5"
              pr={1}
            >
              {planet.background}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

/**
 * GalaxyMap — the interactive galaxy basemap. Leaflet in CRS.Simple mode
 * (non-geographic image map): the rasterized page-1 PDF is the basemap, and
 * every system extracted by buildGalaxyMap.mjs gets a clickable marker with
 * a name + grid-reference popup. The search box fuzzy-matches system names
 * and flies to the pick. Fills its container — the overlay panel sizes it.
 */
const GalaxyMap: React.FC = () => {
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState<GalaxySystem | null>(null);
  const focusMarkerRef = useRef<L.CircleMarker | null>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return fuzzysort
      .go(q, DATA.systems, { key: 'name', limit: 8 })
      .map((r) => r.obj);
  }, [query]);

  // Pop the focused system's label once it has flown into view.
  useEffect(() => {
    if (!focus) return;
    const t = window.setTimeout(() => focusMarkerRef.current?.openPopup(), 650);
    return () => window.clearTimeout(t);
  }, [focus]);

  return (
    <Box position="relative" h="100%" w="100%" bg="#05070d">
      <MapContainer
        crs={L.CRS.Simple}
        bounds={BOUNDS}
        maxBounds={BOUNDS}
        maxBoundsViscosity={1}
        minZoom={-4}
        maxZoom={3}
        zoomSnap={0.25}
        // The basemap is one large ImageOverlay — animating a zoom means
        // CSS-transforming that whole image every frame, which janks. Zoom
        // instantly instead: snappy, and no half-rendered scaling in between.
        zoomAnimation={false}
        fadeAnimation={false}
        // Higher = less twitchy: more wheel travel per zoom level (default 60).
        wheelPxPerZoomLevel={160}
        preferCanvas
        attributionControl={false}
        style={{ height: '100%', width: '100%', background: '#05070d' }}
      >
        <ImageOverlay url={DATA.image} bounds={BOUNDS} />
        {DATA.systems.map((s) => {
          const isFocus = focus?.name === s.name && focus?.grid === s.grid;
          // Systems with a Planetary Compendium entry get a green marker (and
          // a touch more presence) so the ones worth clicking stand out.
          const hasInfo = !!planetFor(s.name);
          const color = isFocus ? '#f1c043' : hasInfo ? '#6fe39b' : '#7fc1ff';
          const baseOpacity = isFocus ? 0.9 : hasInfo ? 0.55 : 0.3;
          return (
            <CircleMarker
              key={`${s.name}|${s.grid}`}
              center={toLatLng(s)}
              radius={isFocus ? 8 : 5}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: baseOpacity,
                weight: isFocus ? 2 : 1,
              }}
              ref={isFocus ? focusMarkerRef : undefined}
              eventHandlers={{
                mouseover: (e) =>
                  (e.target as L.CircleMarker).setStyle({ fillOpacity: 0.85 }),
                mouseout: (e) =>
                  (e.target as L.CircleMarker).setStyle({
                    fillOpacity: baseOpacity,
                  }),
              }}
            >
              <Popup maxWidth={320}>
                <SystemPopup system={s} />
              </Popup>
            </CircleMarker>
          );
        })}
        <FlyToFocus focus={focus} />
        <ZoomFloor />
      </MapContainer>

      {/* Search overlay — fuzzy-matches system names, flies to the pick. */}
      <Box position="absolute" top="12px" left="12px" zIndex={1000} w="260px">
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="whiteAlpha.500" boxSize="3" />
          </InputLeftElement>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${DATA.systems.length} systems…`}
            bg="#1f2530"
            color="whiteAlpha.900"
            borderColor="whiteAlpha.200"
            _hover={{ borderColor: 'whiteAlpha.300' }}
            _focusVisible={{ borderColor: '#7fc1ff', boxShadow: 'none' }}
            _placeholder={{ color: 'whiteAlpha.400' }}
          />
        </InputGroup>
        {results.length > 0 && (
          <List
            mt={1}
            bg="#1f2530"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="md"
            overflow="hidden"
            boxShadow="0 10px 26px rgba(0,0,0,0.55)"
          >
            {results.map((s) => (
              <ListItem
                key={`${s.name}|${s.grid}`}
                px={3}
                py={1.5}
                cursor="pointer"
                _hover={{ bg: 'whiteAlpha.100' }}
                onClick={() => {
                  setFocus(s);
                  setQuery('');
                }}
              >
                <Text fontSize="sm" color="whiteAlpha.900">
                  {s.name}
                </Text>
                <Text fontSize="2xs" color="whiteAlpha.500">
                  grid {s.grid}
                </Text>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Source credit — it's a fan-made map; keep the attribution visible. */}
      <Box
        position="absolute"
        bottom="6px"
        right="8px"
        zIndex={1000}
        fontSize="9px"
        color="whiteAlpha.400"
        pointerEvents="none"
      >
        Galaxy map: wrvh.home.xs4all.nl
      </Box>
    </Box>
  );
};

export default GalaxyMap;
