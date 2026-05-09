import React, {useState} from 'react';
import {HStack, IconButton, Tooltip, useToast} from "@chakra-ui/react";
import {AddIcon} from "@chakra-ui/icons";
import {FaSpaceShuttle, FaUsers} from "react-icons/fa";
import ContentCardOld from "@/ContentCardOld";
import TargetListOld from "@components/TargetListOld";
import AdversarySelector from "@components/adversaries/AdversarySelector";
import AddPCModal from "@components/adversaries/AddPCModal";
import adversaryService from "@/services/adversaryService";
import useParticipantStore from "@/state/participantsStore";
import {useSpotlightStore} from "@/state/spotlightStore";
import {ReactComponent as AbilitySvg} from "@/assets/dice/ability.svg";
import {ReactComponent as SetbackSvg} from "@/assets/dice/setback.svg";
import {ReactComponent as DifficultySvg} from "@/assets/dice/difficulty.svg";
import {ReactComponent as ChallengeSvg} from "@/assets/dice/challenge.svg";

type AdversaryType = 'Minion' | 'Rival' | 'Nemesis' | undefined;

const ContentCardTargetsOld = () => {
  const addParticipant = useParticipantStore((state) => state.addParticipant);
  const openSpotlight = useSpotlightStore((s) => s.open);
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [isPcOpen, setPcOpen] = useState(false);
  const [loadingType, setLoadingType] = useState<AdversaryType | 'any' | null>(null);
  const toast = useToast();

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
      <Tooltip label="Add starship">
        <IconButton
          aria-label="Add starship"
          icon={<FaSpaceShuttle/>}
          size="sm"
          variant="ghost"
          onClick={() => openSpotlight(['vehicle'])}
        />
      </Tooltip>
    </HStack>
  );

  return (
    <>
      <ContentCardOld heading="Targets" buttons={buttons} icon={<FaUsers/>}>
        <TargetListOld/>
      </ContentCardOld>
      <AdversarySelector isOpen={isSelectorOpen} onClose={() => setSelectorOpen(false)}/>
      <AddPCModal isOpen={isPcOpen} onClose={() => setPcOpen(false)}/>
    </>
  );
};

export default ContentCardTargetsOld;
