import React from 'react';
import {FaUserShield} from "react-icons/fa";
import ContentCardOld from "@/ContentCardOld";
import {useParticipantSheetView} from "@components/ParticipantSheetView";
import useGameplayStore from "@/state/newGameplayStore";
import useParticipantStore from "@/state/participantsStore";

const ContentCardActiveOld = () => {
    const activeParticipantId = useGameplayStore(state => state.context.activeParticipantId);
    const participants = useParticipantStore(state => state.participants);
    const activeParticipant = participants.find(p => p.id === activeParticipantId) ?? null;

    const {toggle, body} = useParticipantSheetView(activeParticipant);

    if (!activeParticipant) {
        return (
            <ContentCardOld heading="Active" icon={<FaUserShield/>}>
                No active target is selected.
            </ContentCardOld>
        );
    }

    return (
        <ContentCardOld heading="Active" icon={<FaUserShield/>} buttons={toggle ?? undefined}>
            {body}
        </ContentCardOld>
    );
};

export default ContentCardActiveOld;
