import React from 'react';
import {Button, Text} from "@chakra-ui/react";
import {FaCrosshairs} from "react-icons/fa";
import ContentCardOld from "@/ContentCardOld";
import StatSheetOld from "@components/StatSheetOld";
import useParticipantStore from "@/state/participantsStore";
import useGameplayStore from "@/state/newGameplayStore";

const ContentCardTargetedOld = () => {
  const participants = useParticipantStore((state) => state.participants);
  const selectedParticipantId = useParticipantStore((state) => state.selectedParticipantId);
  const setActiveParticipantId = useGameplayStore((state) => state.setActiveParticipantId);
  const activeParticipantId = useGameplayStore((state) => state.context.activeParticipantId);

  const selected = participants.find((p) => p.id === selectedParticipantId) ?? null;
  const isAlreadyActive = selected != null && selected.id === activeParticipantId;

  const buttons = selected ? (
    <Button
      size="sm"
      colorScheme="blue"
      onClick={() => setActiveParticipantId(selected.id)}
      isDisabled={isAlreadyActive}
    >
      {isAlreadyActive ? "Active" : "Set Active"}
    </Button>
  ) : undefined;

  return (
    <ContentCardOld heading="Targeted" buttons={buttons} icon={<FaCrosshairs/>}>
      {selected ? (
        <StatSheetOld participant={selected}/>
      ) : (
        <Text color="gray.400">No target selected — click a row in Targets.</Text>
      )}
    </ContentCardOld>
  );
};

export default ContentCardTargetedOld;
