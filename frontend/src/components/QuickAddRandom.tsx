import React, { useState } from 'react';
import { Box, Divider, HStack, IconButton, Text, Tooltip, useToast } from '@chakra-ui/react';
import { FaSpaceShuttle } from 'react-icons/fa';
import AddPCModal from '@components/adversaries/AddPCModal';
import adversaryService from '@/services/adversaryService';
import useParticipantStore from '@/state/participantsStore';
import useActiveVehicleStore, { buildVehicleSpecFromSpotlight } from '@/state/activeVehicleStore';
import { browseIndex, getDetail } from '@/data/spotlightIndex';
import { ReactComponent as AbilitySvg } from '@/assets/dice/ability.svg';
import { ReactComponent as SetbackSvg } from '@/assets/dice/setback.svg';
import { ReactComponent as DifficultySvg } from '@/assets/dice/difficulty.svg';
import { ReactComponent as ChallengeSvg } from '@/assets/dice/challenge.svg';

/**
 * QuickAddRandom — a muted utility cluster for dropping a participant into the
 * encounter without leaving the page: a player character (opens the PC modal)
 * and one-tap *random* adversaries / starship. Lives in the Sidebar footer
 * (above the dev "Nuke" button) rather than the Targets card header — these are
 * scratch/quick-drop conveniences, kept out of the way of the deliberate "add
 * specific adversary" action in the live target controls.
 */

type AdversaryType = 'Minion' | 'Rival' | 'Nemesis';

// Vehicle `info.type` is a hierarchical "category/subtype" string
// (e.g. "starfighter/tie series", "walker/at-pt"). The first segment is the
// category — exclude ground/atmospheric craft so "random starship" doesn't drop
// a Speeder Bike into the encounter.
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
  if (!t) return true; // no category → assume starship rather than filter out
  const root = t.split('/')[0]?.trim() ?? '';
  return !NON_STARSHIP_CATEGORIES.has(root);
}

const QuickAddRandom: React.FC = () => {
  const addParticipant = useParticipantStore((s) => s.addParticipant);
  const addVehicle = useActiveVehicleStore((s) => s.add);
  const [loadingType, setLoadingType] = useState<AdversaryType | null>(null);
  const [isPcOpen, setPcOpen] = useState(false);
  const toast = useToast();

  const handleAddRandomStarship = () => {
    const all = browseIndex(5000, ['vehicle']);
    const candidates: any[] = [];
    for (const e of all) {
      const detail = getDetail('vehicle', e.id);
      if (detail && isStarship(detail)) candidates.push(detail);
    }
    if (candidates.length === 0) {
      toast({ title: 'No starships available', status: 'error', duration: 3000, isClosable: true });
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    addVehicle(buildVehicleSpecFromSpotlight(pick));
    toast({
      title: 'Starship added',
      description: pick.fullName ?? pick.name,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleAddRandomAdversary = async (type: AdversaryType) => {
    setLoadingType(type);
    try {
      const adversary = await adversaryService.getRandomAdversary(type);
      if (!adversary) {
        toast({
          title: 'No adversaries available',
          description: `Could not find any ${type} adversaries`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      const participant = adversaryService.convertToParticipant(adversary);
      addParticipant(participant);
      toast({
        title: 'Adversary added',
        description: `${adversary.name} (${adversary.type})`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error adding random adversary:', err);
      toast({ title: 'Error adding random adversary', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setLoadingType(null);
    }
  };

  const btnProps = {
    size: 'xs',
    variant: 'ghost',
    color: 'whiteAlpha.500',
    _hover: { bg: 'whiteAlpha.100', color: 'whiteAlpha.800' },
  } as const;

  return (
    <Box px={2} py={1.5} borderTopWidth="1px" borderColor="whiteAlpha.150">
      <Text fontSize="2xs" color="whiteAlpha.400" letterSpacing="0.16em" textTransform="uppercase" mb={1}>
        Quick add
      </Text>
      <HStack spacing={1}>
        <Tooltip label="Add player character">
          <IconButton
            aria-label="Add player character"
            icon={<AbilitySvg width={16} />}
            onClick={() => setPcOpen(true)}
            {...btnProps}
          />
        </Tooltip>
        <Divider orientation="vertical" h="18px" borderColor="whiteAlpha.200" />
        <Tooltip label="Add random Minion">
          <IconButton
            aria-label="Add random Minion adversary"
            icon={<SetbackSvg width={16} />}
            isLoading={loadingType === 'Minion'}
            onClick={() => handleAddRandomAdversary('Minion')}
            {...btnProps}
          />
        </Tooltip>
        <Tooltip label="Add random Rival">
          <IconButton
            aria-label="Add random Rival adversary"
            icon={<DifficultySvg width={18} />}
            isLoading={loadingType === 'Rival'}
            onClick={() => handleAddRandomAdversary('Rival')}
            {...btnProps}
          />
        </Tooltip>
        <Tooltip label="Add random Nemesis">
          <IconButton
            aria-label="Add random Nemesis adversary"
            icon={<ChallengeSvg width={18} />}
            isLoading={loadingType === 'Nemesis'}
            onClick={() => handleAddRandomAdversary('Nemesis')}
            {...btnProps}
          />
        </Tooltip>
        <Tooltip label="Add random starship">
          <IconButton
            aria-label="Add random starship"
            icon={<FaSpaceShuttle />}
            onClick={handleAddRandomStarship}
            {...btnProps}
          />
        </Tooltip>
      </HStack>
      <AddPCModal isOpen={isPcOpen} onClose={() => setPcOpen(false)} />
    </Box>
  );
};

export default QuickAddRandom;
