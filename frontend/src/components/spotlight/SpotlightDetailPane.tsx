import React from 'react';
import {
  Badge,
  Box,
  Button,
  HStack,
  Skeleton,
  SkeletonText,
  Tag,
  Text,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import type { SpotlightDetail } from '@/state/spotlightStore';
import { Interweave } from 'interweave';
import { oggToHtml, oggInlineToHtml } from '@/utils/oggMarkup';
import DetailStat from './DetailStat';
import StatSheetOld from '@components/StatSheetOld';
import VehiclePreview from './VehiclePreview';
import useParticipantStore from '@/state/participantsStore';
import adversaryService from '@/services/adversaryService';
import { useSpotlightStore } from '@/state/spotlightStore';
import type { Adversary } from '@/types/adversaryTypes';

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
      {/* Adversaries render the shared encounter character sheet (StatSheetOld)
          so the catalog preview matches the in-encounter view exactly. It
          carries its own header + description, so the generic header/description
          blocks below are skipped for adversaries. */}
      {!detailLoading && detail && (((detail as any).__kind ?? detail.type) === 'adversary' ? (
        <AdversaryPreview detail={detail} />
      ) : (
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="bold" color="gray.100">
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
            <Badge colorScheme="purple" variant="subtle" borderRadius="md" px={2}>
                {detail.type}
            </Badge>
            </HStack>
          </HStack>

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

          {(((detail as any).__kind ?? detail.type) === 'vehicle') && (
            <VehiclePreview detail={detail}/>
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
      ))}
    </Box>
  );
};

export default SpotlightDetailPane;

const AdversaryPreview: React.FC<{detail: SpotlightDetail}> = ({detail}) => {
  const addParticipant = useParticipantStore((s) => s.addParticipant);
  const closeSpotlight = useSpotlightStore((s) => s.close);
  const toast = useToast();

  const buildAdversary = (): Adversary => ({
    name: (detail as any).name,
    type: (detail as any).adversaryType ?? 'Rival',
    characteristics: (detail as any).characteristics ?? {},
    derived: (detail as any).derived ?? {soak: 2, wounds: 8},
    skills: (detail as any).skills ?? {},
    talents: (detail as any).talents,
    abilities: (detail as any).abilities,
    weapons: (detail as any).weapons,
    gear: (detail as any).gear,
    tags: (detail as any).tags,
  } as Adversary);

  // Detached preview participant: convertToParticipant mints a fresh id that
  // never enters the store, so StatSheetOld's inline edit / wound controls are
  // inert here. Memoised on the entry id so the id stays stable while the user
  // looks at the same adversary.
  const previewParticipant = React.useMemo(
    () => adversaryService.convertToParticipant(buildAdversary()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(detail as any).id],
  );

  const handleAdd = () => {
    // Fresh participant (new id) so the encounter copy is independent of the
    // preview shown here.
    const participant = adversaryService.convertToParticipant(buildAdversary());
    addParticipant(participant);
    closeSpotlight();
    toast({
      title: 'Added to encounter',
      description: `${participant.name} (${participant.stats?.type ?? 'NPC'})`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <VStack align="stretch" spacing={3}>
      <Button
        size="sm"
        leftIcon={<AddIcon/>}
        bg="#d39939"
        color="#1a1d24"
        fontWeight="bold"
        letterSpacing="0.04em"
        _hover={{bg: "yellow.400"}}
        alignSelf="flex-start"
        onClick={handleAdd}
      >
        Add to encounter
      </Button>
      <StatSheetOld participant={previewParticipant}/>
    </VStack>
  );
};
