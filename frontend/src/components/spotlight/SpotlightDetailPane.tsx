import React from 'react';
import {
  Badge,
  Box,
  HStack,
  Skeleton,
  SkeletonText,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/react';
import type { SpotlightDetail } from '@/state/spotlightStore';
import { Interweave } from 'interweave';
import { oggToHtml, oggInlineToHtml } from '@/utils/oggMarkup';
import DetailStat from './DetailStat';
import adversaryService from '@/services/adversaryService';

interface SpotlightDetailPaneProps {
  detail: SpotlightDetail | null;
  detailLoading: boolean;
}

const borderCol = 'gray.700';

function normalizeQualities(detail: any): string[] {
  const raw =
    detail?.qualities ??
    detail?.weaponQualities ??
    detail?.weapon_qualities ??
    detail?.weaponqualities;

  if (!raw) return [];

  const out: string[] = [];
  const push = (label?: string, count?: number | string) => {
    if (!label) return;
    const suffix = count != null && count !== '' ? ` ${count}` : '';
    out.push(`${label}${suffix}`.trim());
  };

  if (Array.isArray(raw)) {
    for (const q of raw) {
      if (typeof q === 'string') {
        out.push(q);
      } else if (q && typeof q === 'object') {
        const name = q.name ?? q.key ?? q.id ?? q.label ?? q.Name ?? q.Key;
        const count = q.count ?? q.value ?? q.rank ?? q.Count ?? q.Value ?? q.Rank;
        push(name, count);
      }
    }
    return out;
  }

  if (typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      if (v == null || v === false) continue;
      if (typeof v === 'number' || typeof v === 'string') {
        push(k, v as any);
      } else if (typeof v === 'object') {
        const name = (v as any).name ?? (v as any).key ?? k;
        const count = (v as any).count ?? (v as any).value ?? (v as any).rank;
        push(name, count);
      } else {
        push(k);
      }
    }
    return out;
  }

  if (typeof raw === 'string') return [raw];

  return [];
}

function normalizeBaseMods(detail: any): string[] {
  const direct =
    detail?.baseMods ??
    detail?.basemods ??
    detail?.base_mods ??
    detail?.baseMod ??
    detail?.basemod;

  let raw: any = direct;

  if (!raw && Array.isArray(detail?.mods)) {
    raw = detail.mods;
  }

  if (!raw) return [];

  const extract = (m: any): string | null => {
    if (m == null) return null;
    if (typeof m === 'string') return m;
    if (typeof m === 'object') {
      return (
        m.miscDesc ??
        m.MiscDesc ??
        m.description ??
        m.Description ??
        m.desc ??
        m.name ??
        m.Name ??
        m.label ??
        null
      );
    }
    return null;
  };

  if (Array.isArray(raw)) {
    return raw.map(extract).filter(Boolean) as string[];
  }

  if (typeof raw === 'object') {
    if (Array.isArray((raw as any).Mod)) {
      return (raw as any).Mod.map(extract).filter(Boolean) as string[];
    }
    return Object.values(raw).map(extract).filter(Boolean) as string[];
  }

  if (typeof raw === 'string') return [raw];

  return [];
}

