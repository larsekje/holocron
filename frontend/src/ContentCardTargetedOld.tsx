import React from 'react';
import {Button, Text} from "@chakra-ui/react";
import {FaCrosshairs} from "react-icons/fa";
import ContentCardOld from "@/ContentCardOld";
import VehicleStatSheetOld from "@components/VehicleStatSheetOld";
import {useParticipantSheetView} from "@components/ParticipantSheetView";
import useParticipantStore from "@/state/participantsStore";
import useActiveVehicleStore from "@/state/activeVehicleStore";
import useGameplayStore from "@/state/newGameplayStore";

const ContentCardTargetedOld = () => {
  const participants = useParticipantStore((state) => state.participants);
  const selectedParticipantId = useParticipantStore((state) => state.selectedParticipantId);
  const setActiveParticipantId = useGameplayStore((state) => state.setActiveParticipantId);
  const activeParticipantId = useGameplayStore((state) => state.context.activeParticipantId);

  const vehicles = useActiveVehicleStore((state) => state.vehicles);
  const selectedVehicleId = useActiveVehicleStore((state) => state.selectedVehicleId);
  const selectedVehicle = selectedVehicleId ? vehicles[selectedVehicleId] ?? null : null;

  const selectedParticipant = participants.find((p) => p.id === selectedParticipantId) ?? null;
  const isAlreadyActive = selectedParticipant != null && selectedParticipant.id === activeParticipantId;

  // Vehicle selection wins if both happen to be set (shouldn't, since the
  // click handlers cross-clear, but defensive). Vehicles don't have an
  // initiative slot, so the "Set Active" button is participant-only.
  const {toggle, body} = useParticipantSheetView(selectedVehicle ? null : selectedParticipant);

  const setActiveButton = selectedVehicle
    ? null
    : selectedParticipant
      ? (
        <Button
          size="sm"
          colorScheme="blue"
          onClick={() => setActiveParticipantId(selectedParticipant.id)}
          isDisabled={isAlreadyActive}
        >
          {isAlreadyActive ? "Active" : "Set Active"}
        </Button>
      )
      : null;

  const buttons = (toggle || setActiveButton) ? (
    <>
      {toggle}
      {setActiveButton}
    </>
  ) : undefined;

  return (
    <ContentCardOld heading="Targeted" buttons={buttons} icon={<FaCrosshairs/>}>
      {selectedVehicle ? (
        <VehicleStatSheetOld vehicle={selectedVehicle}/>
      ) : selectedParticipant ? (
        body
      ) : (
        <Text color="gray.400">No target selected — click a row in Targets.</Text>
      )}
    </ContentCardOld>
  );
};

export default ContentCardTargetedOld;
