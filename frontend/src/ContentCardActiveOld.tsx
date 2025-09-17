import React from 'react';
import ContentCardOld from "@/ContentCardOld";
import StatSheet from "@components/participantStatus/StatSheet";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantStore from "@/state/participantsStore";

const ContentCardActiveOld = () => {
    // Get the active participant ID from the new gameplay store context
    const activeParticipantId = useGameplayStore(state => state.context.activeParticipantId);

    // Get all participants from the participant store
    const participants = useParticipantStore(state => state.participants);
    
    // Find the active participant using the ID
    const activeParticipant = participants.find(p => p.id === activeParticipantId);

    if (!activeParticipant) {
        return (
            <ContentCardOld heading={"Active"}>
                No active target is selected.
            </ContentCardOld>
        );
    }

    return (
        <ContentCardOld heading="Active">
            <StatSheet participant={activeParticipant} />
        </ContentCardOld>
    );
};

export default ContentCardActiveOld;