const SpotlightDetailPane: React.FC<SpotlightDetailPaneProps> = ({ detail, detailLoading }) => {
  const [advMeta, setAdvMeta] = React.useState<{
    factions: string[];
    roles: string[];
    traits: string[];
    factionReasons: Record<string, string[]>;
    roleReasons: Record<string, string[]>;
    traitReasons: Record<string, string[]>;
  } | null>(null);

  React.useEffect(() => {
    let alive = true;
    async function load() {
      setAdvMeta(null);
      if (!detail) return;
      const kind = ((detail as any).__kind ?? detail.type);
      if (kind !== 'adversary') return;
      try {
        const name = detail.name;
        await adversaryService.loadAdversaries();
        const adv = await adversaryService.getAdversaryByName(name);
        if (!alive) return;
        if (!adv) {
          setAdvMeta({ factions: [], roles: [], traits: [], factionReasons: {}, roleReasons: {}, traitReasons: {} });
          return;
        }
        const factions = adversaryService.getFactionsFor(adv) ?? [];
        const roles = adversaryService.getArchetypesFor(adv) ?? [];
        const traits = adversaryService.getTraitsFor(adv) ?? [];
        const factionReasons = adversaryService.getFactionExplanations(adv) ?? {};
        const roleReasons = adversaryService.getArchetypeExplanations(adv) ?? {};
        const traitReasons = adversaryService.getTraitExplanations(adv) ?? {};
        setAdvMeta({ factions, roles, traits, factionReasons, roleReasons, traitReasons });
      } catch (e) {
        if (!alive) return;
        setAdvMeta({ factions: [], roles: [], traits: [], factionReasons: {}, roleReasons: {}, traitReasons: {} });
      }
    }
    load();
    return () => { alive = false; };
  }, [detail]);
  return (
    <Box w="100%" p={4}>
      {detailLoading && (
        <VStack align="stretch" spacing={3}>
          <Skeleton height="6" width="60%" startColor="gray.600" endColor="gray.500" />
          <SkeletonText noOfLines={6} spacing="3" skeletonHeight="3" startColor="gray.700" endColor="gray.600" />
        </VStack>
      )}
      {!detailLoading && !detail && (
        <Text fontSize="sm" color="gray.500">
          Select a result to see details.
        </Text>
      )}
      {!detailLoading && detail && (
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold" color="gray.100">
              {detail.name}
            </Text>
            <HStack spacing={3} align="center">
              {'price' in detail && (detail as any).price != null && (
                <HStack spacing={1}>
                  <Text as="span" fontSize="sm" color="gray.400" title="Price">
                      ᖬ
                  </Text>
                  <Text as="span" fontSize="sm" color="gray.300">
                    {String((detail as any).price)}
                  </Text>
                    <Text as="span" fontSize="sm" color="gray.300">
                        (R)
                    </Text>
                </HStack>
              )}
              {'rarity' in detail && (detail as any).rarity != null && (
                <HStack spacing={2}>
                  <HStack spacing={1}>
                    <Text as="span" fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em">
                      Rarity
                    </Text>
                    <Text as="span" fontSize="sm" color="gray.300">
                      {String((detail as any).rarity)}
                    </Text>
                  </HStack>
                </HStack>
              )}
            <Badge colorScheme="purple" variant="solid" borderRadius="md" px={2}>
                {detail.type}
            </Badge>
            </HStack>
          </HStack>

          {/* Inferred meta for adversaries: Factions, Roles, Traits */}
          {(((detail as any).__kind ?? detail.type) === 'adversary') && advMeta && (
            <VStack align="stretch" spacing={2}>
              {advMeta.factions && advMeta.factions.length > 0 && (
                <HStack>
                  <Text as="span" fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em" minW="72px">
                    Faction
                  </Text>
                  <Wrap spacing={2} shouldWrapChildren>
                    {advMeta.factions.map((f) => (
                      <Tooltip key={`tf-${f}`} placement="top" hasArrow bg="gray.700" color="gray.100" label={
                        <Box>
                          {(advMeta.factionReasons?.[f] || ['Inferred from tags/name']).map((line, i) => (
                            <Text key={i} fontSize="xs">• {line}</Text>
                          ))}
                        </Box>
                      }>
                        <Tag colorScheme="blue" variant="subtle" size="sm">
                          {f}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Wrap>
                </HStack>
              )}
              {advMeta.roles && advMeta.roles.length > 0 && (
                <HStack>
                  <Text as="span" fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em" minW="72px">
                    Role
                  </Text>
                  <Wrap spacing={2} shouldWrapChildren>
                    {advMeta.roles.map((r) => (
                      <Tooltip key={`tr-${r}`} placement="top" hasArrow bg="gray.700" color="gray.100" label={
                        <Box>
                          {(advMeta.roleReasons?.[r] || ['Inferred from skills/gear']).map((line, i) => (
                            <Text key={i} fontSize="xs">• {line}</Text>
                          ))}
                        </Box>
                      }>
                        <Tag colorScheme="green" variant="subtle" size="sm">
                          {r}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Wrap>
                </HStack>
              )}
              {advMeta.traits && advMeta.traits.length > 0 && (
                <HStack>
                  <Text as="span" fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em" minW="72px">
                    Traits
                  </Text>
                  <Wrap spacing={2} shouldWrapChildren>
                    {advMeta.traits.map((t) => (
                      <Tooltip key={`tt-${t}`} placement="top" hasArrow bg="gray.700" color="gray.100" label={
                        <Box>
                          {(advMeta.traitReasons?.[t] || ['Inferred from stats/qualities']).map((line, i) => (
                            <Text key={i} fontSize="xs">• {line}</Text>
                          ))}
                        </Box>
                      }>
                        <Tag colorScheme="orange" variant="subtle" size="sm">
                          {t}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Wrap>
                </HStack>
              )}
            </VStack>
          )}

          {(((detail as any).__kind ?? detail.type) === 'talent') && (
            <HStack spacing={2} mt={1} wrap="wrap">
              {((detail as any).activationLabel ?? (detail as any).activation) && (
                <Tag colorScheme="purple" variant="subtle">
                  {String((detail as any).activationLabel ?? (detail as any).activation)}
                </Tag>
              )}
              {Boolean((detail as any).ranked) && (
                <Tag colorScheme="purple" variant="subtle">Ranked</Tag>
              )}
            </HStack>
          )}

          {(((detail as any).__kind ?? detail.type) === 'quality') && (
            <Text fontSize="sm" color="gray.400" mt={0.5}>
              {(() => {
                const parts: string[] = [];
                if ((detail as any).category) parts.push(String((detail as any).category)); // Active/Passive
                if ('ranked' in (detail as any)) parts.push((detail as any).ranked ? 'Ranked' : 'Not Ranked');
                return parts.join(' • ');
              })()}
            </Text>
          )}

            {(['armor', 'gear', 'weapon', 'attachment'] as const).includes(((detail as any).__kind ?? detail.type) as any) && (
            <Box>
              <Box overflowX="auto" whiteSpace="nowrap">
                <HStack as="span" spacing={3}>
                  {[
                    {
                      label: 'Damage',
                      show:
                        ((detail as any).__kind ?? detail.type) === 'weapon' &&
                        ((('damage' in detail) && (detail as any).damage != null) || (('damageAdd' in detail) && (detail as any).damageAdd != null)),
                      value: String((((detail as any).damage != null && Number((detail as any).damage) !== 0)
                        ? (detail as any).damage
                        : ((detail as any).damageAdd ?? (detail as any).damage))),
                      prefix:
                        (((detail as any).damage != null && Number((detail as any).damage) !== 0)
                          ? ''
                          : ((detail as any).damageAdd != null && Number((detail as any).damageAdd) !== 0) ? '+' : ''),
                    },
                    {
                      label: 'Crit',
                      show:
                        ((detail as any).__kind ?? detail.type) === 'weapon' &&
                        'crit' in detail &&
                        (detail as any).crit != null,
                      value: String((detail as any).crit),
                      prefix: '',
                    },
                    {
                      label: 'Range',
                      show:
                        ((detail as any).__kind ?? detail.type) === 'weapon' &&
                        'range' in detail &&
                        Boolean((detail as any).range),
                      value: String((detail as any).range),
                      prefix: '',
                    },
                    {
                      label: 'Skill',
                      show:
                        ((detail as any).__kind ?? detail.type) === 'weapon' &&
                        'skill' in detail &&
                        Boolean((detail as any).skill),
                      value: String((detail as any).skill),
                      prefix: '',
                    },
                    {
                      label: 'Soak',
                      show: 'soak' in detail && (detail as any).soak != null,
                      value: String((detail as any).soak),
                      prefix: '+',
                    },
                    {
                      label: 'Defense',
                      show: 'defense' in detail && (detail as any).defense != null,
                      value: String((detail as any).defense),
                      prefix: '+',
                    },
                    {
                      label: ((detail as any).__kind ?? detail.type) === 'attachment' ? 'Hardpoints Required' : 'HP',
                      show:
                        (('hardPoints' in detail && (detail as any).hardPoints != null) ||
                          ('hp' in detail && (detail as any).hp != null)) &&
                        Number((detail as any).hardPoints ?? (detail as any).hp) !== 0,
                      value: String((detail as any).hardPoints ?? (detail as any).hp),
                      prefix: '',
                    },                    {
                      label: 'Encum',
                      show: 'encum' in detail && (detail as any).encum != null && Number((detail as any).encum) !== 0,
                      value: String((detail as any).encum),
                      prefix: '',
                    },
                  ]
                    .filter((s) => s.show)
                    .map((s) => (
                      <HStack as="span" key={s.label} spacing={2}>
                        <Text
                          as="span"
                          fontSize="xs"
                          color="gray.500"
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                        >
                          {s.label}
                        </Text>
                        <Text as="span" fontSize="sm" color="gray.200" fontWeight="semibold">
                          {s.prefix}
                          {s.value}
                        </Text>
                      </HStack>
                    ))}
                </HStack>
              </Box>

              {/* Weapon/Item Qualities */}
              {normalizeQualities(detail).length > 0 && (
                <Box mt={3}>
                  <Wrap spacing={2} shouldWrapChildren>
                    {normalizeQualities(detail).map((q: string) => (
                      <Tag key={`q-${q}`} colorScheme="gray" variant="outline" size="sm">
                        {q}
                      </Tag>
                    ))}
                  </Wrap>
                </Box>
              )}

              {/* Base Mods (weapons and attachments) */}
              {normalizeBaseMods(detail).length > 0 && (
                <Box mt={3}>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                    Base Modifier
                  </Text>
                  <Wrap spacing={2} shouldWrapChildren>
                    {normalizeBaseMods(detail).map((m: string, i: number) => (
                      <Tag key={`basemod-${i}`} colorScheme="gray" variant="outline" size="sm">
                        <Interweave content={oggInlineToHtml(String(m))} />
                      </Tag>
                    ))}
                  </Wrap>
                </Box>
              )}

              {/* Added Mods (attachments customization) */}
              {Array.isArray((detail as any).addedMods) && (detail as any).addedMods.length > 0 && (
                <Box mt={3}>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                    Modification Options
                  </Text>
                  <Wrap spacing={2} shouldWrapChildren>
                    {(detail as any).addedMods.map((m: string, i: number) => (
                      <Tag key={`addedmod-${i}`} colorScheme="gray" variant="outline" size="sm">
                        <Interweave content={oggInlineToHtml(String(m))} />
                      </Tag>
                    ))}
                  </Wrap>
                </Box>
              )}

            </Box>
          )}

          {/* Description + Source grouped to reduce inter-block spacing */}
          <Box>
            {detail.html ? (
              <Box className="spotlight-detail-html" color="gray.200" sx={{ '& p:last-child, & ul:last-child, & ol:last-child, & blockquote:last-child, & pre:last-child': { marginBottom: 0 } }}>
                <Interweave content={detail.html} />
              </Box>
            ) : detail.markdown ? (
              <Box className="spotlight-detail-html" color="gray.200" sx={{ '& p:last-child, & ul:last-child, & ol:last-child, & blockquote:last-child, & pre:last-child': { marginBottom: 0 } }}>
                <Interweave content={oggToHtml(detail.markdown)} />
              </Box>
            ) : detail.description ? (
              <Box className="spotlight-detail-html" color="gray.200" sx={{ '& p:last-child, & ul:last-child, & ol:last-child, & blockquote:last-child, & pre:last-child': { marginBottom: 0 } }}>
                <Interweave content={oggToHtml(detail.description)} />
              </Box>
            ) : (
              <Box>
                <Text fontSize="sm" color="gray.300">
                  No description available.
                </Text>
                <Box mt={3}>
                  {Object.entries(detail)
                    .filter(([k]) =>
                      ![
                        'id',
                        'name',
                        'type',
                        'html',
                        'markdown',
                        'description',
                        '__kind',
                        'activation',
                        'activationLabel',
                        'ranked',
                        'source',
                      ].includes(k)
                    )
                    .map(([k, v]) => (
                      <HStack key={k} align="start" spacing={3}>
                        <Text minW="140px" fontWeight="semibold" color="gray.400">
                          {k}
                        </Text>
                        <Text flex="1" whiteSpace="pre-wrap" fontSize="sm" color="gray.200">
                          {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                        </Text>
                      </HStack>
                    ))}
                </Box>
              </Box>
            )}

          </Box>
        </VStack>
      )}
    </Box>
  );
};

export default SpotlightDetailPane;
