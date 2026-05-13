import React, {useState} from 'react';
import {Box, Flex, HStack, IconButton, Tooltip, useToast} from "@chakra-ui/react";
import {AddIcon} from "@chakra-ui/icons";
import {FaSpaceShuttle, FaUsers} from "react-icons/fa";
import ContentCardOld from "@/ContentCardOld";
import TargetListOld from "@components/TargetListOld";
import MiniStatCard from "@components/target/MiniStatCard";
import AdversarySelector from "@components/adversaries/AdversarySelector";
import AddPCModal from "@components/adversaries/AddPCModal";
import adversaryService from "@/services/adversaryService";
import useParticipantStore from "@/state/participantsStore";
import useActiveVehicleStore, {buildVehicleSpecFromSpotlight} from "@/state/activeVehicleStore";
import {browseIndex, getDetail} from "@/data/spotlightIndex";
import {ReactComponent as AbilitySvg} from "@/assets/dice/ability.svg";
import {ReactComponent as SetbackSvg} from "@/assets/dice/setback.svg";
import {ReactComponent as DifficultySvg} from "@/assets/dice/difficulty.svg";
import {ReactComponent as ChallengeSvg} from "@/assets/dice/challenge.svg";

type AdversaryType = 'Minion' | 'Rival' | 'Nemesis' | undefined;

// Vehicle `info.type` is a hierarchical "category/subtype" string
// (e.g. "starfighter/tie series", "walker/at-pt"). The first segment is the
// category — exclude ground/atmospheric craft so "Add starship" doesn't drop
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

const ContentCardTargetsOld = () => {
  const addParticipant = useParticipantStore((state) => state.addParticipant);
  const addVehicle = useActiveVehicleStore((s) => s.add);
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [isPcOpen, setPcOpen] = useState(false);
  const [loadingType, setLoadingType] = useState<AdversaryType | 'any' | null>(null);
  const toast = useToast();

  const handleAddRandomStarship = () => {
    const all = browseIndex(5000, ['vehicle']);
    const candidates: any[] = [];
    for (const e of all) {
      const detail = getDetail('vehicle', e.id);
      if (detail && isStarship(detail)) candidates.push(detail);
    }
    if (candidates.length === 0) {
      toast({title: 'No starships available', status: 'error', duration: 3000, isClosable: true});
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

  const handleAddRandomAdversary = async (type?: AdversaryType) => {
    const loadKey = type ?? 'any';
    setLoadingType(loadKey);
    try {
      const adversary = await adversaryService.getRandomAdversary(type);
      if (!adversary) {
        toast({
          title: 'No adversaries available',
          description: type ? `Could not find any ${type} adversaries` : 'Could not find any adversaries to add',
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
      toast({title: 'Error adding random adversary', status: 'error', duration: 3000, isClosable: true});
    } finally {
      setLoadingType(null);
    }
  };

  const buttons = (
    <HStack spacing={2}>
      <Tooltip label="Add Player Character">
        <IconButton
          aria-label="Add player character"
          icon={<AbilitySvg width={20}/>}
          size="sm"
          variant="ghost"
          onClick={() => setPcOpen(true)}
        />
      </Tooltip>
      <Tooltip label="Add Minion">
        <IconButton
          aria-label="Add Minion adversary"
          icon={<SetbackSvg width={18}/>}
          size="sm"
          variant="ghost"
          isLoading={loadingType === 'Minion'}
          onClick={() => handleAddRandomAdversary('Minion')}
        />
      </Tooltip>
      <Tooltip label="Add Rival">
        <IconButton
          aria-label="Add Rival adversary"
          icon={<DifficultySvg width={20}/>}
          size="sm"
          variant="ghost"
          isLoading={loadingType === 'Rival'}
          onClick={() => handleAddRandomAdversary('Rival')}
        />
      </Tooltip>
      <Tooltip label="Add Nemesis">
        <IconButton
          aria-label="Add Nemesis adversary"
          icon={<ChallengeSvg width={20}/>}
          size="sm"
          variant="ghost"
          isLoading={loadingType === 'Nemesis'}
          onClick={() => handleAddRandomAdversary('Nemesis')}
        />
      </Tooltip>
      <Tooltip label="Add specific adversary">
        <IconButton
          aria-label="Add specific adversary"
          icon={<AddIcon/>}
          size="sm"
          colorScheme="blue"
          variant="ghost"
          onClick={() => setSelectorOpen(true)}
          isDisabled={loadingType !== null}
        />
      </Tooltip>
      <Tooltip label="Add random starship">
        <IconButton
          aria-label="Add random starship"
          icon={<FaSpaceShuttle/>}
          size="sm"
          variant="ghost"
          onClick={handleAddRandomStarship}
        />
      </Tooltip>
    </HStack>
  );

  return (
    <>
      <ContentCardOld heading="Targets" buttons={buttons} icon={<FaUsers/>}>
        {/* Flex column lets MiniStatCard size to its content while the target
            list takes the remaining height and scrolls internally — without
            this, TargetListOld's h="100%" stacks on top of the mini card and
            forces the whole CardBody to scroll. */}
        <Flex direction="column" h="100%" minH={0}>
          <MiniStatCard/>
          <Box flex="1" minH={0} overflowY="auto">
            <TargetListOld/>
          </Box>
        </Flex>
      </ContentCardOld>
      <AdversarySelector isOpen={isSelectorOpen} onClose={() => setSelectorOpen(false)}/>
      <AddPCModal isOpen={isPcOpen} onClose={() => setPcOpen(false)}/>
    </>
  );
};

export default ContentCardTargetsOld;
